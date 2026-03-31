// ============================================================================
// Common types shared across incoming and outgoing streams
// ============================================================================

/** Metadata about the business phone number receiving the webhook */
export interface Metadata {
  /** The phone number displayed for the business */
  displayPhoneNumber: string;
  /** The unique ID of the business phone number */
  phoneNumberId: string;
}

/** The sender of an incoming message */
export interface Sender {
  /** The sender's phone number (e.g., "919876543210") */
  phone: string;
  /** The sender's WhatsApp profile name, or null if unavailable */
  name: string | null;
  /** The sender's WhatsApp ID */
  waId: string;
}

/** Context information for replied/forwarded messages */
export interface MessageContext {
  /** The message ID being replied to */
  messageId: string;
  /** The phone number of the original message sender */
  from: string;
  /** True if the message was forwarded (5 times or less) */
  forwarded?: boolean;
  /** True if the message was forwarded more than 5 times */
  frequentlyForwarded?: boolean;
  /** Product reference if the message originated from a product inquiry */
  referredProduct?: {
    catalogId: string;
    productRetailerId: string;
  };
}

/** Ad referral data attached to messages from Click-to-WhatsApp ads */
export interface Referral {
  sourceUrl: string;
  sourceId: string;
  sourceType: string;
  body?: string;
  headline?: string;
  mediaType?: string;
  imageUrl?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  ctwaClid?: string;
  welcomeMessage?: {
    text: string;
  };
}

/** Error returned when webhook parsing fails */
export interface ParseError {
  /** Machine-readable error code */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Additional error context */
  details?: unknown;
}
