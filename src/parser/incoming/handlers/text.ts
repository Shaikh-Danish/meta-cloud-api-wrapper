import type { MessageHandler } from '../registry.js';
import type { IncomingMessage } from '../../../types/incoming.js';

export const textHandler: MessageHandler<Extract<IncomingMessage, { type: 'text' }>> = {
  type: 'text',
  parse(rawMessage: any) {
    return {
      type: 'text',
      text: {
        body: rawMessage.text.body,
      },
    };
  },
};
