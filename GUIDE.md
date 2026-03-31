# meta-cloud-api-wrapper: User Guide

Welcome to the **meta-cloud-api-wrapper** guide! This document provides everything you need to know to implement a robust, type-safe, and production-ready WhatsApp Cloud API integration.

---

## 📑 Table of Contents
1. [Introduction](#1-introduction)
2. [Why use this wrapper?](#2-why-use-this-wrapper)
3. [Prerequisites & App Setup](#3-prerequisites--app-setup)
4. [Installation](#4-installation)
5. [Webhook Lifecycle](#5-webhook-lifecycle)
    - [Phase 1: Verification (The `GET` Request)](#phase-1-verification-the-get-request)
    - [Phase 2: Event Processing (The `POST` Request)](#phase-2-event-processing-the-post-request)
6. [Core API Implementation](#6-core-api-implementation)
    - [The `parseWebhook` function](#the-parsewebhook-function)
    - [Understanding the Payload Structure](#understanding-the-payload-structure)
7. [Handling Incoming Messages (User → You)](#7-handling-incoming-messages-user--you)
    - [Text Messages](#text-messages)
    - [Media (Images, Videos, Voice)](#media-images-videos-voice)
    - [Interactive Components (Buttons, Lists)](#interactive-components-buttons-lists)
8. [Handling Message Statuses (You → User)](#8-handling-message-statuses-you--user)
9. [Advanced Usage](#9-advanced-usage)
    - [Extending the Parser](#extending-the-parser)
    - [Security & Meta Signatures](#security--meta-signatures)
10. [Production Checklist](#10-production-checklist)

---

## 1. Introduction
The WhatsApp Cloud API (Meta Graph API) sends webhooks in a deeply nested JSON structure:
`entry -> changes -> value -> messages[]`.
This structure is complex to parse manually and prone to breaking changes. **meta-cloud-api-wrapper** flattens this complexity into a clean, type-safe interface.

## 2. Why use this wrapper?
- **Flattened Payloads**: Access nested data directly as the root `IncomingPayload` or `OutgoingPayload`.
- **Discriminated Unions**: Switch on `message.type` or `status` with 100% TypeScript accuracy.
- **Fail-Safe**: Never throws errors. Any unexpected payload results in a `success: false` result rather than crashing your server.
- **Zero Dependencies**: Lightweight and fast, perfect for serverless (Edge/Lambda).

---

## 3. Prerequisites & App Setup
Before coding, follow these steps in the [Meta App Dashboard](https://developers.facebook.com/):

1. **Create an App**: Choose the "Business" type.
2. **Add WhatsApp Product**: Set up a test phone number.
3. **Generate a Permanent Token**: Required for sending messages (not for webhooks, but essential for the full loop).
4. **Configure Webhooks**:
   - **Callback URL**: Your public server URL (use `ngrok` for local development).
   - **Verify Token**: A secret string you create.
   - **Webhooks Fields**: Subscribe to `messages`.

---

## 4. Installation
Install the package using your favorite package manager:

```bash
# npm
npm install meta-cloud-api-wrapper

# Bun (recommended for performance)
bun add meta-cloud-api-wrapper
```

---

## 5. Webhook Lifecycle

### Phase 1: Verification (The `GET` Request)
Meta sends a one-time `GET` request to verify you own the endpoint. Your code must respond with the `hub.challenge` value.

**Example (Express):**
```ts
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});
```

### Phase 2: Event Processing (The `POST` Request)
This is where the wrapper shines. All actual messages/updates arrive here.

---

## 6. Core API Implementation

### The `parseWebhook` function
`parseWebhook` accepts the raw body of the request and returns an array of `ParseResult`. Why an array? Because Meta may batch multiple events into a single request.

```ts
import { parseWebhook } from 'meta-cloud-api-wrapper';

app.post('/webhook', (req, res) => {
  const results = parseWebhook(req.body);

  for (const result of results) {
    if (!result.success) {
      console.warn('Parsing issue:', result.error);
      continue; // Skip invalid events
    }

    // result.data is now your clean payload
    if (result.data.stream === 'incoming') {
       // user message
    } else {
       // status update
    }
  }

  // ALWAYS return 200 immediately to prevent Meta from retrying
  res.sendStatus(200);
});
```

### Understanding the Payload Structure
A `ParseResult` is a union of three states:
| Stream | `result.data` | Description |
| :--- | :--- | :--- |
| `incoming` | `IncomingPayload` | User sent a message to the Business. |
| `outgoing` | `OutgoingPayload` | Status notification for a message you sent earlier. |
| `failed` | `ParseError` | Parsing error details. |

---

## 7. Handling Incoming Messages (User → You)
When `result.data.stream === 'incoming'`, switch on the `message.type`:

### Text Messages
```ts
if (message.type === 'text') {
  console.log(`Text from ${data.from.phone}: ${message.text.body}`);
}
```

### Media (Images, Videos, Voice)
Meta provides an `id`. Use this ID with the Graph API to fetch the media URL.
```ts
if (message.type === 'image') {
  const mediaId = message.image.id;
  const caption = message.image.caption; // optional
  const mime = message.image.mimeType;
  // Use the ID to fetch from: https://graph.facebook.com/v19.0/{mediaId}
}
```

### Interactive Components (Buttons, Lists)
Standard for building bots:
```ts
if (message.type === 'interactive') {
  if (message.interactive.type === 'button_reply') {
    const { id, title } = message.interactive.buttonReply;
    console.log(`User clicked button: ${title} (${id})`);
  }
  
  if (message.interactive.type === 'list_reply') {
    const { id, title, description } = message.interactive.listReply;
    console.log(`User selected list item: ${title} (${id})`);
  }
}
```

### Orders (E-commerce)
If you have a catalog linked, you can process incoming orders:
```ts
if (message.type === 'order') {
  const { catalogId, text, productItems } = message.order;
  console.log(`Order for Catalog ${catalogId}: ${text}`);
  
  for (const item of productItems) {
    console.log(`- SKU: ${item.productRetailerId}, Qty: ${item.quantity}, Price: ${item.itemPrice} ${item.currency}`);
  }
}
```

### Reactions
Handle when users react to your messages with emojis:
```ts
if (message.type === 'reaction') {
  console.log(`User reacted with ${message.reaction.emoji} to message ${message.reaction.messageId}`);
}
```

### Location & Address
```ts
if (message.type === 'location') {
  const { latitude, longitude, name, address } = message.location;
  console.log(`User is at ${name || 'Unknown'}: ${latitude}, ${longitude}`);
}
```

---

## 8. Handling Message Statuses (You → User)
Crucial for tracking delivery reliability (Sent → Delivered → Read).
```ts
if (result.data.stream === 'outgoing') {
  const { status, messageId } = result.data;
  
  if (status === 'failed') {
    console.error(`Message ${messageId} failed with codes:`, result.data.errors);
  } else {
    console.log(`Message ${messageId} current status: ${status}`);
  }
}
```

---

## 9. Advanced Usage

### Extending the Parser
If Meta releases a new feature and this library hasn't updated yet, you can register a custom parser:
```ts
import { messageRegistry } from 'meta-cloud-api-wrapper';

messageRegistry.register({
  type: 'future_feature',
  parse(rawPayload) {
    // rawPayload is the individual message object from Meta
    return {
      type: 'unknown',
      raw: rawPayload,
      customData: 'Extracted here'
    };
  }
});
```

---

## 10. Testing Your Integration
We recommend using **Vitest** for testing your webhook logic. You can use the mock payloads found in `__tests__/parser.test.ts` to simulate Meta events without needing to send real WhatsApp messages.

**Example Test:**
```ts
import { expect, test } from 'vitest';
import { parseWebhook } from 'meta-cloud-api-wrapper';

test('should handle my text message logic', () => {
  const mockPayload = { /* copy from __tests__/parser.test.ts */ };
  const results = parseWebhook(mockPayload);
  
  expect(results[0].success).toBe(true);
  // ... run your handler and check side effects
});
```

## 11. Production Checklist
- **Respond Fast**: Always send a HTTP 200 immediately. If your processing takes >3 seconds, offload it to a background queue.
- **Idempotency**: Use `messageId` as a unique key in your database to prevent processing the same message twice.
- **Secret Management**: Store your `VERIFY_TOKEN` and `APP_SECRET` in `.env` files.
- **Error Monitoring**: Log `result.error` for failed parses to a service like Sentry or Logtail. 

---
*Created by the Antigravity Team.*
