import { httpRouter } from "convex/server";
import { Webhook } from "svix";
import { api, internal } from "./_generated/api";
import { httpAction } from "./_generated/server";

const router = httpRouter();

// ============ FACEBOOK MESSENGER WEBHOOK ============

// GET /webhook - Verify webhook
router.route({
  path: "/webhook",
  method: "GET",
  handler: httpAction(async (ctx, request: Request) => {
    const url = new URL(request.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    if (
      mode === "subscribe" &&
      token === process.env.APP_SECRET
    ) {
      return new Response(challenge, { status: 200 });
    }

    return new Response("Forbidden", { status: 403 });
  }),
});

// POST /webhook - Receive messages
router.route({
  path: "/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request: Request) => {
    const bodyText = await request.text();
    const body = JSON.parse(bodyText);

    // Verify signature using Web Crypto API
    const signature = request.headers.get("x-hub-signature-256");
    const isValid = await verifyMessengerSignature(signature, bodyText);
    if (!isValid) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Log raw event for audit trail
    await ctx.runMutation(internal.webhookEvents.storeWebhookEvent, {
      messengerEventRaw: body,
      processingStatus: "received",
    });

    // Process each entry
    if (body.object === "page") {
      for (const entry of body.entry) {
        for (const messaging of entry.messaging) {
          const senderPsid = messaging.sender.id;
          const messageId = messaging.message?.mid;

          // Skip if no message ID (shouldn't happen, but safety check)
          if (!messageId) {
            console.warn("Received message without mid, skipping");
            continue;
          }

          // Check if this message was already processed (deduplication)
          const alreadyProcessed = await ctx.runMutation(
            internal.webhookEvents.checkAndMarkMessageProcessed,
            { messageId, senderPsid }
          );

          if (alreadyProcessed) {
            console.log(`Skipping duplicate message: ${messageId}`);
            continue;
          }

          // Handle text messages
          if (messaging.message && messaging.message.text) {
            const userMessage = messaging.message.text;

            // Delegate to action for processing
            await ctx.runAction(
              api.actions.messenger.processMessage,
              {
                senderPsid,
                userMessage,
                timestamp: messaging.timestamp,
              }
            );
          }

          // Handle image attachments (primarily for food scanning)
          if (messaging.message && messaging.message.attachments) {
            for (const attachment of messaging.message.attachments) {
              if (attachment.type === "image" && attachment.payload?.url) {
                const imageUrl = attachment.payload.url;

                // Delegate to image processing action
                await ctx.runAction(
                  api.actions.messenger.processImageMessage,
                  {
                    senderPsid,
                    imageUrl,
                    timestamp: messaging.timestamp,
                  }
                );
              }
            }
          }
        }
      }
    }

    return new Response("EVENT_RECEIVED", { status: 200 });
  }),
});

// Use Web Crypto API (SubtleCrypto) for HMAC verification
async function verifyMessengerSignature(
  signature: string | null,
  body: string
): Promise<boolean> {
  if (!signature) return false;

  const appSecret = process.env.APP_SECRET;
  if (!appSecret) return false;

  try {
    // Encode the secret and body
    const encoder = new TextEncoder();
    const keyData = encoder.encode(appSecret);
    const bodyData = encoder.encode(body);

    // Import the key for HMAC
    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    // Sign the body
    const signatureBuffer = await crypto.subtle.sign("HMAC", key, bodyData);

    // Convert to hex string
    const hashArray = Array.from(new Uint8Array(signatureBuffer));
    const hash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    const expectedSignature = `sha256=${hash}`;
    return signature === expectedSignature;
  } catch (error) {
    console.error("Error verifying signature:", error);
    return false;
  }
}

// ============ CLERK WEBHOOK ============

// POST /clerk-webhook - Handle Clerk user events
router.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request: Request) => {
    const bodyText = await request.text();
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });

    // Verify webhook signature using svix
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("CLERK_WEBHOOK_SECRET not configured");
      return new Response("Webhook secret not configured", { status: 500 });
    }

    try {
      const wh = new Webhook(webhookSecret);
      const payload = wh.verify(bodyText, headers) as any;

      // Log raw event for audit trail
      await ctx.runMutation(internal.webhookEvents.storeWebhookEvent, {
        clerkEventRaw: payload,
        processingStatus: "received",
      });

      // Handle different event types
      const eventType = payload.type;

      if (eventType === "user.created") {
        await ctx.runMutation(internal.clerkWebhook.handleUserCreated, {
          clerkId: payload.data.id,
          email: payload.data.email_addresses[0]?.email_address || "",
          firstName: payload.data.first_name,
          lastName: payload.data.last_name,
        });
      } else if (eventType === "user.updated") {
        await ctx.runMutation(internal.clerkWebhook.handleUserUpdated, {
          clerkId: payload.data.id,
          email: payload.data.email_addresses[0]?.email_address,
          firstName: payload.data.first_name,
          lastName: payload.data.last_name,
        });
      } else if (eventType === "user.deleted") {
        await ctx.runMutation(internal.clerkWebhook.handleUserDeleted, {
          clerkId: payload.data.id,
        });
      }

      return new Response("OK", { status: 200 });
    } catch (error: any) {
      console.error("Clerk webhook verification failed:", error);
      return new Response("Unauthorized", { status: 401 });
    }
  }),
});

export default router;
