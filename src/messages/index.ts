// ============================================================================
// Messages barrel — re-export types and builders
// ============================================================================

export type {
  // Config
  ClientConfig,
  FetchFunction,
  // Options
  SendOptions,
  SendTextOptions,
  // Media
  MediaSource,
  // Message params
  SendImageParams,
  SendVideoParams,
  SendAudioParams,
  SendDocumentParams,
  SendStickerParams,
  SendLocationParams,
  // Contacts
  SendContactName,
  SendContactPhone,
  SendContactEmail,
  SendContactAddress,
  SendContactUrl,
  SendContactOrg,
  SendContactCard,
  // Interactive
  SendButton,
  SendInteractiveButtonsParams,
  SendListRow,
  SendListSection,
  SendInteractiveListParams,
  SendSingleProductParams,
  SendProductSection,
  SendMultiProductParams,
  SendCatalogParams,
  InteractiveHeader,
  // Template
  TemplateParameter,
  TemplateComponent,
  SendTemplateParams,
  // Universal message union
  OutboundMessage,
  // Result
  SendResult,
  SendSuccess,
  SendError,
} from './types.js';

export {
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
} from './builders.js';
