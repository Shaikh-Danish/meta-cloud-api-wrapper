import type { MessageHandler } from '../registry.js';
import type { IncomingMessage } from '../../../types/incoming.js';

export const unsupportedHandler: MessageHandler<Extract<IncomingMessage, { type: 'unsupported' }>> = {
  type: 'unsupported',
  parse(rawMessage: any) {
    return {
      type: 'unsupported',
      errors: rawMessage.errors, // Could be mapped if needed, keeping simple for now
    };
  },
};

export const unknownHandler: MessageHandler<Extract<IncomingMessage, { type: 'unknown' }>> = {
  type: 'unknown',
  parse(rawMessage: any) {
    return {
      type: 'unknown',
      raw: rawMessage,
    };
  },
};
