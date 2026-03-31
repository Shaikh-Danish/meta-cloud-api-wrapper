import type { OutgoingPayload, StatusType, StatusError } from '../../types/outgoing.js';
import type { RawChangeValue } from '../envelope.js';

export function parseStatusNotification(wabaId: string, changeValue: RawChangeValue): OutgoingPayload[] {
  const payloads: OutgoingPayload[] = [];
  const statuses = changeValue.statuses || [];

  for (const raw of statuses) {
    const rawStatus = raw as any;
    const statusType = rawStatus.status as StatusType | undefined;
    
    if (!statusType) continue;

    const payload: OutgoingPayload = {
      stream: 'outgoing',
      wabaId,
      metadata: {
        displayPhoneNumber: changeValue.metadata.display_phone_number,
        phoneNumberId: changeValue.metadata.phone_number_id,
      },
      messageId: rawStatus.id,
      timestamp: parseInt(rawStatus.timestamp, 10) || 0,
      recipient: {
        phone: rawStatus.recipient_id,
        // Only valid for groups, currently we can just check if properties exist
        type: rawStatus.recipient_type === 'group' ? 'group' : undefined,
        participantPhone: rawStatus.recipient_participant_id,
      },
      status: statusType,
      bizOpaqueCallbackData: rawStatus.biz_opaque_callback_data,
    };

    // Extract conversation if present (usually sent/delivered)
    if (rawStatus.conversation) {
      payload.conversation = {
        id: rawStatus.conversation.id,
        expirationTimestamp: rawStatus.conversation.expiration_timestamp,
        origin: {
          type: rawStatus.conversation.origin?.type,
        },
      };
    }

    // Extract pricing if present
    if (rawStatus.pricing) {
      payload.pricing = {
        billable: !!rawStatus.pricing.billable,
        pricingModel: rawStatus.pricing.pricing_model,
        type: rawStatus.pricing.type,
        category: rawStatus.pricing.category,
      };
    }

    // Extract errors if failed
    if (rawStatus.errors && Array.isArray(rawStatus.errors)) {
      payload.errors = rawStatus.errors.map((error: any) => ({
        code: error.code,
        title: error.title,
        message: error.message,
        details: error.error_data?.details,
        href: error.href,
      } as StatusError));
    }

    payloads.push(payload);
  }

  return payloads;
}
