// ============================================================================
// Incoming message types — User → Business
// ============================================================================

import type { Metadata, Sender, MessageContext, Referral } from './common.js';

// ---- Message-specific data types ----

export interface TextMessageData {
  body: string;
}

export interface ImageMessageData {
  id: string;
  mimeType: string;
  sha256: string;
  url?: string;
  caption?: string;
}

export interface VideoMessageData {
  id: string;
  mimeType: string;
  sha256: string;
  url?: string;
  caption?: string;
}

export interface AudioMessageData {
  id: string;
  mimeType: string;
  sha256: string;
  url?: string;
  /** True if this is a voice recording (PTT), false if an audio file */
  voice: boolean;
}

export interface DocumentMessageData {
  id: string;
  mimeType: string;
  sha256: string;
  url?: string;
  caption?: string;
  filename?: string;
}

export interface StickerMessageData {
  id: string;
  mimeType: string;
  sha256: string;
  url?: string;
  /** True if the sticker is animated */
  animated: boolean;
}

export interface LocationMessageData {
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
  url?: string;
}

// ---- Contact sub-types ----

export interface ContactAddress {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  countryCode?: string;
  type?: string;
}

export interface ContactEmail {
  email?: string;
  type?: string;
}

export interface ContactName {
  formattedName: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  suffix?: string;
  prefix?: string;
}

export interface ContactOrg {
  company?: string;
  department?: string;
  title?: string;
}

export interface ContactPhone {
  phone?: string;
  waId?: string;
  type?: string;
}

export interface ContactUrl {
  url?: string;
  type?: string;
}

export interface ContactCard {
  addresses?: ContactAddress[];
  birthday?: string;
  emails?: ContactEmail[];
  name: ContactName;
  org?: ContactOrg;
  phones?: ContactPhone[];
  urls?: ContactUrl[];
}

// ---- Interactive message sub-types ----

export interface ButtonMessageData {
  payload: string;
  text: string;
}

export interface ListReplyData {
  type: 'list_reply';
  listReply: {
    id: string;
    title: string;
    description?: string;
  };
}

export interface ButtonReplyData {
  type: 'button_reply';
  buttonReply: {
    id: string;
    title: string;
  };
}

export interface NfmReplyData {
  type: 'nfm_reply';
  nfmReply: {
    /** The name of the flow (usually "flow") */
    name: string;
    /** The body text shown on the response (usually "Sent") */
    body: string;
    /** The actual JSON string containing flow responses */
    responseJson: string;
  };
}

export type InteractiveMessageData = ListReplyData | ButtonReplyData | NfmReplyData;

// ---- Order sub-types ----

export interface ProductItem {
  productRetailerId: string;
  quantity: number;
  itemPrice: number;
  currency: string;
}

export interface OrderMessageData {
  catalogId: string;
  text?: string;
  productItems: ProductItem[];
}

// ---- Reaction ----

export interface ReactionMessageData {
  /** The ID of the message being reacted to */
  messageId: string;
  /** The emoji used for the reaction (empty string = reaction removed) */
  emoji: string;
}

// ============================================================================
// Discriminated union of all incoming message types
// ============================================================================

export type IncomingMessage =
  | { type: 'text'; text: TextMessageData }
  | { type: 'image'; image: ImageMessageData }
  | { type: 'video'; video: VideoMessageData }
  | { type: 'audio'; audio: AudioMessageData }
  | { type: 'document'; document: DocumentMessageData }
  | { type: 'sticker'; sticker: StickerMessageData }
  | { type: 'location'; location: LocationMessageData }
  | { type: 'contacts'; contacts: ContactCard[] }
  | { type: 'button'; button: ButtonMessageData }
  | { type: 'interactive'; interactive: InteractiveMessageData }
  | { type: 'order'; order: OrderMessageData }
  | { type: 'reaction'; reaction: ReactionMessageData }
  | { type: 'unsupported'; errors?: Array<{ code: number; title: string; message: string; details?: string }> }
  | { type: 'unknown'; raw: unknown };

/** All possible incoming message type strings */
export type MessageType = IncomingMessage['type'];

// ============================================================================
// Full incoming payload (what parseWebhook returns for incoming messages)
// ============================================================================

export interface IncomingPayload {
  /** Identifies this as an incoming message (user → business) */
  readonly stream: 'incoming';
  /** The WhatsApp Business Account ID */
  wabaId: string;
  /** Business phone number metadata */
  metadata: Metadata;
  /** The message sender */
  from: Sender;
  /** Unique message ID assigned by WhatsApp */
  messageId: string;
  /** Unix timestamp (seconds) */
  timestamp: number;
  /** Shortcut for message.type */
  type: MessageType;
  /** Reply/forward context, if this message is a reply or forward */
  context?: MessageContext;
  /** Ad referral data, if message originated from a Click-to-WhatsApp ad */
  referral?: Referral;
  /** The parsed message with type-specific data */
  message: IncomingMessage;
}
