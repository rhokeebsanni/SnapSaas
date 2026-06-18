import type { MetadataRoute } from 'next';

const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: base, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/pricing`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/sign-up`, lastModified: now, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${base}/sign-in`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];
}
