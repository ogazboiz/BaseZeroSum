import config from '@/config.json';

function withValidProperties(properties: Record<string, undefined | string | string[]>) {
  return Object.fromEntries(
    Object.entries(properties).filter(([_, value]) => (Array.isArray(value) ? value.length > 0 : !!value))
  );
}

export async function GET() {
  const URL = process.env.NEXT_PUBLIC_URL as string;
  return Response.json({
    accountAssociation: {
      header: process.env.FARCASTER_HEADER,
      payload: process.env.FARCASTER_PAYLOAD,
      signature: process.env.FARCASTER_SIGNATURE,
    },
    frame: withValidProperties({
      version: '1',
      name: config.app.name,
      subtitle: config.app.subtitle,
      description: config.app.description,
      screenshotUrls: [],
      iconUrl: config.app.icon,
      splashImageUrl: config.app.splashImage,
      splashBackgroundColor: config.app.splashBackgroundColor,
      homeUrl: URL,
      webhookUrl: `${URL}/api/webhook`,
      primaryCategory: config.app.primaryCategory,
      tags: [],
      heroImageUrl: config.app.heroImage,
      tagline: config.app.tagline,
      ogTitle: config.app.ogTitle,
      ogDescription: config.app.ogDescription,
      ogImageUrl: config.app.ogImage,
      // use only while testing
      noindex: 'true',
    }),
  });
}