export function extractSender(rawMessage: any, rawContact: any | null | undefined) {
  return {
    phone: rawMessage.from,
    name: rawContact?.profile?.name ?? null,
    waId: rawContact?.wa_id ?? rawMessage.from,
  };
}
