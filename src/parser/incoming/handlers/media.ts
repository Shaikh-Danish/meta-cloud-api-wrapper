import type { MessageHandler } from '../registry.js';
import type { IncomingMessage } from '../../../types/incoming.js';

export const mediaHandlers: MessageHandler<
  Extract<IncomingMessage, { type: 'image' | 'video' | 'audio' | 'document' | 'sticker' }>
>[] = [
  {
    type: 'image',
    parse(rawMessage: any) {
      return {
        type: 'image',
        image: {
          id: rawMessage.image.id,
          mimeType: rawMessage.image.mime_type,
          sha256: rawMessage.image.sha256,
          url: rawMessage.image.url,
          caption: rawMessage.image.caption,
        },
      } as const;
    },
  },
  {
    type: 'video',
    parse(rawMessage: any) {
      return {
        type: 'video',
        video: {
          id: rawMessage.video.id,
          mimeType: rawMessage.video.mime_type,
          sha256: rawMessage.video.sha256,
          url: rawMessage.video.url,
          caption: rawMessage.video.caption,
        },
      } as const;
    },
  },
  {
    type: 'audio',
    parse(rawMessage: any) {
      return {
        type: 'audio',
        audio: {
          id: rawMessage.audio.id,
          mimeType: rawMessage.audio.mime_type,
          sha256: rawMessage.audio.sha256,
          url: rawMessage.audio.url,
          voice: !!rawMessage.audio.voice,
        },
      } as const;
    },
  },
  {
    type: 'document',
    parse(rawMessage: any) {
      return {
        type: 'document',
        document: {
          id: rawMessage.document.id,
          mimeType: rawMessage.document.mime_type,
          sha256: rawMessage.document.sha256,
          url: rawMessage.document.url,
          caption: rawMessage.document.caption,
          filename: rawMessage.document.filename,
        },
      } as const;
    },
  },
  {
    type: 'sticker',
    parse(rawMessage: any) {
      return {
        type: 'sticker',
        sticker: {
          id: rawMessage.sticker.id,
          mimeType: rawMessage.sticker.mime_type,
          sha256: rawMessage.sticker.sha256,
          url: rawMessage.sticker.url,
          animated: !!rawMessage.sticker.animated,
        },
      } as const;
    },
  },
];
