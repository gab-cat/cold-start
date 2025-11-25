<!-- 6012a116-7f1b-4f77-89e4-90ab1087d980 aee9fdff-878f-49b3-ab5e-ee44c9a22cd9 -->
# Messenger Bot Unique Code Flow Implementation

## Overview

Implement a flow where users receive a unique code upon account creation, which they provide to the Messenger bot to link their Messenger account. The code is reusable and can replace existing Messenger links.

## Implementation Steps

### 1. Schema Updates

**File**: `convex/schema.ts`

- Add `uniqueCode: v.string()` field to the `users` table
- Add index `by_unique_code` on `uniqueCode` for fast lookups

### 2. Code Generation on User Creation

**File**: `convex/clerkWebhook.ts`

- Modify `handleUserCreated` to generate a short UUID-like code (8 characters, alphanumeric)
- Store the code in the user record when creating the user
- Use a cryptographically secure random generator to ensure uniqueness

### 3. Display Code After Sign-Up

**File**: `app/(auth)/sign-up.tsx`

- After successful email verification and session activation, fetch the user's unique code
- Display a modal or screen showing the unique code with instructions
- Include a "Copy Code" button and a "Continue to Dashboard" button
- Store the code in a way that's accessible for display

### 4. Display Code on Profile Page

**File**: `app/(tabs)/profile.tsx`

- Add a new section showing the unique code
- Display it prominently with copy functionality
- Show connection status (whether Messenger is linked or not)

### 5. Messenger Bot Code Verification Flow

**File**: `convex/actions/messenger.ts`

- Modify `processMessage` to check if user has `messengerPsid`
- If no `messengerPsid` exists:
- Check if the incoming message matches a unique code pattern
- If it's a code, validate it against the database
- If valid, link the `messengerPsid` to the user (replace if already linked to another user)
- Send confirmation message and proceed with normal flow
- If not a code or invalid, ask for the unique code
- If `messengerPsid` exists, proceed with normal interaction

### 6. Code Validation and Linking Logic

**File**: `convex/users.ts`

- Add `getUserByUniqueCode` query (internal) to find user by code
- Add `linkMessengerPsidByCode` mutation (internal) to:
- Find user by unique code
- If code is already linked to another Messenger account, unlink the old one
- Link the new `messengerPsid` to the user
- Return success/error status

### 7. Code Format Generation

**File**: `convex/clerkWebhook.ts` or new utility file

- Create a function to generate 8-character alphanumeric codes (e.g., "a1b2c3d4")
- Ensure codes are unique by checking against existing codes
- Use crypto.randomBytes or similar secure random generation

## Key Files to Modify

1. `convex/schema.ts` - Add uniqueCode field and index
2. `convex/clerkWebhook.ts` - Generate code on user creation
3. `app/(auth)/sign-up.tsx` - Display code after sign-up
4. `app/(tabs)/profile.tsx` - Display code on profile
5. `convex/actions/messenger.ts` - Handle code verification in bot flow
6. `convex/users.ts` - Add code lookup and linking functions

## Edge Cases to Handle

- Code collision: Retry generation if code already exists
- Code already linked: Replace existing Messenger link
- Invalid code format: Validate format before database lookup
- User not found: Handle gracefully with error message