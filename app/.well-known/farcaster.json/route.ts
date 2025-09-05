declare const process: {
  env: {
    [key: string]: string | undefined;
  };
};

function withValidProperties(properties: Record<string, undefined | string | string[] | boolean>) {
  return Object.fromEntries(
    Object.entries(properties).filter(([_, value]) => {
      if (typeof value === 'boolean') return true;
      return Array.isArray(value) ? value.length > 0 : !!value;
    })
  );
}

export async function GET() {
  const URL = process.env.NEXT_PUBLIC_URL || "https://zerosum-arena.vercel.app";
  
  return Response.json({
    accountAssociation: {
      header: process.env.FARCASTER_HEADER,
      payload: process.env.FARCASTER_PAYLOAD,
      signature: process.env.FARCASTER_SIGNATURE,
    },
    frame: withValidProperties({
      version: '1',
      name: 'ZeroSum Gaming Arena',
      subtitle: 'Mathematical Warfare',
      description: 'Mathematical warfare where strategy beats luck. Privacy-fixed games with hidden numbers and true fairness.',
      screenshotUrls: [],
      iconUrl: `${URL}/og.png`,
      buttonTitle: 'Launch ZeroSum Arena',
      splashImageUrl: `${URL}/splash.png`,
      splashBackgroundColor: '#0f172a',
      homeUrl: URL,
      webhookUrl: `${URL}/api/webhook`,
      primaryCategory: 'games',
      tags: ['gaming', 'strategy', 'blockchain'],
      heroImageUrl: `${URL}/og.png`,
      tagline: 'Play instantly',
      ogTitle: 'ZeroSum Gaming Arena',
      ogDescription: 'Mathematical warfare where strategy beats luck',
      ogImageUrl: `${URL}/og.png`,
    }),
  });
}
