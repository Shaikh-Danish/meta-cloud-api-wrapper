import type { MessageHandler } from '../registry.js';
import type { IncomingMessage } from '../../../types/incoming.js';

export const locationHandler: MessageHandler<Extract<IncomingMessage, { type: 'location' }>> = {
  type: 'location',
  parse(rawMessage: any) {
    return {
      type: 'location',
      location: {
        latitude: rawMessage.location.latitude,
        longitude: rawMessage.location.longitude,
        name: rawMessage.location.name,
        address: rawMessage.location.address,
        url: rawMessage.location.url,
      },
    };
  },
};
