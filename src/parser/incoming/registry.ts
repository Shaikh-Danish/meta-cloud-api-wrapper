import type { IncomingMessage } from '../../types/incoming.js';

export interface MessageHandler<T extends IncomingMessage> {
  type: string;
  parse(rawMessage: any): T;
}

export class HandlerRegistry {
  private handlers = new Map<string, MessageHandler<any>>();
  private fallbackHandler?: MessageHandler<any>;

  register<T extends IncomingMessage>(handler: MessageHandler<T>) {
    this.handlers.set(handler.type, handler);
  }

  setFallback(handler: MessageHandler<any>) {
    this.fallbackHandler = handler;
  }

  get(type: string): MessageHandler<any> {
    const handler = this.handlers.get(type);
    if (!handler) {
      if (this.fallbackHandler) {
        return this.fallbackHandler;
      }
      throw new Error(`No handler registered for message type: ${type}`);
    }
    return handler;
  }
}

export const messageRegistry = new HandlerRegistry();
