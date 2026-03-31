import type { MessageHandler } from '../registry.js';
import type { IncomingMessage } from '../../../types/incoming.js';

export const orderHandler: MessageHandler<Extract<IncomingMessage, { type: 'order' }>> = {
  type: 'order',
  parse(rawMessage: any) {
    return {
      type: 'order',
      order: {
        catalogId: rawMessage.order.catalog_id,
        text: rawMessage.order.text,
        productItems: rawMessage.order.product_items?.map((item: any) => ({
          productRetailerId: item.product_retailer_id,
          quantity: item.quantity,
          itemPrice: item.item_price,
          currency: item.currency,
        })) || [],
      },
    };
  },
};
