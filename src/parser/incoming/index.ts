import { messageRegistry } from './registry.js';
import { textHandler } from './handlers/text.js';
import { mediaHandlers } from './handlers/media.js';
import { locationHandler } from './handlers/location.js';
import { contactsHandler } from './handlers/contacts.js';
import { buttonHandler, interactiveHandler } from './handlers/interactive.js';
import { orderHandler } from './handlers/order.js';
import { reactionHandler } from './handlers/reaction.js';
import { unsupportedHandler, unknownHandler } from './handlers/unknown.js';
import type { IncomingPayload, IncomingMessage } from '../../types/incoming.js';
import { extractContext } from '../helpers/extract-context.js';
import { extractReferral } from '../helpers/extract-referral.js';
import { extractSender } from '../helpers/extract-sender.js';
import type { RawChangeValue } from '../envelope.js';

// Register all standard handlers
messageRegistry.register(textHandler);
mediaHandlers.forEach((handler) => messageRegistry.register(handler));
messageRegistry.register(locationHandler);
messageRegistry.register(contactsHandler);
messageRegistry.register(buttonHandler);
messageRegistry.register(interactiveHandler);
messageRegistry.register(orderHandler);
messageRegistry.register(reactionHandler);
messageRegistry.register(unsupportedHandler);
messageRegistry.setFallback(unknownHandler);

export function parseIncomingMessage(wabaId: string, changeValue: RawChangeValue): IncomingPayload[] {
  const payloads: IncomingPayload[] = [];
  const rawMessages = changeValue.messages || [];
  const rawContacts = changeValue.contacts || [];

  for (const raw of rawMessages) {
    const rawMsg = raw as any;
    // Find the contact info for this specific message sender
    const rawContact = rawContacts.find((c) => c.wa_id === rawMsg.from);
    
    // In rare cases (like system messages), from might be missing, but most of the time it's there
    if (!rawMsg.from) {
        continue;
    }

    // Attempt to determine type - Meta sends 'type' property
    let msgType = rawMsg.type;

    // Run the specific handler
    // If the message has `contacts` attribute but type is not contacts, handle it
    if (msgType === "unknown" && (rawMsg as any).contacts) {
        msgType = "contacts"
    } else if (msgType === "unknown" && (rawMsg as any).location) {
        msgType = "location";
    }

    const handler = messageRegistry.get(msgType);
    let messageBody: IncomingMessage;
    
    try {
        messageBody = handler.parse(rawMsg);
    } catch (error) {
        messageBody = unknownHandler.parse(rawMsg);
    }

    // Assemble the full payload with envelope common data
    const payload: IncomingPayload = {
      stream: 'incoming',
      wabaId,
      metadata: {
        displayPhoneNumber: changeValue.metadata.display_phone_number,
        phoneNumberId: changeValue.metadata.phone_number_id,
      },
      from: extractSender(rawMsg, rawContact),
      messageId: rawMsg.id,
      timestamp: parseInt(rawMsg.timestamp, 10) || 0,
      type: messageBody.type,
      context: extractContext(rawMsg),
      referral: extractReferral(rawMsg),
      message: messageBody,
    };

    payloads.push(payload);
  }

  return payloads;
}

export { messageRegistry };
