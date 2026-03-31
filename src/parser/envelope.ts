import { z } from 'zod';

export const MetadataSchema = z.object({
  display_phone_number: z.string(),
  phone_number_id: z.string(),
});

export const ContactSchema = z.object({
  profile: z.object({
    name: z.string().nullable().optional(),
  }).optional(),
  wa_id: z.string(),
});

// A very loose schema for the raw message to pass it to handlers
export const RawMessageSchema = z.object({
  id: z.string(),
  from: z.string(),
  timestamp: z.string(),
  type: z.string(),
}).passthrough();

export const StatusSchema = z.object({
  id: z.string(),
  status: z.string(),
  timestamp: z.string(),
  recipient_id: z.string(),
}).passthrough();

export const ChangeValueSchema = z.object({
  messaging_product: z.literal('whatsapp'),
  metadata: MetadataSchema,
  contacts: z.array(ContactSchema).optional(),
  messages: z.array(RawMessageSchema).optional(),
  statuses: z.array(StatusSchema).optional(),
});

export const ChangeSchema = z.object({
  value: ChangeValueSchema,
  field: z.string(),
});

export const EntrySchema = z.object({
  id: z.string(),
  changes: z.array(ChangeSchema),
});

export const WebhookEnvelopeSchema = z.object({
  object: z.string(),
  entry: z.array(EntrySchema),
});

export type RawWebhookEnvelope = z.infer<typeof WebhookEnvelopeSchema>;
export type RawChangeValue = z.infer<typeof ChangeValueSchema>;
export type RawMessage = z.infer<typeof RawMessageSchema>;
export type RawStatus = z.infer<typeof StatusSchema>;
export type RawContact = z.infer<typeof ContactSchema>;
