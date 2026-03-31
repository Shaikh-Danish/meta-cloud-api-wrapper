import type { MessageHandler } from '../registry.js';
import type { IncomingMessage } from '../../../types/incoming.js';

export const buttonHandler: MessageHandler<Extract<IncomingMessage, { type: 'button' }>> = {
  type: 'button',
  parse(rawMessage: any) {
    return {
      type: 'button',
      button: {
        payload: rawMessage.button.payload,
        text: rawMessage.button.text,
      },
    };
  },
};

export const interactiveHandler: MessageHandler<Extract<IncomingMessage, { type: 'interactive' }>> = {
  type: 'interactive',
  parse(rawMessage: any) {
    const { interactive } = rawMessage;

    if (interactive.type === 'list_reply') {
      return {
        type: 'interactive',
        interactive: {
          type: 'list_reply',
          listReply: {
            id: interactive.list_reply.id,
            title: interactive.list_reply.title,
            description: interactive.list_reply.description,
          },
        },
      };
    }

    if (interactive.type === 'button_reply') {
      return {
        type: 'interactive',
        interactive: {
          type: 'button_reply',
          buttonReply: {
            id: interactive.button_reply.id,
            title: interactive.button_reply.title,
          },
        },
      };
    }

    if (interactive.type === 'nfm_reply') {
      return {
        type: 'interactive',
        interactive: {
          type: 'nfm_reply',
          nfmReply: {
            name: interactive.nfm_reply.name,
            body: interactive.nfm_reply.body,
            responseJson: interactive.nfm_reply.response_json,
          },
        },
      };
    }

    // Fallback if interactive type isn't recognized
    throw new Error(`Unknown interactive message type: ${interactive.type}`);
  },
};
