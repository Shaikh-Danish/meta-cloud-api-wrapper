export function extractContext(rawMessage: any) {
  if (!rawMessage.context) {
    return undefined;
  }

  const { context } = rawMessage;

  return {
    messageId: context.id,
    from: context.from,
    forwarded: context.forwarded,
    frequentlyForwarded: context.frequently_forwarded,
    referredProduct: context.referred_product
      ? {
          catalogId: context.referred_product.catalog_id,
          productRetailerId: context.referred_product.product_retailer_id,
        }
      : undefined,
  };
}
