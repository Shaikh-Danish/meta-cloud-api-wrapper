// ============================================================================
// Outgoing status types — Business → User delivery updates
// ============================================================================

import type { Metadata } from './common.js';

/** Possible delivery status values */
export type StatusType = 'sent' | 'delivered' | 'read' | 'failed';

/** The recipient of the outgoing message */
export interface Recipient {
  /** Recipient's phone number or group ID */
  phone: string;
  /** Only present for group messages (value: "group") */
  type?: string;
  /** Individual participant's phone number in a group */
  participantPhone?: string;
}

/** Conversation metadata (billing context) */
export interface Conversation {
  id: string;
  expirationTimestamp?: string;
  origin: {
    /** e.g., "business_initiated", "user_initiated", "referral_conversion" */
    type: string;
  };
}

/** Pricing information for the message */
export interface Pricing {
  billable: boolean;
  pricingModel: string;
  type: string;
  /** e.g., "business_initiated", "referral_conversion", "service" */
  category: string;
}

/** Error details for failed message delivery */
export interface StatusError {
  code: number;
  title: string;
  message: string;
  details?: string;
  href?: string;
}

// ============================================================================
// Full outgoing payload (what parseWebhook returns for status notifications)
// ============================================================================

export interface OutgoingPayload {
  /** Identifies this as an outgoing status update (business → user) */
  readonly stream: 'outgoing';
  /** The WhatsApp Business Account ID */
  wabaId: string;
  /** Business phone number metadata */
  metadata: Metadata;
  /** The original message ID that this status refers to */
  messageId: string;
  /** Unix timestamp (seconds) */
  timestamp: number;
  /** The recipient of the original message */
  recipient: Recipient;
  /** Current delivery status */
  status: StatusType;
  /** Conversation context (billing). Omitted in v24.0+ unless free entry point */
  conversation?: Conversation;
  /** Pricing details */
  pricing?: Pricing;
  /** Error details (only present when status is "failed") */
  errors?: StatusError[];
  /** Custom callback data you sent with the original message */
  bizOpaqueCallbackData?: string;
}
