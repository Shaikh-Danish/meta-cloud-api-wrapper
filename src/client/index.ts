// ============================================================================
// WhatsAppClient — the primary interface for sending messages
// ============================================================================

import type {
  ClientConfig,
  FetchFunction,
  SendOptions,
  SendTextOptions,
  SendImageParams,
  SendVideoParams,
  SendAudioParams,
  SendDocumentParams,
  SendStickerParams,
  SendLocationParams,
  SendContactCard,
  SendInteractiveButtonsParams,
  SendInteractiveListParams,
  SendSingleProductParams,
  SendMultiProductParams,
  SendCatalogParams,
  SendTemplateParams,
  OutboundMessage,
  SendResult,
} from '../messages/types.js';

import {
  buildPayload,
  buildTextMessage,
  buildImageMessage,
  buildVideoMessage,
  buildAudioMessage,
  buildDocumentMessage,
  buildStickerMessage,
  buildLocationMessage,
  buildContactsMessage,
  buildReactionMessage,
  buildInteractiveButtonsMessage,
  buildInteractiveListMessage,
  buildSingleProductMessage,
  buildMultiProductMessage,
  buildCatalogMessage,
  buildTemplateMessage,
  buildMarkAsReadPayload,
} from '../messages/builders.js';

const DEFAULT_API_VERSION = 'v21.0';
const DEFAULT_BASE_URL = 'https://graph.facebook.com';

export class WhatsAppClient {
  private readonly phoneNumberId: string;
  private readonly accessToken: string;
  private readonly apiVersion: string;
  private readonly baseUrl: string;
  private readonly _fetch: FetchFunction;

  constructor(config: ClientConfig) {
    if (!config.phoneNumberId) {
      throw new Error('WhatsAppClient: phoneNumberId is required');
    }
    if (!config.accessToken) {
      throw new Error('WhatsAppClient: accessToken is required');
    }

    this.phoneNumberId = config.phoneNumberId;
    this.accessToken = config.accessToken;
    this.apiVersion = config.apiVersion ?? DEFAULT_API_VERSION;
    this.baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
    this._fetch = config.fetch ?? (globalThis as any).fetch;
  }

  // ==========================================================================
  // Universal send — accepts any OutboundMessage
  // ==========================================================================

  /**
   * Send any outbound message using the full discriminated union type.
   * This is the most flexible method — all convenience methods delegate to it.
   */
  async send(
    to: string,
    message: OutboundMessage,
    options?: SendOptions,
  ): Promise<SendResult> {
    const payload = buildPayload(to, message, options);
    return this.post(payload);
  }

  // ==========================================================================
  // Convenience methods — one-liner shortcuts for common message types
  // ==========================================================================

  /** Send a text message */
  async sendText(
    to: string,
    body: string,
    options?: SendTextOptions,
  ): Promise<SendResult> {
    const message = buildTextMessage(body, options);
    return this.send(to, message, options);
  }

  /** Send an image (via URL or media ID) */
  async sendImage(
    to: string,
    image: SendImageParams,
    options?: SendOptions,
  ): Promise<SendResult> {
    return this.send(to, buildImageMessage(image), options);
  }

  /** Send a video (via URL or media ID) */
  async sendVideo(
    to: string,
    video: SendVideoParams,
    options?: SendOptions,
  ): Promise<SendResult> {
    return this.send(to, buildVideoMessage(video), options);
  }

  /** Send an audio file (via URL or media ID) */
  async sendAudio(
    to: string,
    audio: SendAudioParams,
    options?: SendOptions,
  ): Promise<SendResult> {
    return this.send(to, buildAudioMessage(audio), options);
  }

  /** Send a document (via URL or media ID) */
  async sendDocument(
    to: string,
    document: SendDocumentParams,
    options?: SendOptions,
  ): Promise<SendResult> {
    return this.send(to, buildDocumentMessage(document), options);
  }

  /** Send a sticker (via URL or media ID) */
  async sendSticker(
    to: string,
    sticker: SendStickerParams,
    options?: SendOptions,
  ): Promise<SendResult> {
    return this.send(to, buildStickerMessage(sticker), options);
  }

  /** Send a location pin */
  async sendLocation(
    to: string,
    location: SendLocationParams,
    options?: SendOptions,
  ): Promise<SendResult> {
    return this.send(to, buildLocationMessage(location), options);
  }

  /** Send one or more contact cards */
  async sendContacts(
    to: string,
    contacts: SendContactCard[],
    options?: SendOptions,
  ): Promise<SendResult> {
    return this.send(to, buildContactsMessage(contacts), options);
  }

  /** React to a message with an emoji. Pass empty string to remove reaction. */
  async sendReaction(
    to: string,
    messageId: string,
    emoji: string,
  ): Promise<SendResult> {
    return this.send(to, buildReactionMessage(messageId, emoji));
  }

  /** Send an interactive message with reply buttons (max 3) */
  async sendInteractiveButtons(
    to: string,
    params: SendInteractiveButtonsParams,
    options?: SendOptions,
  ): Promise<SendResult> {
    return this.send(to, buildInteractiveButtonsMessage(params), options);
  }

  /** Send an interactive list message */
  async sendInteractiveList(
    to: string,
    params: SendInteractiveListParams,
    options?: SendOptions,
  ): Promise<SendResult> {
    return this.send(to, buildInteractiveListMessage(params), options);
  }

  /** Send a single product message */
  async sendProduct(
    to: string,
    params: SendSingleProductParams,
    options?: SendOptions,
  ): Promise<SendResult> {
    return this.send(to, buildSingleProductMessage(params), options);
  }

  /** Send a multi-product message */
  async sendProductList(
    to: string,
    params: SendMultiProductParams,
    options?: SendOptions,
  ): Promise<SendResult> {
    return this.send(to, buildMultiProductMessage(params), options);
  }

  /** Send a catalog message */
  async sendCatalog(
    to: string,
    params: SendCatalogParams,
    options?: SendOptions,
  ): Promise<SendResult> {
    return this.send(to, buildCatalogMessage(params), options);
  }

  /** Send a template message */
  async sendTemplate(
    to: string,
    template: SendTemplateParams,
    options?: SendOptions,
  ): Promise<SendResult> {
    return this.send(to, buildTemplateMessage(template), options);
  }

  // ==========================================================================
  // Utility methods
  // ==========================================================================

  /** Mark a received message as read (sends the blue ticks) */
  async markAsRead(messageId: string): Promise<SendResult> {
    const payload = buildMarkAsReadPayload(messageId);
    return this.post(payload);
  }

  /**
   * Send a raw payload directly to the Messages API.
   * Escape hatch for when the library hasn't caught up with new features.
   */
  async sendRaw(payload: Record<string, unknown>): Promise<SendResult> {
    return this.post(payload);
  }

  // ==========================================================================
  // Internal HTTP layer
  // ==========================================================================

  private get messagesUrl(): string {
    return `${this.baseUrl}/${this.apiVersion}/${this.phoneNumberId}/messages`;
  }

  private async post(body: Record<string, unknown>): Promise<SendResult> {
    try {
      const response = await this._fetch(this.messagesUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify(body),
      });

      const raw = await response.json();

      if (!response.ok) {
        // Meta returns errors in { error: { code, message, ... } }
        const metaError = (raw as Record<string, any>)?.error;
        return {
          success: false,
          error: {
            code: metaError?.code ?? response.status,
            message: metaError?.message ?? response.statusText,
            details: metaError?.error_data ?? metaError,
          },
          raw,
        };
      }

      // Successful response: { messaging_product, contacts, messages: [{ id }] }
      const messages = (raw as Record<string, any>)?.messages;
      const messageId = Array.isArray(messages) && messages.length > 0
        ? messages[0].id
        : undefined;

      return {
        success: true,
        messageId: messageId ?? '',
        raw,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 0,
          message: error instanceof Error ? error.message : 'Network request failed',
          details: error,
        },
        raw: null,
      };
    }
  }
}
