import type { MessageHandler } from '../registry.js';
import type { IncomingMessage } from '../../../types/incoming.js';

export const reactionHandler: MessageHandler<Extract<IncomingMessage, { type: 'reaction' }>> = {
  type: 'reaction',
  parse(rawMessage: any) {
    return {
      type: 'reaction',
      reaction: {
        messageId: rawMessage.reaction.message_id,
        emoji: rawMessage.reaction.emoji,
      },
    };
  },
};
