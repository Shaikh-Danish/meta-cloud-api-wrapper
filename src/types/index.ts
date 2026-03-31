// ============================================================================
// Type barrel — re-export everything from a single entry point
// ============================================================================

export type {
  Metadata,
  Sender,
  MessageContext,
  Referral,
  ParseError,
} from './common.js';

export type {
  // Message data types
  TextMessageData,
  ImageMessageData,
  VideoMessageData,
  AudioMessageData,
  DocumentMessageData,
  StickerMessageData,
  LocationMessageData,
  ContactAddress,
  ContactEmail,
  ContactName,
  ContactOrg,
  ContactPhone,
  ContactUrl,
  ContactCard,
  ButtonMessageData,
  ListReplyData,
  ButtonReplyData,
  InteractiveMessageData,
  ProductItem,
  OrderMessageData,
  ReactionMessageData,
  // Discriminated union + payload
  IncomingMessage,
  MessageType,
  IncomingPayload,
} from './incoming.js';

export type {
  StatusType,
  Recipient,
  Conversation,
  Pricing,
  StatusError,
  OutgoingPayload,
} from './outgoing.js';

// ============================================================================
// Top-level parse result — the return type of parseWebhook()
// ============================================================================

import type { IncomingPayload } from './incoming.js';
import type { OutgoingPayload } from './outgoing.js';
import type { ParseError } from './common.js';

export type ParseResult =
  | { success: true; data: IncomingPayload }
  | { success: true; data: OutgoingPayload }
  | { success: false; error: ParseError };
