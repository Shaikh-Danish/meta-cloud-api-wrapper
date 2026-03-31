import { describe, it, expect } from 'vitest';
import { parseWebhook } from '../src/index.js';
import type { IncomingPayload, OutgoingPayload } from '../src/index.js';

// ============================================================================
// Test Fixtures — clean JSON versions of the webhook samples
// ============================================================================

const textMessageWebhook = {
  object: 'whatsapp_business_account',
  entry: [
    {
      id: 'WABA_001',
      changes: [
        {
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '15551234567',
              phone_number_id: 'PHONE_001',
            },
            contacts: [
              {
                profile: { name: 'John Doe' },
                wa_id: '919876543210',
              },
            ],
            messages: [
              {
                from: '919876543210',
                id: 'wamid.HBgLMTU1NTEyMzQ1NjcVAgASGCA=',
                timestamp: '1710000000',
                type: 'text',
                text: { body: 'Hello from WhatsApp!' },
              },
            ],
          },
          field: 'messages',
        },
      ],
    },
  ],
};

const textWithContextWebhook = {
  object: 'whatsapp_business_account',
  entry: [
    {
      id: 'WABA_001',
      changes: [
        {
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '15551234567',
              phone_number_id: 'PHONE_001',
            },
            contacts: [
              {
                profile: { name: 'Jane' },
                wa_id: '919876543210',
              },
            ],
            messages: [
              {
                from: '919876543210',
                id: 'wamid.reply001',
                timestamp: '1710000001',
                type: 'text',
                text: { body: 'This is a reply' },
                context: {
                  from: '15551234567',
                  id: 'wamid.original001',
                  referred_product: {
                    catalog_id: 'CAT_001',
                    product_retailer_id: 'PROD_001',
                  },
                },
                referral: {
                  source_url: 'https://ad.example.com',
                  source_id: 'AD_001',
                  source_type: 'ad',
                  body: 'Check out our product',
                  headline: 'Summer Sale',
                  media_type: 'image',
                  image_url: 'https://ad.example.com/image.jpg',
                  ctwa_clid: 'CLICK_001',
                },
              },
            ],
          },
          field: 'messages',
        },
      ],
    },
  ],
};

const imageWebhook = {
  object: 'whatsapp_business_account',
  entry: [
    {
      id: 'WABA_001',
      changes: [
        {
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '15551234567',
              phone_number_id: 'PHONE_001',
            },
            contacts: [
              {
                profile: { name: 'Alice' },
                wa_id: '919876543210',
              },
            ],
            messages: [
              {
                from: '919876543210',
                id: 'wamid.image001',
                timestamp: '1710000002',
                type: 'image',
                image: {
                  id: 'MEDIA_ID_001',
                  mime_type: 'image/jpeg',
                  sha256: 'abc123sha256hash',
                  caption: 'Check this out!',
                },
              },
            ],
          },
          field: 'messages',
        },
      ],
    },
  ],
};

const audioWebhook = {
  object: 'whatsapp_business_account',
  entry: [
    {
      id: 'WABA_001',
      changes: [
        {
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '15551234567',
              phone_number_id: 'PHONE_001',
            },
            contacts: [
              {
                profile: { name: 'Bob' },
                wa_id: '919876543210',
              },
            ],
            messages: [
              {
                from: '919876543210',
                id: 'wamid.audio001',
                timestamp: '1710000003',
                type: 'audio',
                audio: {
                  id: 'MEDIA_ID_002',
                  mime_type: 'audio/ogg; codecs=opus',
                  sha256: 'def456sha256hash',
                  voice: true,
                },
              },
            ],
          },
          field: 'messages',
        },
      ],
    },
  ],
};

const documentWebhook = {
  object: 'whatsapp_business_account',
  entry: [
    {
      id: 'WABA_001',
      changes: [
        {
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '15551234567',
              phone_number_id: 'PHONE_001',
            },
            contacts: [
              {
                profile: { name: 'Charlie' },
                wa_id: '919876543210',
              },
            ],
            messages: [
              {
                from: '919876543210',
                id: 'wamid.doc001',
                timestamp: '1710000004',
                type: 'document',
                document: {
                  id: 'MEDIA_ID_003',
                  mime_type: 'application/pdf',
                  sha256: 'ghi789sha256hash',
                  filename: 'invoice.pdf',
                  caption: 'Invoice for March',
                },
              },
            ],
          },
          field: 'messages',
        },
      ],
    },
  ],
};

const locationWebhook = {
  object: 'whatsapp_business_account',
  entry: [
    {
      id: 'WABA_001',
      changes: [
        {
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '15551234567',
              phone_number_id: 'PHONE_001',
            },
            contacts: [
              {
                profile: { name: 'Dave' },
                wa_id: '919876543210',
              },
            ],
            messages: [
              {
                from: '919876543210',
                id: 'wamid.loc001',
                timestamp: '1710000005',
                type: 'location',
                location: {
                  latitude: 28.6139,
                  longitude: 77.2090,
                  name: 'India Gate',
                  address: 'Rajpath, New Delhi',
                },
              },
            ],
          },
          field: 'messages',
        },
      ],
    },
  ],
};

const buttonWebhook = {
  object: 'whatsapp_business_account',
  entry: [
    {
      id: 'WABA_001',
      changes: [
        {
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '15551234567',
              phone_number_id: 'PHONE_001',
            },
            contacts: [
              {
                profile: { name: 'Eve' },
                wa_id: '919876543210',
              },
            ],
            messages: [
              {
                from: '919876543210',
                id: 'wamid.btn001',
                timestamp: '1710000006',
                type: 'button',
                button: {
                  payload: 'btn_confirm_order',
                  text: 'Confirm Order',
                },
                context: {
                  from: '15551234567',
                  id: 'wamid.original_template_msg',
                },
              },
            ],
          },
          field: 'messages',
        },
      ],
    },
  ],
};

const interactiveListReplyWebhook = {
  object: 'whatsapp_business_account',
  entry: [
    {
      id: 'WABA_001',
      changes: [
        {
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '15551234567',
              phone_number_id: 'PHONE_001',
            },
            contacts: [
              {
                profile: { name: 'Frank' },
                wa_id: '919876543210',
              },
            ],
            messages: [
              {
                from: '919876543210',
                id: 'wamid.list001',
                timestamp: '1710000007',
                type: 'interactive',
                interactive: {
                  type: 'list_reply',
                  list_reply: {
                    id: 'option_pizza',
                    title: 'Margherita Pizza',
                    description: 'Classic cheese pizza',
                  },
                },
              },
            ],
          },
          field: 'messages',
        },
      ],
    },
  ],
};

const interactiveButtonReplyWebhook = {
  object: 'whatsapp_business_account',
  entry: [
    {
      id: 'WABA_001',
      changes: [
        {
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '15551234567',
              phone_number_id: 'PHONE_001',
            },
            contacts: [
              {
                profile: { name: 'Grace' },
                wa_id: '919876543210',
              },
            ],
            messages: [
              {
                from: '919876543210',
                id: 'wamid.btnreply001',
                timestamp: '1710000008',
                type: 'interactive',
                interactive: {
                  type: 'button_reply',
                  button_reply: {
                    id: 'btn_yes',
                    title: 'Yes',
                  },
                },
              },
            ],
          },
          field: 'messages',
        },
      ],
    },
  ],
};

const orderWebhook = {
  object: 'whatsapp_business_account',
  entry: [
    {
      id: 'WABA_001',
      changes: [
        {
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '15551234567',
              phone_number_id: 'PHONE_001',
            },
            contacts: [
              {
                profile: { name: 'Henry' },
                wa_id: '919876543210',
              },
            ],
            messages: [
              {
                from: '919876543210',
                id: 'wamid.order001',
                timestamp: '1710000009',
                type: 'order',
                order: {
                  catalog_id: 'CAT_100',
                  text: 'Please deliver by 5pm',
                  product_items: [
                    {
                      product_retailer_id: 'SKU_001',
                      quantity: 2,
                      item_price: 499,
                      currency: 'INR',
                    },
                    {
                      product_retailer_id: 'SKU_002',
                      quantity: 1,
                      item_price: 999,
                      currency: 'INR',
                    },
                  ],
                },
              },
            ],
          },
          field: 'messages',
        },
      ],
    },
  ],
};

const reactionWebhook = {
  object: 'whatsapp_business_account',
  entry: [
    {
      id: 'WABA_001',
      changes: [
        {
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '15551234567',
              phone_number_id: 'PHONE_001',
            },
            contacts: [
              {
                profile: { name: 'Ivy' },
                wa_id: '919876543210',
              },
            ],
            messages: [
              {
                from: '919876543210',
                id: 'wamid.reaction001',
                timestamp: '1710000010',
                type: 'reaction',
                reaction: {
                  message_id: 'wamid.HBgLMTU1NTEyMzQ1NjcVAgASGCA=',
                  emoji: '👍',
                },
              },
            ],
          },
          field: 'messages',
        },
      ],
    },
  ],
};

const statusSentWebhook = {
  object: 'whatsapp_business_account',
  entry: [
    {
      id: 'WABA_001',
      changes: [
        {
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '15551234567',
              phone_number_id: 'PHONE_001',
            },
            statuses: [
              {
                id: 'wamid.sent001',
                status: 'sent',
                timestamp: '1710000011',
                recipient_id: '919876543210',
                conversation: {
                  id: 'CONV_001',
                  expiration_timestamp: '1710086400',
                  origin: { type: 'business_initiated' },
                },
                pricing: {
                  billable: true,
                  pricing_model: 'CBP',
                  type: 'business_initiated',
                  category: 'business_initiated',
                },
              },
            ],
          },
          field: 'messages',
        },
      ],
    },
  ],
};

const statusDeliveredWebhook = {
  object: 'whatsapp_business_account',
  entry: [
    {
      id: 'WABA_001',
      changes: [
        {
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '15551234567',
              phone_number_id: 'PHONE_001',
            },
            statuses: [
              {
                id: 'wamid.delivered001',
                status: 'delivered',
                timestamp: '1710000012',
                recipient_id: '919876543210',
              },
            ],
          },
          field: 'messages',
        },
      ],
    },
  ],
};

const statusFailedWebhook = {
  object: 'whatsapp_business_account',
  entry: [
    {
      id: 'WABA_001',
      changes: [
        {
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '15551234567',
              phone_number_id: 'PHONE_001',
            },
            statuses: [
              {
                id: 'wamid.failed001',
                status: 'failed',
                timestamp: '1710000013',
                recipient_id: '919876543210',
                errors: [
                  {
                    code: 131026,
                    title: 'Message undeliverable',
                    message: 'The recipient phone number is not a WhatsApp phone number',
                    error_data: {
                      details: 'Message undeliverable. Check recipient number.',
                    },
                    href: 'https://developers.facebook.com/docs/whatsapp/cloud-api/support/error-codes',
                  },
                ],
              },
            ],
          },
          field: 'messages',
        },
      ],
    },
  ],
};

// ============================================================================
// Tests
// ============================================================================

describe('parseWebhook', () => {
  describe('Envelope validation', () => {
    it('should reject null/undefined input', () => {
      const results = parseWebhook(null);
      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
      if (!results[0].success) {
        expect(results[0].error.code).toBe('invalid_envelope');
      }
    });

    it('should reject non-object input', () => {
      const results = parseWebhook('not an object');
      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
    });

    it('should reject payload with wrong object type', () => {
      const results = parseWebhook({ object: 'instagram', entry: [] });
      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
    });

    it('should reject empty entries', () => {
      const results = parseWebhook({
        object: 'whatsapp_business_account',
        entry: [],
      });
      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
      if (!results[0].success) {
        expect(results[0].error.code).toBe('no_processable_changes');
      }
    });
  });

  describe('Incoming messages — Stream routing', () => {
    it('should parse a simple text message', () => {
      const results = parseWebhook(textMessageWebhook);
      expect(results).toHaveLength(1);

      const result = results[0];
      expect(result.success).toBe(true);
      if (!result.success) return;

      const data = result.data as IncomingPayload;
      expect(data.stream).toBe('incoming');
      expect(data.wabaId).toBe('WABA_001');
      expect(data.metadata.displayPhoneNumber).toBe('15551234567');
      expect(data.metadata.phoneNumberId).toBe('PHONE_001');
      expect(data.from.phone).toBe('919876543210');
      expect(data.from.name).toBe('John Doe');
      expect(data.from.waId).toBe('919876543210');
      expect(data.messageId).toBe('wamid.HBgLMTU1NTEyMzQ1NjcVAgASGCA=');
      expect(data.timestamp).toBe(1710000000);
      expect(data.type).toBe('text');

      // Discriminated union check
      expect(data.message.type).toBe('text');
      if (data.message.type === 'text') {
        expect(data.message.text.body).toBe('Hello from WhatsApp!');
      }
    });

    it('should parse text message with context and referral', () => {
      const results = parseWebhook(textWithContextWebhook);
      expect(results).toHaveLength(1);

      const result = results[0];
      expect(result.success).toBe(true);
      if (!result.success) return;

      const data = result.data as IncomingPayload;
      expect(data.context).toBeDefined();
      expect(data.context!.messageId).toBe('wamid.original001');
      expect(data.context!.from).toBe('15551234567');
      expect(data.context!.referredProduct).toBeDefined();
      expect(data.context!.referredProduct!.catalogId).toBe('CAT_001');

      expect(data.referral).toBeDefined();
      expect(data.referral!.sourceUrl).toBe('https://ad.example.com');
      expect(data.referral!.sourceId).toBe('AD_001');
      expect(data.referral!.sourceType).toBe('ad');
      expect(data.referral!.headline).toBe('Summer Sale');
    });
  });

  describe('Incoming messages — Media handlers', () => {
    it('should parse image message with caption', () => {
      const results = parseWebhook(imageWebhook);
      const data = results[0].success ? (results[0].data as IncomingPayload) : null;
      expect(data).not.toBeNull();
      expect(data!.type).toBe('image');

      if (data!.message.type === 'image') {
        expect(data!.message.image.id).toBe('MEDIA_ID_001');
        expect(data!.message.image.mimeType).toBe('image/jpeg');
        expect(data!.message.image.sha256).toBe('abc123sha256hash');
        expect(data!.message.image.caption).toBe('Check this out!');
      }
    });

    it('should parse audio message with voice flag', () => {
      const results = parseWebhook(audioWebhook);
      const data = results[0].success ? (results[0].data as IncomingPayload) : null;
      expect(data).not.toBeNull();
      expect(data!.type).toBe('audio');

      if (data!.message.type === 'audio') {
        expect(data!.message.audio.id).toBe('MEDIA_ID_002');
        expect(data!.message.audio.voice).toBe(true);
      }
    });

    it('should parse document message with filename', () => {
      const results = parseWebhook(documentWebhook);
      const data = results[0].success ? (results[0].data as IncomingPayload) : null;
      expect(data).not.toBeNull();
      expect(data!.type).toBe('document');

      if (data!.message.type === 'document') {
        expect(data!.message.document.filename).toBe('invoice.pdf');
        expect(data!.message.document.caption).toBe('Invoice for March');
        expect(data!.message.document.mimeType).toBe('application/pdf');
      }
    });
  });

  describe('Incoming messages — Interactive handlers', () => {
    it('should parse location message', () => {
      const results = parseWebhook(locationWebhook);
      const data = results[0].success ? (results[0].data as IncomingPayload) : null;
      expect(data).not.toBeNull();
      expect(data!.type).toBe('location');

      if (data!.message.type === 'location') {
        expect(data!.message.location.latitude).toBe(28.6139);
        expect(data!.message.location.longitude).toBe(77.2090);
        expect(data!.message.location.name).toBe('India Gate');
        expect(data!.message.location.address).toBe('Rajpath, New Delhi');
      }
    });

    it('should parse button reply', () => {
      const results = parseWebhook(buttonWebhook);
      const data = results[0].success ? (results[0].data as IncomingPayload) : null;
      expect(data).not.toBeNull();
      expect(data!.type).toBe('button');

      if (data!.message.type === 'button') {
        expect(data!.message.button.payload).toBe('btn_confirm_order');
        expect(data!.message.button.text).toBe('Confirm Order');
      }

      // Should also have context
      expect(data!.context).toBeDefined();
      expect(data!.context!.messageId).toBe('wamid.original_template_msg');
    });

    it('should parse interactive list_reply', () => {
      const results = parseWebhook(interactiveListReplyWebhook);
      const data = results[0].success ? (results[0].data as IncomingPayload) : null;
      expect(data).not.toBeNull();
      expect(data!.type).toBe('interactive');

      if (data!.message.type === 'interactive') {
        expect(data!.message.interactive.type).toBe('list_reply');
        if (data!.message.interactive.type === 'list_reply') {
          expect(data!.message.interactive.listReply.id).toBe('option_pizza');
          expect(data!.message.interactive.listReply.title).toBe('Margherita Pizza');
          expect(data!.message.interactive.listReply.description).toBe('Classic cheese pizza');
        }
      }
    });

    it('should parse interactive button_reply', () => {
      const results = parseWebhook(interactiveButtonReplyWebhook);
      const data = results[0].success ? (results[0].data as IncomingPayload) : null;
      expect(data).not.toBeNull();
      expect(data!.type).toBe('interactive');

      if (data!.message.type === 'interactive') {
        expect(data!.message.interactive.type).toBe('button_reply');
        if (data!.message.interactive.type === 'button_reply') {
          expect(data!.message.interactive.buttonReply.id).toBe('btn_yes');
          expect(data!.message.interactive.buttonReply.title).toBe('Yes');
        }
      }
    });

    it('should parse order message', () => {
      const results = parseWebhook(orderWebhook);
      const data = results[0].success ? (results[0].data as IncomingPayload) : null;
      expect(data).not.toBeNull();
      expect(data!.type).toBe('order');

      if (data!.message.type === 'order') {
        expect(data!.message.order.catalogId).toBe('CAT_100');
        expect(data!.message.order.text).toBe('Please deliver by 5pm');
        expect(data!.message.order.productItems).toHaveLength(2);
        expect(data!.message.order.productItems[0].productRetailerId).toBe('SKU_001');
        expect(data!.message.order.productItems[0].quantity).toBe(2);
        expect(data!.message.order.productItems[0].itemPrice).toBe(499);
        expect(data!.message.order.productItems[1].currency).toBe('INR');
      }
    });

    it('should parse interactive nfm_reply (Flows)', () => {
      const results = parseWebhook(flowWebhook);
      const result = results[0];
      if (!result.success) return;
      const data = result.data as IncomingPayload;
      expect(data.type).toBe('interactive');

      if (data.message.type === 'interactive') {
        expect(data.message.interactive.type).toBe('nfm_reply');
        if (data.message.interactive.type === 'nfm_reply') {
          expect(data.message.interactive.nfmReply.name).toBe('flow');
          expect(data.message.interactive.nfmReply.body).toBe('Sent');
          expect(data.message.interactive.nfmReply.responseJson).toContain('TOKEN_001');
        }
      }
    });

    it('should parse reaction message', () => {
      const results = parseWebhook(reactionWebhook);
      const data = results[0].success ? (results[0].data as IncomingPayload) : null;
      expect(data).not.toBeNull();
      expect(data!.type).toBe('reaction');

      if (data!.message.type === 'reaction') {
        expect(data!.message.reaction.messageId).toBe('wamid.HBgLMTU1NTEyMzQ1NjcVAgASGCA=');
        expect(data!.message.reaction.emoji).toBe('👍');
      }
    });
  });

  describe('Incoming messages — Unknown types', () => {
    it('should handle unknown message types without throwing', () => {
      const webhook = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: 'WABA_001',
            changes: [
              {
                value: {
                  messaging_product: 'whatsapp',
                  metadata: {
                    display_phone_number: '15551234567',
                    phone_number_id: 'PHONE_001',
                  },
                  contacts: [{ profile: { name: 'Test' }, wa_id: '919876543210' }],
                  messages: [
                    {
                      from: '919876543210',
                      id: 'wamid.unknown001',
                      timestamp: '1710000099',
                      type: 'some_future_type',
                      some_future_type: { data: 'hello' },
                    },
                  ],
                },
                field: 'messages',
              },
            ],
          },
        ],
      };

      const results = parseWebhook(webhook);
      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);

      if (results[0].success) {
        const data = results[0].data as IncomingPayload;
        expect(data.type).toBe('unknown');
        if (data.message.type === 'unknown') {
          expect(data.message.raw).toBeDefined();
        }
      }
    });
  });

  describe('Outgoing stream — Status notifications', () => {
    it('should parse sent status with conversation and pricing', () => {
      const results = parseWebhook(statusSentWebhook);
      expect(results).toHaveLength(1);

      const result = results[0];
      expect(result.success).toBe(true);
      if (!result.success) return;

      const data = result.data as OutgoingPayload;
      expect(data.stream).toBe('outgoing');
      expect(data.wabaId).toBe('WABA_001');
      expect(data.messageId).toBe('wamid.sent001');
      expect(data.status).toBe('sent');
      expect(data.recipient.phone).toBe('919876543210');
      expect(data.timestamp).toBe(1710000011);

      // Conversation + Pricing
      expect(data.conversation).toBeDefined();
      expect(data.conversation!.id).toBe('CONV_001');
      expect(data.conversation!.origin.type).toBe('business_initiated');

      expect(data.pricing).toBeDefined();
      expect(data.pricing!.billable).toBe(true);
      expect(data.pricing!.pricingModel).toBe('CBP');
      expect(data.pricing!.category).toBe('business_initiated');
    });

    it('should parse delivered status without conversation/pricing', () => {
      const results = parseWebhook(statusDeliveredWebhook);
      expect(results).toHaveLength(1);

      const result = results[0];
      expect(result.success).toBe(true);
      if (!result.success) return;

      const data = result.data as OutgoingPayload;
      expect(data.stream).toBe('outgoing');
      expect(data.status).toBe('delivered');
      expect(data.recipient.phone).toBe('919876543210');
      expect(data.conversation).toBeUndefined();
      expect(data.pricing).toBeUndefined();
    });

    it('should parse failed status with errors', () => {
      const results = parseWebhook(statusFailedWebhook);
      expect(results).toHaveLength(1);

      const result = results[0];
      expect(result.success).toBe(true);
      if (!result.success) return;

      const data = result.data as OutgoingPayload;
      expect(data.stream).toBe('outgoing');
      expect(data.status).toBe('failed');

      expect(data.errors).toBeDefined();
      expect(data.errors).toHaveLength(1);
      expect(data.errors![0].code).toBe(131026);
      expect(data.errors![0].title).toBe('Message undeliverable');
      expect(data.errors![0].details).toBe('Message undeliverable. Check recipient number.');
      expect(data.errors![0].href).toContain('error-codes');
    });
  });

  describe('Immutability', () => {
    it('should NOT mutate the original input object', () => {
      const original = JSON.parse(JSON.stringify(textMessageWebhook));
      parseWebhook(textMessageWebhook);
      expect(textMessageWebhook).toEqual(original);
    });
  });

  describe('Never throws', () => {
    it('should return error result instead of throwing on garbage input', () => {
      expect(() => parseWebhook(undefined)).not.toThrow();
      expect(() => parseWebhook(42)).not.toThrow();
      expect(() => parseWebhook([])).not.toThrow();
      expect(() => parseWebhook({ object: 'whatsapp_business_account' })).not.toThrow();
    });
  });
});
