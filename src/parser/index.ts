import { WebhookEnvelopeSchema, type RawChangeValue } from './envelope.js';
import { parseIncomingMessage } from './incoming/index.js';
import { parseStatusNotification } from './outgoing/index.js';
import type { ParseResult } from '../types/index.js';

/**
 * Main parser entrypoint. Validates the webhook envelope and routes to the correct stream.
 */
export function parseWebhook(rawBody: unknown): ParseResult[] {
  try {
    // 1. Validate envelope purely for structure
    const parsedEnvelope = WebhookEnvelopeSchema.safeParse(rawBody);

    if (!parsedEnvelope.success) {
      return [
        {
          success: false,
          error: {
            code: 'invalid_envelope',
            message: 'Failed to validate webhook envelope format',
            details: parsedEnvelope.error.format(),
          },
        },
      ];
    }

    const results: ParseResult[] = [];

    // 2. Iterate through all entries and changes
    for (const entry of parsedEnvelope.data.entry) {
      const wabaId = entry.id;

      for (const change of entry.changes) {
        // Only process changes where field === 'messages'
        if (change.field !== 'messages') {
          continue; // Ignore template status updates, phone quality, etc. for now
        }

        const value = change.value as RawChangeValue;

        // 3. Router decision: messages[] vs statuses[]
        if (value.messages && value.messages.length > 0) {
          // It's an incoming message from a user
          const incomingPayloads = parseIncomingMessage(wabaId, value);
          for (const payload of incomingPayloads) {
            results.push({ success: true, data: payload });
          }
        }
        else if (value.statuses && value.statuses.length > 0) {
          // It's an outgoing status update about a message we sent
          const outgoingPayloads = parseStatusNotification(wabaId, value);
          for (const payload of outgoingPayloads) {
            results.push({ success: true, data: payload });
          }
        }
        else {
          // Invalid or unknown shape
          results.push({
            success: false,
            error: {
              code: 'unknown_payload',
              message: 'Payload contained neither messages[] nor statuses[]',
            },
          });
        }
      }
    }

    if (results.length === 0) {
      // Did not process any messages or changes
      return [
        {
          success: false,
          error: {
            code: 'no_processable_changes',
            message: 'No supported changes found in Webhook envelope',
          }
        }
      ];
    }

    return results;
  } catch (error) {
    return [
      {
        success: false,
        error: {
          code: 'unexpected_error',
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
          details: error,
        },
      },
    ];
  }
}
