import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WhatsAppClient } from '../src/client/index.js';
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
} from '../src/messages/builders.js';
import type { FetchFunction, OutboundMessage } from '../src/messages/types.js';

// ============================================================================
// Mock fetch factory
// ============================================================================

function createMockFetch(response: Record<string, unknown> = {}, ok = true): FetchFunction {
  const defaultResponse = ok
    ? { messaging_product: 'whatsapp', contacts: [{ wa_id: '919876543210' }], messages: [{ id: 'wamid.abc123' }] }
    : { error: { code: 131030, message: 'Rate limit hit', error_data: { details: 'Too many requests' } } };

  const merged = ok ? { ...defaultResponse, ...response } : response || defaultResponse;

  return vi.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 400,
    statusText: ok ? 'OK' : 'Bad Request',
    json: () => Promise.resolve(merged),
  });
}

function createClient(fetchFn?: FetchFunction) {
  return new WhatsAppClient({
    phoneNumberId: '123456789',
    accessToken: 'test-token-abc',
    apiVersion: 'v21.0',
    fetch: fetchFn ?? createMockFetch(),
  });
}

// ============================================================================
// Builder tests
// ============================================================================

describe('Payload Builders', () => {
  describe('buildTextMessage', () => {
    it('creates a text message with defaults', () => {
      const msg = buildTextMessage('Hello World');
      expect(msg).toEqual({
        type: 'text',
        text: { body: 'Hello World', preview_url: false },
      });
    });

    it('creates a text message with preview_url enabled', () => {
      const msg = buildTextMessage('Check https://example.com', { previewUrl: true });
      expect(msg).toEqual({
        type: 'text',
        text: { body: 'Check https://example.com', preview_url: true },
      });
    });
  });

  describe('buildImageMessage', () => {
    it('creates an image message with link', () => {
      const msg = buildImageMessage({ link: 'https://example.com/photo.jpg', caption: 'My photo' });
      expect(msg).toEqual({
        type: 'image',
        image: { link: 'https://example.com/photo.jpg', caption: 'My photo' },
      });
    });

    it('creates an image message with media id', () => {
      const msg = buildImageMessage({ id: 'media-id-123' });
      expect(msg).toEqual({
        type: 'image',
        image: { id: 'media-id-123' },
      });
    });
  });

  describe('buildVideoMessage', () => {
    it('creates a video message with link and caption', () => {
      const msg = buildVideoMessage({ link: 'https://example.com/video.mp4', caption: 'Watch this' });
      expect(msg).toEqual({
        type: 'video',
        video: { link: 'https://example.com/video.mp4', caption: 'Watch this' },
      });
    });
  });

  describe('buildAudioMessage', () => {
    it('creates an audio message with id', () => {
      const msg = buildAudioMessage({ id: 'audio-id-456' });
      expect(msg).toEqual({ type: 'audio', audio: { id: 'audio-id-456' } });
    });
  });

  describe('buildDocumentMessage', () => {
    it('creates a document message with link, caption, and filename', () => {
      const msg = buildDocumentMessage({
        link: 'https://example.com/doc.pdf',
        caption: 'Invoice',
        filename: 'invoice-2026.pdf',
      });
      expect(msg).toEqual({
        type: 'document',
        document: {
          link: 'https://example.com/doc.pdf',
          caption: 'Invoice',
          filename: 'invoice-2026.pdf',
        },
      });
    });
  });

  describe('buildStickerMessage', () => {
    it('creates a sticker message with link', () => {
      const msg = buildStickerMessage({ link: 'https://example.com/sticker.webp' });
      expect(msg).toEqual({ type: 'sticker', sticker: { link: 'https://example.com/sticker.webp' } });
    });
  });

  describe('buildLocationMessage', () => {
    it('creates a location message', () => {
      const msg = buildLocationMessage({ latitude: 40.7128, longitude: -74.006, name: 'NYC', address: 'Manhattan' });
      expect(msg).toEqual({
        type: 'location',
        location: { latitude: 40.7128, longitude: -74.006, name: 'NYC', address: 'Manhattan' },
      });
    });
  });

  describe('buildContactsMessage', () => {
    it('creates a contacts message', () => {
      const msg = buildContactsMessage([
        {
          name: { formatted_name: 'John Doe', first_name: 'John', last_name: 'Doe' },
          phones: [{ phone: '+1234567890', type: 'WORK' }],
        },
      ]);
      expect(msg.type).toBe('contacts');
      expect((msg as any).contacts).toHaveLength(1);
      expect((msg as any).contacts[0].name.formatted_name).toBe('John Doe');
    });
  });

  describe('buildReactionMessage', () => {
    it('creates a reaction message', () => {
      const msg = buildReactionMessage('wamid.original123', '👍');
      expect(msg).toEqual({
        type: 'reaction',
        reaction: { message_id: 'wamid.original123', emoji: '👍' },
      });
    });

    it('creates a reaction removal (empty emoji)', () => {
      const msg = buildReactionMessage('wamid.original123', '');
      expect(msg).toEqual({
        type: 'reaction',
        reaction: { message_id: 'wamid.original123', emoji: '' },
      });
    });
  });

  describe('buildInteractiveButtonsMessage', () => {
    it('creates an interactive buttons message', () => {
      const msg = buildInteractiveButtonsMessage({
        body: 'Choose an option',
        buttons: [
          { id: 'btn_1', title: 'Yes' },
          { id: 'btn_2', title: 'No' },
        ],
      });
      expect(msg.type).toBe('interactive');
      const interactive = (msg as any).interactive;
      expect(interactive.type).toBe('button');
      expect(interactive.body.text).toBe('Choose an option');
      expect(interactive.action.buttons).toHaveLength(2);
      expect(interactive.action.buttons[0]).toEqual({
        type: 'reply',
        reply: { id: 'btn_1', title: 'Yes' },
      });
    });

    it('includes header and footer when provided', () => {
      const msg = buildInteractiveButtonsMessage({
        body: 'Pick one',
        buttons: [{ id: 'a', title: 'A' }],
        header: { type: 'text', text: 'Header!' },
        footer: 'Footer text',
      });
      const interactive = (msg as any).interactive;
      expect(interactive.header).toEqual({ type: 'text', text: 'Header!' });
      expect(interactive.footer).toEqual({ text: 'Footer text' });
    });
  });

  describe('buildInteractiveListMessage', () => {
    it('creates an interactive list message', () => {
      const msg = buildInteractiveListMessage({
        body: 'Select from below',
        buttonText: 'View Options',
        header: 'Our Menu',
        footer: 'Tap to select',
        sections: [
          {
            title: 'Section 1',
            rows: [
              { id: 'row_1', title: 'Item 1', description: 'Desc 1' },
              { id: 'row_2', title: 'Item 2' },
            ],
          },
        ],
      });
      const interactive = (msg as any).interactive;
      expect(interactive.type).toBe('list');
      expect(interactive.header).toEqual({ type: 'text', text: 'Our Menu' });
      expect(interactive.body.text).toBe('Select from below');
      expect(interactive.footer).toEqual({ text: 'Tap to select' });
      expect(interactive.action.button).toBe('View Options');
      expect(interactive.action.sections[0].rows[0]).toEqual({
        id: 'row_1', title: 'Item 1', description: 'Desc 1',
      });
      // Row without description should not have description key
      expect(interactive.action.sections[0].rows[1]).toEqual({
        id: 'row_2', title: 'Item 2',
      });
    });
  });

  describe('buildSingleProductMessage', () => {
    it('creates a product message', () => {
      const msg = buildSingleProductMessage({
        catalogId: 'cat-123',
        productRetailerId: 'sku-456',
        body: 'Check this out',
        footer: 'Limited offer',
      });
      const interactive = (msg as any).interactive;
      expect(interactive.type).toBe('product');
      expect(interactive.action.catalog_id).toBe('cat-123');
      expect(interactive.action.product_retailer_id).toBe('sku-456');
      expect(interactive.body.text).toBe('Check this out');
      expect(interactive.footer.text).toBe('Limited offer');
    });
  });

  describe('buildMultiProductMessage', () => {
    it('creates a multi-product message', () => {
      const msg = buildMultiProductMessage({
        catalogId: 'cat-123',
        header: 'Products',
        body: 'Browse our selection',
        sections: [
          {
            title: 'Deals',
            productItems: [
              { productRetailerId: 'sku-1' },
              { productRetailerId: 'sku-2' },
            ],
          },
        ],
      });
      const interactive = (msg as any).interactive;
      expect(interactive.type).toBe('product_list');
      expect(interactive.action.catalog_id).toBe('cat-123');
      expect(interactive.action.sections[0].product_items[0].product_retailer_id).toBe('sku-1');
    });
  });

  describe('buildCatalogMessage', () => {
    it('creates a catalog message', () => {
      const msg = buildCatalogMessage({
        body: 'Browse our catalog!',
        thumbnailProductRetailerId: 'sku-thumb',
        footer: 'Best deals',
      });
      const interactive = (msg as any).interactive;
      expect(interactive.type).toBe('catalog_message');
      expect(interactive.action.name).toBe('catalog_message');
      expect(interactive.action.parameters.thumbnail_product_retailer_id).toBe('sku-thumb');
    });
  });

  describe('buildTemplateMessage', () => {
    it('creates a template message with components', () => {
      const msg = buildTemplateMessage({
        name: 'order_confirmation',
        language: 'en_US',
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: 'John' },
              { type: 'text', text: '#12345' },
            ],
          },
        ],
      });
      expect(msg).toEqual({
        type: 'template',
        template: {
          name: 'order_confirmation',
          language: { code: 'en_US' },
          components: [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: 'John' },
                { type: 'text', text: '#12345' },
              ],
            },
          ],
        },
      });
    });

    it('creates a simple template without components', () => {
      const msg = buildTemplateMessage({ name: 'hello_world', language: 'en' });
      expect(msg).toEqual({
        type: 'template',
        template: { name: 'hello_world', language: { code: 'en' } },
      });
    });
  });

  describe('buildMarkAsReadPayload', () => {
    it('creates a mark-as-read payload', () => {
      const payload = buildMarkAsReadPayload('wamid.abc123');
      expect(payload).toEqual({
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: 'wamid.abc123',
      });
    });
  });

  describe('buildPayload (universal wrapper)', () => {
    it('wraps a text message with context when replyTo is set', () => {
      const message: OutboundMessage = {
        type: 'text',
        text: { body: 'Thanks!', preview_url: false },
      };
      const payload = buildPayload('919876543210', message, { replyTo: 'wamid.original' });

      expect(payload.messaging_product).toBe('whatsapp');
      expect(payload.recipient_type).toBe('individual');
      expect(payload.to).toBe('919876543210');
      expect(payload.type).toBe('text');
      expect(payload.text).toEqual({ body: 'Thanks!', preview_url: false });
      expect(payload.context).toEqual({ message_id: 'wamid.original' });
    });

    it('attaches biz_opaque_callback_data when provided', () => {
      const message: OutboundMessage = { type: 'text', text: { body: 'Hi' } };
      const payload = buildPayload('919876543210', message, {
        bizOpaqueCallbackData: 'tracking-xyz',
      });
      expect(payload.biz_opaque_callback_data).toBe('tracking-xyz');
    });

    it('omits context when no replyTo', () => {
      const message: OutboundMessage = { type: 'text', text: { body: 'Hi' } };
      const payload = buildPayload('919876543210', message);
      expect(payload.context).toBeUndefined();
    });
  });
});

// ============================================================================
// Client tests
// ============================================================================

describe('WhatsAppClient', () => {
  describe('constructor', () => {
    it('throws if phoneNumberId is missing', () => {
      expect(() => new WhatsAppClient({ phoneNumberId: '', accessToken: 'token' } as any))
        .toThrow('phoneNumberId is required');
    });

    it('throws if accessToken is missing', () => {
      expect(() => new WhatsAppClient({ phoneNumberId: '123', accessToken: '' } as any))
        .toThrow('accessToken is required');
    });
  });

  describe('sendText', () => {
    it('sends a text message and returns messageId', async () => {
      const mockFetch = createMockFetch();
      const client = createClient(mockFetch);
      const result = await client.sendText('919876543210', 'Hello!');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.messageId).toBe('wamid.abc123');
      }

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, init] = (mockFetch as any).mock.calls[0];
      expect(url).toBe('https://graph.facebook.com/v21.0/123456789/messages');
      expect(init.method).toBe('POST');
      expect(init.headers['Authorization']).toBe('Bearer test-token-abc');

      const body = JSON.parse(init.body);
      expect(body.messaging_product).toBe('whatsapp');
      expect(body.to).toBe('919876543210');
      expect(body.type).toBe('text');
      expect(body.text.body).toBe('Hello!');
    });

    it('sends a reply with context', async () => {
      const mockFetch = createMockFetch();
      const client = createClient(mockFetch);
      await client.sendText('919876543210', 'Got it!', { replyTo: 'wamid.original' });

      const body = JSON.parse((mockFetch as any).mock.calls[0][1].body);
      expect(body.context).toEqual({ message_id: 'wamid.original' });
    });

    it('sends text with preview_url enabled', async () => {
      const mockFetch = createMockFetch();
      const client = createClient(mockFetch);
      await client.sendText('919876543210', 'https://example.com', { previewUrl: true });

      const body = JSON.parse((mockFetch as any).mock.calls[0][1].body);
      expect(body.text.preview_url).toBe(true);
    });
  });

  describe('sendImage', () => {
    it('sends an image with URL', async () => {
      const mockFetch = createMockFetch();
      const client = createClient(mockFetch);
      const result = await client.sendImage('919876543210', {
        link: 'https://example.com/img.jpg',
        caption: 'Photo',
      });

      expect(result.success).toBe(true);
      const body = JSON.parse((mockFetch as any).mock.calls[0][1].body);
      expect(body.type).toBe('image');
      expect(body.image.link).toBe('https://example.com/img.jpg');
      expect(body.image.caption).toBe('Photo');
    });

    it('sends an image with media ID', async () => {
      const mockFetch = createMockFetch();
      const client = createClient(mockFetch);
      await client.sendImage('919876543210', { id: 'media-123' });

      const body = JSON.parse((mockFetch as any).mock.calls[0][1].body);
      expect(body.image.id).toBe('media-123');
      expect(body.image.link).toBeUndefined();
    });
  });

  describe('sendVideo', () => {
    it('sends a video with URL and caption', async () => {
      const mockFetch = createMockFetch();
      const client = createClient(mockFetch);
      await client.sendVideo('919876543210', { link: 'https://example.com/v.mp4', caption: 'Watch' });

      const body = JSON.parse((mockFetch as any).mock.calls[0][1].body);
      expect(body.type).toBe('video');
      expect(body.video.link).toBe('https://example.com/v.mp4');
    });
  });

  describe('sendAudio', () => {
    it('sends an audio with media ID', async () => {
      const mockFetch = createMockFetch();
      const client = createClient(mockFetch);
      await client.sendAudio('919876543210', { id: 'audio-789' });

      const body = JSON.parse((mockFetch as any).mock.calls[0][1].body);
      expect(body.type).toBe('audio');
      expect(body.audio.id).toBe('audio-789');
    });
  });

  describe('sendDocument', () => {
    it('sends a document with URL, caption, and filename', async () => {
      const mockFetch = createMockFetch();
      const client = createClient(mockFetch);
      await client.sendDocument('919876543210', {
        link: 'https://example.com/doc.pdf',
        caption: 'Invoice',
        filename: 'invoice.pdf',
      });

      const body = JSON.parse((mockFetch as any).mock.calls[0][1].body);
      expect(body.type).toBe('document');
      expect(body.document.filename).toBe('invoice.pdf');
    });
  });

  describe('sendSticker', () => {
    it('sends a sticker with URL', async () => {
      const mockFetch = createMockFetch();
      const client = createClient(mockFetch);
      await client.sendSticker('919876543210', { link: 'https://example.com/sticker.webp' });

      const body = JSON.parse((mockFetch as any).mock.calls[0][1].body);
      expect(body.type).toBe('sticker');
      expect(body.sticker.link).toBe('https://example.com/sticker.webp');
    });
  });

  describe('sendLocation', () => {
    it('sends a location', async () => {
      const mockFetch = createMockFetch();
      const client = createClient(mockFetch);
      await client.sendLocation('919876543210', {
        latitude: 40.7128,
        longitude: -74.006,
        name: 'NYC',
        address: '123 Main St',
      });

      const body = JSON.parse((mockFetch as any).mock.calls[0][1].body);
      expect(body.type).toBe('location');
      expect(body.location.latitude).toBe(40.7128);
      expect(body.location.name).toBe('NYC');
    });
  });

  describe('sendContacts', () => {
    it('sends contact cards', async () => {
      const mockFetch = createMockFetch();
      const client = createClient(mockFetch);
      await client.sendContacts('919876543210', [
        {
          name: { formatted_name: 'Jane Doe' },
          phones: [{ phone: '+1555555555', type: 'WORK' }],
          emails: [{ email: 'jane@example.com', type: 'WORK' }],
        },
      ]);

      const body = JSON.parse((mockFetch as any).mock.calls[0][1].body);
      expect(body.type).toBe('contacts');
      expect(body.contacts).toHaveLength(1);
      expect(body.contacts[0].name.formatted_name).toBe('Jane Doe');
    });
  });

  describe('sendReaction', () => {
    it('sends a reaction emoji', async () => {
      const mockFetch = createMockFetch();
      const client = createClient(mockFetch);
      await client.sendReaction('919876543210', 'wamid.msg123', '❤️');

      const body = JSON.parse((mockFetch as any).mock.calls[0][1].body);
      expect(body.type).toBe('reaction');
      expect(body.reaction.message_id).toBe('wamid.msg123');
      expect(body.reaction.emoji).toBe('❤️');
    });
  });

  describe('sendInteractiveButtons', () => {
    it('sends an interactive button message', async () => {
      const mockFetch = createMockFetch();
      const client = createClient(mockFetch);
      await client.sendInteractiveButtons('919876543210', {
        body: 'Choose one',
        buttons: [
          { id: 'yes', title: 'Yes' },
          { id: 'no', title: 'No' },
        ],
      });

      const body = JSON.parse((mockFetch as any).mock.calls[0][1].body);
      expect(body.type).toBe('interactive');
      expect(body.interactive.type).toBe('button');
      expect(body.interactive.action.buttons).toHaveLength(2);
    });
  });

  describe('sendInteractiveList', () => {
    it('sends an interactive list message', async () => {
      const mockFetch = createMockFetch();
      const client = createClient(mockFetch);
      await client.sendInteractiveList('919876543210', {
        body: 'Pick an item',
        buttonText: 'View Options',
        sections: [
          {
            title: 'Section A',
            rows: [{ id: 'r1', title: 'Row 1', description: 'Desc' }],
          },
        ],
        header: 'Menu',
        footer: 'Footer',
      });

      const body = JSON.parse((mockFetch as any).mock.calls[0][1].body);
      expect(body.interactive.type).toBe('list');
      expect(body.interactive.action.button).toBe('View Options');
      expect(body.interactive.action.sections[0].title).toBe('Section A');
    });
  });

  describe('sendTemplate', () => {
    it('sends a template message', async () => {
      const mockFetch = createMockFetch();
      const client = createClient(mockFetch);
      await client.sendTemplate('919876543210', {
        name: 'hello_world',
        language: 'en_US',
        components: [
          {
            type: 'body',
            parameters: [{ type: 'text', text: 'John' }],
          },
        ],
      });

      const body = JSON.parse((mockFetch as any).mock.calls[0][1].body);
      expect(body.type).toBe('template');
      expect(body.template.name).toBe('hello_world');
      expect(body.template.language.code).toBe('en_US');
    });
  });

  describe('sendProduct', () => {
    it('sends a single product message', async () => {
      const mockFetch = createMockFetch();
      const client = createClient(mockFetch);
      await client.sendProduct('919876543210', {
        catalogId: 'cat-1',
        productRetailerId: 'sku-1',
      });

      const body = JSON.parse((mockFetch as any).mock.calls[0][1].body);
      expect(body.interactive.type).toBe('product');
      expect(body.interactive.action.catalog_id).toBe('cat-1');
    });
  });

  describe('sendCatalog', () => {
    it('sends a catalog message', async () => {
      const mockFetch = createMockFetch();
      const client = createClient(mockFetch);
      await client.sendCatalog('919876543210', {
        body: 'Browse our catalog',
        thumbnailProductRetailerId: 'sku-thumb',
      });

      const body = JSON.parse((mockFetch as any).mock.calls[0][1].body);
      expect(body.interactive.type).toBe('catalog_message');
      expect(body.interactive.action.name).toBe('catalog_message');
    });
  });

  describe('markAsRead', () => {
    it('sends a mark-as-read request', async () => {
      const mockFetch = createMockFetch();
      const client = createClient(mockFetch);
      const result = await client.markAsRead('wamid.read123');

      expect(result.success).toBe(true);
      const body = JSON.parse((mockFetch as any).mock.calls[0][1].body);
      expect(body.messaging_product).toBe('whatsapp');
      expect(body.status).toBe('read');
      expect(body.message_id).toBe('wamid.read123');
    });
  });

  describe('send (universal)', () => {
    it('sends any OutboundMessage', async () => {
      const mockFetch = createMockFetch();
      const client = createClient(mockFetch);
      const msg: OutboundMessage = {
        type: 'location',
        location: { latitude: 1.23, longitude: 4.56 },
      };
      const result = await client.send('919876543210', msg);

      expect(result.success).toBe(true);
      const body = JSON.parse((mockFetch as any).mock.calls[0][1].body);
      expect(body.type).toBe('location');
      expect(body.location.latitude).toBe(1.23);
    });
  });

  describe('sendRaw', () => {
    it('sends a raw payload', async () => {
      const mockFetch = createMockFetch();
      const client = createClient(mockFetch);
      const result = await client.sendRaw({
        messaging_product: 'whatsapp',
        to: '919876543210',
        type: 'text',
        text: { body: 'raw' },
      });

      expect(result.success).toBe(true);
      const body = JSON.parse((mockFetch as any).mock.calls[0][1].body);
      expect(body.text.body).toBe('raw');
    });
  });

  describe('error handling', () => {
    it('returns SendError on API error responses', async () => {
      const mockFetch = createMockFetch(
        { error: { code: 131030, message: 'Rate limit', error_data: { details: 'slow down' } } },
        false,
      );
      const client = createClient(mockFetch);
      const result = await client.sendText('919876543210', 'Hi');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(131030);
        expect(result.error.message).toBe('Rate limit');
      }
    });

    it('returns SendError on network failure', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network timeout')) as unknown as FetchFunction;
      const client = createClient(mockFetch);
      const result = await client.sendText('919876543210', 'Hi');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(0);
        expect(result.error.message).toBe('Network timeout');
      }
    });

    it('never throws — always returns a result', async () => {
      const mockFetch = vi.fn().mockRejectedValue('something weird') as unknown as FetchFunction;
      const client = createClient(mockFetch);
      const result = await client.sendText('919876543210', 'Hi');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Network request failed');
      }
    });
  });

  describe('API version and base URL', () => {
    it('uses custom API version', async () => {
      const mockFetch = createMockFetch();
      const client = new WhatsAppClient({
        phoneNumberId: '111',
        accessToken: 'tok',
        apiVersion: 'v19.0',
        fetch: mockFetch,
      });
      await client.sendText('919876543210', 'Hi');

      const url = (mockFetch as any).mock.calls[0][0];
      expect(url).toBe('https://graph.facebook.com/v19.0/111/messages');
    });

    it('uses custom base URL', async () => {
      const mockFetch = createMockFetch();
      const client = new WhatsAppClient({
        phoneNumberId: '111',
        accessToken: 'tok',
        baseUrl: 'https://mock-api.test',
        fetch: mockFetch,
      });
      await client.sendText('919876543210', 'Hi');

      const url = (mockFetch as any).mock.calls[0][0];
      expect(url).toBe('https://mock-api.test/v21.0/111/messages');
    });
  });
});
