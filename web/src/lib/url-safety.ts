import 'server-only';

import dns from 'node:dns/promises';

const BLOCKED_HOSTNAMES = new Set(['localhost', '0.0.0.0', '::1', '[::1]']);

function isPrivateIpv4(ip: string): boolean {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(ip);
  if (!m) return false;
  const a = Number(m[1]);
  const b = Number(m[2]);
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true; // link-local
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a >= 224) return true; // multicast / reserved
  return false;
}

function isPrivateIpv6(ip: string): boolean {
  const v = ip.toLowerCase();
  return (
    v === '::1' ||
    v.startsWith('fc') || // unique local
    v.startsWith('fd') ||
    v.startsWith('fe80') || // link-local
    v.startsWith('::ffff:') // IPv4-mapped — re-check below
  );
}

/**
 * Primary SSRF guard for `/api/capture`. Validates the scheme, blocks obvious
 * internal hostnames, then resolves DNS and rejects private / reserved IPs so a
 * public domain can't be pointed at an internal address.
 */
export async function assertPublicUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error('Invalid URL');
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Only http(s) URLs are allowed');
  }

  const host = url.hostname.toLowerCase();
  if (
    BLOCKED_HOSTNAMES.has(host) ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    host.endsWith('.localhost')
  ) {
    throw new Error('That host is not allowed');
  }

  // Resolve and verify every returned address is public.
  let records: { address: string; family: number }[];
  try {
    records = await dns.lookup(host, { all: true });
  } catch {
    throw new Error('Could not resolve that host');
  }

  for (const { address, family } of records) {
    const v4mapped = address.toLowerCase().startsWith('::ffff:') ? address.slice(7) : address;
    if (family === 4 || /^\d+\.\d+\.\d+\.\d+$/.test(v4mapped)) {
      if (isPrivateIpv4(v4mapped)) throw new Error('Private network addresses are not allowed');
    } else if (isPrivateIpv6(address)) {
      throw new Error('Private network addresses are not allowed');
    }
  }

  return url;
}
