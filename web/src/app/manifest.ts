import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SnapSaas',
    short_name: 'SnapSaas',
    description: 'Turn any website URL into launch-ready marketing screenshots in seconds.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0a0a',
    theme_color: '#0a0a0a',
  };
}
