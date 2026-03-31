// ============================================================================
// Outbound message types — payloads sent TO Meta's API
// ============================================================================

// ---- Fetch type (avoids requiring DOM lib in tsconfig) ----

/** A fetch-compatible function signature */
export type FetchFunction = (
  url: string,
  init?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  },
) => Promise<{ ok: boolean; status: number; statusText: string; json: () => Promise<unknown> }>;

// ---- Client configuration ----

export interface ClientConfig {
  /** The Phone Number ID from your Meta Business dashboard */
  phoneNumberId: string;
  /** Permanent access token for the WhatsApp Business API */
  accessToken: string;
  /** Graph API version (defaults to "v21.0") */
  apiVersion?: string;
  /** Custom fetch implementation. Defaults to globalThis.fetch */
  fetch?: FetchFunction;
  /** Base URL override (useful for testing). Defaults to "https://graph.facebook.com" */
  baseUrl?: string;
}

// ---- Send options (cross-cutting concerns) ----

export interface SendOptions {
  /** Reply to a specific message by its WhatsApp message ID */
  replyTo?: string;
  /** Custom opaque callback data for tracking (returned in status webhooks) */
  bizOpaqueCallbackData?: string;
}

export interface SendTextOptions extends SendOptions {
  /** Enable URL preview in the text message */
  previewUrl?: boolean;
}

// ---- Media source (mutually exclusive: link OR id) ----

export type MediaSource =
  | { link: string; id?: never }
  | { id: string; link?: never };

// ---- Convenience parameter types for each message kind ----

export type SendImageParams = MediaSource & {
  caption?: string;
};

export type SendVideoParams = MediaSource & {
  caption?: string;
};

export type SendAudioParams = MediaSource;

export type SendDocumentParams = MediaSource & {
  caption?: string;
  filename?: string;
};

export type SendStickerParams = MediaSource;

export interface SendLocationParams {
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
}

// ---- Contact types (reuse from incoming but as send-side) ----

export interface SendContactName {
  formatted_name: string;
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  suffix?: string;
  prefix?: string;
}

export interface SendContactPhone {
  phone?: string;
  wa_id?: string;
  type?: 'HOME' | 'WORK' | string;
}

export interface SendContactEmail {
  email?: string;
  type?: 'HOME' | 'WORK' | string;
}

export interface SendContactAddress {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  country_code?: string;
  type?: 'HOME' | 'WORK' | string;
}

export interface SendContactUrl {
  url?: string;
  type?: 'HOME' | 'WORK' | string;
}

export interface SendContactOrg {
  company?: string;
  department?: string;
  title?: string;
}

export interface SendContactCard {
  name: SendContactName;
  phones?: SendContactPhone[];
  emails?: SendContactEmail[];
  addresses?: SendContactAddress[];
  urls?: SendContactUrl[];
  org?: SendContactOrg;
  birthday?: string;
}

// ---- Interactive: Buttons ----

export interface SendButton {
  id: string;
  title: string;
}

export interface SendInteractiveButtonsParams {
  body: string;
  buttons: SendButton[];
  header?: InteractiveHeader;
  footer?: string;
}

// ---- Interactive: List ----

export interface SendListRow {
  id: string;
  title: string;
  description?: string;
}

export interface SendListSection {
  title: string;
  rows: SendListRow[];
}

export interface SendInteractiveListParams {
  body: string;
  buttonText: string;
  sections: SendListSection[];
  header?: string;
  footer?: string;
}

// ---- Interactive: Product ----

export interface SendSingleProductParams {
  catalogId: string;
  productRetailerId: string;
  body?: string;
  footer?: string;
}

// ---- Interactive: Product List ----

export interface SendProductSection {
  title: string;
  productItems: Array<{ productRetailerId: string }>;
}

export interface SendMultiProductParams {
  catalogId: string;
  sections: SendProductSection[];
  header: string;
  body: string;
  footer?: string;
}

// ---- Interactive: Catalog ----

export interface SendCatalogParams {
  body: string;
  thumbnailProductRetailerId?: string;
  footer?: string;
}

// ---- Interactive header ----

export type InteractiveHeader =
  | { type: 'text'; text: string }
  | { type: 'image'; image: MediaSource }
  | { type: 'video'; video: MediaSource }
  | { type: 'document'; document: MediaSource };

// ---- Template message ----

export interface TemplateTextParameter {
  type: 'text';
  text: string;
}

export interface TemplateCurrencyParameter {
  type: 'currency';
  currency: {
    fallback_value: string;
    code: string;
    amount_1000: number;
  };
}

export interface TemplateDateTimeParameter {
  type: 'date_time';
  date_time: {
    fallback_value: string;
    day_of_week?: number;
    year?: number;
    month?: number;
    day_of_month?: number;
    hour?: number;
    minute?: number;
    calendar?: string;
  };
}

export interface TemplateImageParameter {
  type: 'image';
  image: { link: string } | { id: string };
}

export interface TemplateVideoParameter {
  type: 'video';
  video: { link: string } | { id: string };
}

export interface TemplateDocumentParameter {
  type: 'document';
  document: { link: string } | { id: string };
}

export interface TemplatePayloadParameter {
  type: 'payload';
  payload: string;
}

export interface TemplateActionParameter {
  type: 'action';
  action: Record<string, unknown>;
}

export type TemplateParameter =
  | TemplateTextParameter
  | TemplateCurrencyParameter
  | TemplateDateTimeParameter
  | TemplateImageParameter
  | TemplateVideoParameter
  | TemplateDocumentParameter
  | TemplatePayloadParameter
  | TemplateActionParameter;

export interface TemplateComponent {
  type: 'header' | 'body' | 'button';
  sub_type?: string;
  index?: number | string;
  parameters: TemplateParameter[];
}

export interface SendTemplateParams {
  name: string;
  language: string;
  components?: TemplateComponent[];
}

// ============================================================================
// Discriminated union: the universal OutboundMessage
// ============================================================================

export type OutboundMessage =
  | { type: 'text'; text: { body: string; preview_url?: boolean } }
  | { type: 'image'; image: SendImageParams }
  | { type: 'video'; video: SendVideoParams }
  | { type: 'audio'; audio: SendAudioParams }
  | { type: 'document'; document: SendDocumentParams }
  | { type: 'sticker'; sticker: SendStickerParams }
  | { type: 'location'; location: SendLocationParams }
  | { type: 'contacts'; contacts: SendContactCard[] }
  | { type: 'interactive'; interactive: InteractivePayload }
  | { type: 'template'; template: { name: string; language: { code: string }; components?: TemplateComponent[] } }
  | { type: 'reaction'; reaction: { message_id: string; emoji: string } };

// ---- Interactive sub-types for the raw API payload ----

export type InteractivePayload =
  | InteractiveButtonPayload
  | InteractiveListPayload
  | InteractiveSingleProductPayload
  | InteractiveProductListPayload
  | InteractiveCatalogPayload;

export interface InteractiveButtonPayload {
  type: 'button';
  header?: Record<string, unknown>;
  body: { text: string };
  footer?: { text: string };
  action: {
    buttons: Array<{ type: 'reply'; reply: { id: string; title: string } }>;
  };
}

export interface InteractiveListPayload {
  type: 'list';
  header?: { type: 'text'; text: string };
  body: { text: string };
  footer?: { text: string };
  action: {
    button: string;
    sections: Array<{
      title: string;
      rows: Array<{ id: string; title: string; description?: string }>;
    }>;
  };
}

export interface InteractiveSingleProductPayload {
  type: 'product';
  body?: { text: string };
  footer?: { text: string };
  action: {
    catalog_id: string;
    product_retailer_id: string;
  };
}

export interface InteractiveProductListPayload {
  type: 'product_list';
  header: { type: string; text: string };
  body: { text: string };
  footer?: { text: string };
  action: {
    catalog_id: string;
    sections: Array<{
      title: string;
      product_items: Array<{ product_retailer_id: string }>;
    }>;
  };
}

export interface InteractiveCatalogPayload {
  type: 'catalog_message';
  body: { text: string };
  footer?: { text: string };
  action: {
    name: 'catalog_message';
    parameters?: {
      thumbnail_product_retailer_id: string;
    };
  };
}

// ============================================================================
// Send result — what the client returns after sending
// ============================================================================

export interface SendSuccess {
  success: true;
  messageId: string;
  raw: unknown;
}

export interface SendError {
  success: false;
  error: {
    code: number;
    message: string;
    details?: unknown;
  };
  raw: unknown;
}

export type SendResult = SendSuccess | SendError;
