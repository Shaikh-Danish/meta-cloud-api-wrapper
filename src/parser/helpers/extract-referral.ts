export function extractReferral(rawMessage: any) {
  if (!rawMessage.referral) {
    return undefined;
  }

  const { referral } = rawMessage;

  return {
    sourceUrl: referral.source_url,
    sourceId: referral.source_id,
    sourceType: referral.source_type,
    body: referral.body,
    headline: referral.headline,
    mediaType: referral.media_type,
    imageUrl: referral.image_url,
    videoUrl: referral.video_url,
    thumbnailUrl: referral.thumbnail_url,
    ctwaClid: referral.ctwa_clid,
    welcomeMessage: referral.welcome_message
      ? { text: referral.welcome_message.text }
      : undefined,
  };
}
