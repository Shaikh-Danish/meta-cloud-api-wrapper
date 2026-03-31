// ============================================================================
// Payload builders — transform friendly params → Meta API request bodies
// ============================================================================

import type {
  OutboundMessage,
  SendOptions,
  SendTextOptions,
  SendImageParams,
  SendVideoParams,
  SendAudioParams,
  SendDocumentParams,
  SendStickerParams,
  SendLocationParams,
  SendContactCard,
  SendInteractiveButtonsParams,
  SendInteractiveListParams,
  SendSingleProductParams,
  SendMultiProductParams,
  SendCatalogParams,
  SendTemplateParams,
  InteractiveHeader,
} from './types.js';

// ---- Internal raw payload shape sent to Meta ----

interface MetaMessagePayload {
  messaging_product: 'whatsapp';
  recipient_type: 'individual';
  to: string;
  type: string;
  context?: { message_id: string };
  biz_opaque_callback_data?: string;
  [key: string]: unknown;
}

// ---- Core builder: wraps any OutboundMessage into a full Meta payload ----

export function buildPayload(
  to: string,
  message: OutboundMessage,
  options?: SendOptions,
): MetaMessagePayload {
  const payload: MetaMessagePayload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: message.type,
  };

  // Inject context if replying
  if (options?.replyTo) {
    payload.context = { message_id: options.replyTo };
  }

  // Attach biz_opaque_callback_data if provided
  if (options?.bizOpaqueCallbackData) {
    payload.biz_opaque_callback_data = options.bizOpaqueCallbackData;
  }

  // Attach the type-specific data
  switch (message.type) {
    case 'text':
      payload.text = message.text;
      break;
    case 'image':
      payload.image = buildMediaObject(message.image);
      break;
    case 'video':
      payload.video = buildMediaObject(message.video);
      break;
    case 'audio':
      payload.audio = buildMediaObject(message.audio);
      break;
    case 'document':
      payload.document = buildMediaObject(message.document);
      break;
    case 'sticker':
      payload.sticker = buildMediaObject(message.sticker);
      break;
    case 'location':
      payload.location = message.location;
      break;
    case 'contacts':
      payload.contacts = message.contacts;
      break;
    case 'interactive':
      payload.interactive = message.interactive;
      break;
    case 'template':
      payload.template = message.template;
      break;
    case 'reaction':
      payload.reaction = message.reaction;
      break;
  }

  return payload;
}

// ---- Convenience builders: friendly params → OutboundMessage ----

export function buildTextMessage(
  body: string,
  options?: SendTextOptions,
): OutboundMessage {
  return {
    type: 'text',
    text: {
      body,
      preview_url: options?.previewUrl ?? false,
    },
  };
}

export function buildImageMessage(params: SendImageParams): OutboundMessage {
  return {
    type: 'image',
    image: params,
  };
}

export function buildVideoMessage(params: SendVideoParams): OutboundMessage {
  return {
    type: 'video',
    video: params,
  };
}

export function buildAudioMessage(params: SendAudioParams): OutboundMessage {
  return {
    type: 'audio',
    audio: params,
  };
}

export function buildDocumentMessage(params: SendDocumentParams): OutboundMessage {
  return {
    type: 'document',
    document: params,
  };
}

export function buildStickerMessage(params: SendStickerParams): OutboundMessage {
  return {
    type: 'sticker',
    sticker: params,
  };
}

export function buildLocationMessage(params: SendLocationParams): OutboundMessage {
  return {
    type: 'location',
    location: params,
  };
}

export function buildContactsMessage(contacts: SendContactCard[]): OutboundMessage {
  return {
    type: 'contacts',
    contacts,
  };
}

export function buildReactionMessage(messageId: string, emoji: string): OutboundMessage {
  return {
    type: 'reaction',
    reaction: {
      message_id: messageId,
      emoji,
    },
  };
}

export function buildInteractiveButtonsMessage(
  params: SendInteractiveButtonsParams,
): OutboundMessage {
  const interactive: Record<string, unknown> = {
    type: 'button',
    body: { text: params.body },
    action: {
      buttons: params.buttons.map((btn) => ({
        type: 'reply' as const,
        reply: { id: btn.id, title: btn.title },
      })),
    },
  };

  if (params.header) {
    interactive.header = buildInteractiveHeader(params.header);
  }
  if (params.footer) {
    interactive.footer = { text: params.footer };
  }

  return {
    type: 'interactive',
    interactive: interactive as OutboundMessage extends { type: 'interactive'; interactive: infer I } ? I : never,
  } as OutboundMessage;
}

export function buildInteractiveListMessage(
  params: SendInteractiveListParams,
): OutboundMessage {
  const interactive: Record<string, unknown> = {
    type: 'list',
    body: { text: params.body },
    action: {
      button: params.buttonText,
      sections: params.sections.map((section) => ({
        title: section.title,
        rows: section.rows.map((row) => ({
          id: row.id,
          title: row.title,
          ...(row.description ? { description: row.description } : {}),
        })),
      })),
    },
  };

  if (params.header) {
    interactive.header = { type: 'text', text: params.header };
  }
  if (params.footer) {
    interactive.footer = { text: params.footer };
  }

  return {
    type: 'interactive',
    interactive: interactive as OutboundMessage extends { type: 'interactive'; interactive: infer I } ? I : never,
  } as OutboundMessage;
}

export function buildSingleProductMessage(
  params: SendSingleProductParams,
): OutboundMessage {
  const interactive: Record<string, unknown> = {
    type: 'product',
    action: {
      catalog_id: params.catalogId,
      product_retailer_id: params.productRetailerId,
    },
  };

  if (params.body) {
    interactive.body = { text: params.body };
  }
  if (params.footer) {
    interactive.footer = { text: params.footer };
  }

  return {
    type: 'interactive',
    interactive: interactive as OutboundMessage extends { type: 'interactive'; interactive: infer I } ? I : never,
  } as OutboundMessage;
}

export function buildMultiProductMessage(
  params: SendMultiProductParams,
): OutboundMessage {
  const interactive: Record<string, unknown> = {
    type: 'product_list',
    header: { type: 'text', text: params.header },
    body: { text: params.body },
    action: {
      catalog_id: params.catalogId,
      sections: params.sections.map((section) => ({
        title: section.title,
        product_items: section.productItems.map((item) => ({
          product_retailer_id: item.productRetailerId,
        })),
      })),
    },
  };

  if (params.footer) {
    interactive.footer = { text: params.footer };
  }

  return {
    type: 'interactive',
    interactive: interactive as OutboundMessage extends { type: 'interactive'; interactive: infer I } ? I : never,
  } as OutboundMessage;
}

export function buildCatalogMessage(
  params: SendCatalogParams,
): OutboundMessage {
  const interactive: Record<string, unknown> = {
    type: 'catalog_message',
    body: { text: params.body },
    action: {
      name: 'catalog_message',
      ...(params.thumbnailProductRetailerId
        ? { parameters: { thumbnail_product_retailer_id: params.thumbnailProductRetailerId } }
        : {}),
    },
  };

  if (params.footer) {
    interactive.footer = { text: params.footer };
  }

  return {
    type: 'interactive',
    interactive: interactive as OutboundMessage extends { type: 'interactive'; interactive: infer I } ? I : never,
  } as OutboundMessage;
}

export function buildTemplateMessage(params: SendTemplateParams): OutboundMessage {
  return {
    type: 'template',
    template: {
      name: params.name,
      language: { code: params.language },
      ...(params.components ? { components: params.components } : {}),
    },
  };
}

// ---- Mark as read payload (special: not a message, uses status field) ----

export function buildMarkAsReadPayload(messageId: string): Record<string, unknown> {
  return {
    messaging_product: 'whatsapp',
    status: 'read',
    message_id: messageId,
  };
}

// ---- Helpers ----

function buildMediaObject(
  media: Record<string, unknown>,
): Record<string, unknown> {
  // Clean copy: only include defined properties
  const obj: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(media)) {
    if (value !== undefined) {
      obj[key] = value;
    }
  }
  return obj;
}

function buildInteractiveHeader(
  header: InteractiveHeader,
): Record<string, unknown> {
  switch (header.type) {
    case 'text':
      return { type: 'text', text: header.text };
    case 'image':
      return { type: 'image', image: buildMediaObject(header.image as Record<string, unknown>) };
    case 'video':
      return { type: 'video', video: buildMediaObject(header.video as Record<string, unknown>) };
    case 'document':
      return { type: 'document', document: buildMediaObject(header.document as Record<string, unknown>) };
  }
}
