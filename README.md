# meta-cloud-api-wrapper

A comprehensive, type-safe TypeScript wrapper for the **Meta Cloud API**. Effortlessly parse webhooks, send messages, manage flows, and build templates for WhatsApp Business.

## 📚 Documentation

For a full walkthrough, specific message type examples, and production best practices, see the **[Detailed User Guide](./GUIDE.md)**.

## Install

```bash
npm install meta-cloud-api-wrapper
# or
bun add meta-cloud-api-wrapper
```

## Quick Start

```ts
import { parseWebhook } from 'meta-cloud-api-wrapper';
import type { IncomingPayload, OutgoingPayload } from 'meta-cloud-api-wrapper';

// In your webhook handler (Express, Hono, Fastify, etc.)
app.post('/webhook', (req, res) => {
  const results = parseWebhook(req.body);

  for (const result of results) {
    if (!result.success) {
      console.error('Parse error:', result.error);
      continue;
    }

    if (result.data.stream === 'incoming') {
      handleIncomingMessage(result.data);
    }

    if (result.data.stream === 'outgoing') {
      handleStatusUpdate(result.data);
    }
  }

  res.sendStatus(200);
});
```

## Handling Incoming Messages (User → Business)

```ts
function handleIncomingMessage(data: IncomingPayload) {
  const { from, messageId, message } = data;

  console.log(`Message from ${from.name} (${from.phone})`);

  switch (message.type) {
    case 'text':
      console.log('Text:', message.text.body);
      break;

    case 'image':
      console.log('Image ID:', message.image.id);
      console.log('MIME:', message.image.mimeType);
      console.log('Caption:', message.image.caption);
      break;

    case 'video':
      console.log('Video ID:', message.video.id);
      break;

    case 'audio':
      console.log('Audio ID:', message.audio.id);
      console.log('Is voice note:', message.audio.voice);
      break;

    case 'document':
      console.log('Document:', message.document.filename);
      console.log('MIME:', message.document.mimeType);
      break;

    case 'sticker':
      console.log('Sticker ID:', message.sticker.id);
      console.log('Animated:', message.sticker.animated);
      break;

    case 'location':
      console.log('Location:', message.location.latitude, message.location.longitude);
      console.log('Name:', message.location.name);
      break;

    case 'contacts':
      for (const contact of message.contacts) {
        console.log('Contact:', contact.name.formattedName);
      }
      break;

    case 'button':
      console.log('Button payload:', message.button.payload);
      console.log('Button text:', message.button.text);
      break;

    case 'interactive':
      if (message.interactive.type === 'list_reply') {
        console.log('List selection:', message.interactive.listReply.title);
      }
      if (message.interactive.type === 'button_reply') {
        console.log('Button reply:', message.interactive.buttonReply.title);
      }
      break;

    case 'order':
      console.log('Order from catalog:', message.order.catalogId);
      console.log('Items:', message.order.productItems.length);
      break;

    case 'reaction':
      console.log('Reaction:', message.reaction.emoji);
      console.log('To message:', message.reaction.messageId);
      break;

    case 'unknown':
      console.log('Unknown message type, raw:', message.raw);
      break;
  }

  // Context (reply/forward info) is always available
  if (data.context) {
    console.log('Reply to message:', data.context.messageId);
    console.log('Forwarded:', data.context.forwarded);
  }

  // Ad referral data
  if (data.referral) {
    console.log('From ad:', data.referral.sourceUrl);
  }
}
```

## Handling Outgoing Status Updates (Business → User)

```ts
function handleStatusUpdate(data: OutgoingPayload) {
  const { messageId, status, recipient } = data;

  console.log(`Message ${messageId} to ${recipient.phone}: ${status}`);

  switch (status) {
    case 'sent':
      // Message accepted by WhatsApp servers
      if (data.conversation) {
        console.log('Conversation ID:', data.conversation.id);
        console.log('Category:', data.conversation.origin.type);
      }
      if (data.pricing) {
        console.log('Billable:', data.pricing.billable);
        console.log('Category:', data.pricing.category);
      }
      break;

    case 'delivered':
      // Message delivered to user's device
      break;

    case 'read':
      // User read the message (blue ticks)
      break;

    case 'failed':
      // Delivery failed
      if (data.errors) {
        for (const err of data.errors) {
          console.error(`Error ${err.code}: ${err.title} - ${err.message}`);
          console.error('Details:', err.details);
        }
      }
      break;
  }

  // Custom callback data (if you sent it with the original message)
  if (data.bizOpaqueCallbackData) {
    console.log('Callback data:', data.bizOpaqueCallbackData);
  }
}
```

## API Reference

### `parseWebhook(body: unknown): ParseResult[]`

Parses a raw webhook payload from Meta. Returns an array of results (one per message/status in the payload).

**Returns:** `ParseResult[]` where each item is:
```ts
| { success: true;  data: IncomingPayload }   // user sent a message
| { success: true;  data: OutgoingPayload }   // delivery status update
| { success: false; error: ParseError }       // parsing failed
```

### Custom Handlers

Register your own handlers for new or custom message types:

```ts
import { messageRegistry } from 'meta-cloud-api-wrapper';

messageRegistry.register({
  type: 'my_custom_type',
  parse(rawMessage) {
    return {
      type: 'unknown',
      raw: rawMessage,
    };
  },
});
```

## Key Types

| Type | Description |
|------|-------------|
| `ParseResult` | Top-level result union |
| `IncomingPayload` | Full incoming message with metadata, sender, context |
| `OutgoingPayload` | Full status notification with conversation, pricing, errors |
| `IncomingMessage` | Discriminated union of all 13 message types |
| `MessageType` | `'text' \| 'image' \| 'video' \| ... \| 'unknown'` |
| `StatusType` | `'sent' \| 'delivered' \| 'read' \| 'failed'` |

## Design Principles

- **Never throws** — Always returns `{ success, data/error }`. Your server won't crash on unexpected payloads.
- **Never mutates** — The original `req.body` is never modified.
- **Fully typed** — TypeScript discriminated unions give you autocomplete and compile-time safety.
- **Zero config** — `parseWebhook(req.body)` and you're done.
- **Extensible** — Register custom handlers via `messageRegistry.register()`.

```

## 🚀 Roadmap

- [x] Webhook parsing for all 13 core Meta message types.
- [ ] Message Client (Send text, media, interactive).
- [ ] Flow Management (Create, update, manage WhatsApp Flows).
- [ ] Template API (Programmatic creation/management of message templates).
- [ ] Business Management (Phone number and profile settings management).

## Development

```bash
# Install dependencies
npm install

# Type check
npm run lint

# Run tests
npm test

# Build (ESM + CJS + .d.ts)
npm run build
```

## License

MIT
