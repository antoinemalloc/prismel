/**
 * Resolve a favicon for a given website URL.
 * Fetches the favicon bytes server-side, returns a base64 data URL
 * and a random pastel tint color.
 */

const MAX_SIZE = 500_000;
const FETCH_TIMEOUT = 5000;

const PASTEL_TINTS = [
  "rgba(255,200,200,0.06)", // soft pink
  "rgba(255,220,180,0.06)", // peach
  "rgba(255,240,180,0.06)", // pale yellow
  "rgba(200,255,200,0.06)", // mint
  "rgba(180,240,255,0.06)", // sky
  "rgba(200,200,255,0.06)", // lavender
  "rgba(255,200,240,0.06)", // blush
  "rgba(220,220,255,0.06)", // periwinkle
  "rgba(220,255,220,0.06)", // seafoam
  "rgba(255,230,200,0.06)", // cream
  "rgba(220,240,220,0.06)", // sage
  "rgba(240,220,240,0.06)", // lilac
];

/** Pick a random pastel tint color. */
export function randomPastelTint(): string {
  return PASTEL_TINTS[Math.floor(Math.random() * PASTEL_TINTS.length)];
}

export interface FaviconResult {
  dataUrl: string;
  tint: string;
}

export async function resolveFavicon(rawUrl: string): Promise<FaviconResult | null> {
  const hostname = extractHostname(rawUrl);
  if (!hostname) return null;

  const standardUrl = `https://${hostname}/favicon.ico`;
  const result = await fetchFavicon(standardUrl);
  if (result) return result;

  try {
    const pageUrl = normalizeUrl(rawUrl);
    const html = await fetchText(pageUrl);
    if (!html) return null;

    const iconUrl = extractIconFromHtml(html, hostname);
    if (!iconUrl) return null;

    return await fetchFavicon(iconUrl);
  } catch {
    return null;
  }
}

async function fetchFavicon(url: string): Promise<FaviconResult | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Prismel/1.0" },
    });
    clearTimeout(timer);

    if (!response.ok) return null;

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) return null;

    const contentLength = response.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_SIZE) return null;

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length > MAX_SIZE || buffer.length === 0) return null;

    const mime = contentType.split(";")[0].trim();
    const dataUrl = `data:${mime};base64,${buffer.toString("base64")}`;
    const tint = PASTEL_TINTS[Math.floor(Math.random() * PASTEL_TINTS.length)];

    return { dataUrl, tint };
  } catch {
    return null;
  }
}

async function fetchText(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Prismel/1.0" },
    });
    clearTimeout(timer);

    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  }
}

function extractHostname(raw: string): string | null {
  try {
    const normalized = normalizeUrl(raw);
    return new URL(normalized).hostname;
  } catch {
    return null;
  }
}

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function extractIconFromHtml(html: string, hostname: string): string | undefined {
  const iconRegex = /<link[^>]+rel=["'](?:shortcut\s+)?icon["'][^>]*>/gi;
  const hrefRegex = /href=["']([^"']+)["']/i;

  const matches = html.match(iconRegex);
  if (!matches) return undefined;

  for (const tag of matches) {
    const hrefMatch = tag.match(hrefRegex);
    if (!hrefMatch) continue;

    let href = hrefMatch[1];
    href = href.replace(/&amp;/g, "&");

    if (href.startsWith("//")) return `https:${href}`;
    if (href.startsWith("/")) return `https://${hostname}${href}`;
    if (href.startsWith("http")) return href;
    return `https://${hostname}/${href}`;
  }

  return undefined;
}
