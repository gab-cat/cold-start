import pushNotifications from "@convex-dev/expo-push-notifications/convex.config";
import rag from "@convex-dev/rag/convex.config";
import { defineApp } from "convex/server";

const app = defineApp();
app.use(rag);
app.use(pushNotifications);

export default app;

