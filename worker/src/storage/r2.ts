import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

import { env } from '../env';
import type { OutputFormat } from '../types';

let client: S3Client | null = null;

export function isR2Configured(): boolean {
  return Boolean(
    env.R2_ACCOUNT_ID &&
    env.R2_ACCESS_KEY_ID &&
    env.R2_SECRET_ACCESS_KEY &&
    env.R2_BUCKET &&
    env.R2_PUBLIC_URL,
  );
}

function getClient(): S3Client {
  if (client) return client;
  client = new S3Client({
    region: 'auto',
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID!,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
    },
  });
  return client;
}

const CONTENT_TYPE: Record<OutputFormat, string> = {
  png: 'image/png',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
};

/** Upload a rendered buffer to R2 and return its public URL. */
export async function uploadAsset(
  key: string,
  buffer: Buffer,
  format: OutputFormat,
): Promise<string> {
  if (!isR2Configured()) {
    throw new Error('R2 storage is not configured');
  }
  await getClient().send(
    new PutObjectCommand({
      Bucket: env.R2_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: CONTENT_TYPE[format],
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  );
  return `${env.R2_PUBLIC_URL!.replace(/\/$/, '')}/${key}`;
}
