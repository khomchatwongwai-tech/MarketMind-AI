/**
 * Safe Feed Parser and SSRF-Protected Ingestion Client
 * MarketMind AI - Enterprise Fintech Grade
 */

export interface ParsedFeedItem {
  id: string;
  title: string;
  link: string;
  summary: string;
  pubDate: string;
  author?: string;
  imageUrl?: string;
  categories: string[];
}

export class SafeFeedParser {
  /**
   * SSRF Protection: Validate that a URL is safe to query
   */
  public static isSafeUrl(rawUrl: string): boolean {
    try {
      const parsed = new URL(rawUrl);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return false;
      }

      const hostname = parsed.hostname.toLowerCase();

      // Block localhost, loopbacks, internal domains
      if (
        hostname === 'localhost' ||
        hostname.endsWith('.localhost') ||
        hostname.endsWith('.internal') ||
        hostname.endsWith('.local')
      ) {
        return false;
      }

      // Check IPv4 private and link-local ranges
      const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
      const match = hostname.match(ipv4Regex);
      if (match) {
        const [_, o1, o2, o3, o4] = match.map(Number);
        if (o1 === 127) return false; // 127.0.0.0/8 Loopback
        if (o1 === 10) return false; // 10.0.0.0/8 Private
        if (o1 === 172 && o2 >= 16 && o2 <= 31) return false; // 172.16.0.0/12 Private
        if (o1 === 192 && o2 === 168) return false; // 192.168.0.0/16 Private
        if (o1 === 169 && o2 === 254) return false; // 169.254.0.0/16 Link-local / Cloud metadata
        if (o1 === 0) return false; // 0.0.0.0
      }

      // Block cloud metadata hostnames
      if (
        hostname.includes('169.254.169.254') ||
        hostname.includes('metadata.google.internal') ||
        hostname.includes('instance-data')
      ) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Safe text and HTML tag sanitization
   */
  public static sanitizeText(input: string): string {
    if (!input) return '';
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Strip script tags
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '') // Strip styles
      .replace(/<[^>]+>/g, ' ') // Strip HTML tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&#x27;/g, "'")
      .replace(/&#x2F;/g, '/')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Safe URL sanitizer: ensure it's a valid http(s) URL
   */
  public static sanitizeUrl(url: string, fallback: string = ''): string {
    if (!url) return fallback;
    try {
      const parsed = new URL(url);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        return parsed.href;
      }
      return fallback;
    } catch {
      return fallback;
    }
  }

  /**
   * Safe XML/RSS fetcher with timeout and exponential backoff
   */
  public static async fetchFeedWithRetry(
    feedUrl: string,
    headers: Record<string, string> = {},
    maxRetries: number = 2,
    timeoutMs: number = 5000
  ): Promise<string | null> {
    if (!this.isSafeUrl(feedUrl)) {
      console.warn(`[SafeFeedParser] Blocked unsafe feed URL: ${feedUrl}`);
      return null;
    }

    let attempt = 0;
    while (attempt <= maxRetries) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);

        const res = await fetch(feedUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'MarketMindAI News Aggregator/2.0 (Fintech Compliance; https://marketmind.ai)',
            Accept: 'application/rss+xml, application/xml, text/xml, application/atom+xml, */*',
            ...headers,
          },
          signal: controller.signal,
        });

        clearTimeout(timer);

        if (!res.ok) {
          throw new Error(`HTTP ${res.status} ${res.statusText}`);
        }

        const text = await res.text();
        return text;
      } catch (err: any) {
        attempt++;
        if (attempt > maxRetries) {
          console.log(`[SafeFeedParser] Fetch failed for ${feedUrl.slice(0, 60)}: ${err?.message}`);
          return null;
        }
        // Exponential backoff
        await new Promise((r) => setTimeout(r, attempt * 500));
      }
    }
    return null;
  }

  /**
   * Parse XML/RSS/Atom content into structured items
   */
  public static parseXmlFeed(xmlText: string, defaultSource: string): ParsedFeedItem[] {
    const items: ParsedFeedItem[] = [];
    if (!xmlText || typeof xmlText !== 'string') return items;

    // Support both standard <item> (RSS) and <entry> (Atom)
    const itemMatches = xmlText.match(/<(?:item|entry)[\s\S]*?<\/(?:item|entry)>/gi) || [];

    for (const rawItem of itemMatches) {
      try {
        // 1. Title
        const titleMatch = rawItem.match(/<(?:title|media:title)[^>]*>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/(?:title|media:title)>/i);
        const title = this.sanitizeText((titleMatch ? (titleMatch[1] || titleMatch[2]) : '').trim());
        if (!title) continue;

        // 2. Link
        let link = '';
        const linkTagMatch = rawItem.match(/<link[^>]*href=["']([^"']+)["'][^>]*\/?>/i);
        if (linkTagMatch && linkTagMatch[1]) {
          link = linkTagMatch[1];
        } else {
          const directLinkMatch = rawItem.match(/<link[^>]*>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/link>/i);
          if (directLinkMatch) {
            link = (directLinkMatch[1] || directLinkMatch[2] || '').trim();
          }
        }
        link = this.sanitizeUrl(link, 'https://www.google.com/finance');

        // 3. Summary / Description
        const descMatch = rawItem.match(/<(?:description|summary|content)[^>]*>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/(?:description|summary|content)>/i);
        let summary = this.sanitizeText((descMatch ? (descMatch[1] || descMatch[2]) : '').trim());
        if (!summary) {
          summary = `${defaultSource} reported: ${title}`;
        }
        if (summary.length > 320) {
          summary = summary.slice(0, 317) + '...';
        }

        // 4. Publication Date
        const pubDateMatch = rawItem.match(/<(?:pubDate|published|updated|dc:date)[^>]*>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/(?:pubDate|published|updated|dc:date)>/i);
        let pubDateStr = (pubDateMatch ? (pubDateMatch[1] || pubDateMatch[2]) : '').trim();
        let pubDate = new Date().toISOString();
        if (pubDateStr) {
          const parsed = new Date(pubDateStr);
          if (!isNaN(parsed.getTime())) {
            pubDate = parsed.toISOString();
          }
        }

        // 5. Author / Creator
        const authorMatch = rawItem.match(/<(?:dc:creator|author|creator)[^>]*>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/(?:dc:creator|author|creator)>/i);
        const author = this.sanitizeText((authorMatch ? (authorMatch[1] || authorMatch[2]) : '').trim());

        // 6. Enclosure / Image URL
        let imageUrl: string | undefined = undefined;
        const mediaMatch = rawItem.match(/<(?:media:content|enclosure)[^>]*url=["']([^"']+)["'][^>]*\/?>/i);
        if (mediaMatch && mediaMatch[1]) {
          imageUrl = this.sanitizeUrl(mediaMatch[1]);
        }

        // 7. Categories
        const catMatches = rawItem.match(/<category[^>]*>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/category>/gi) || [];
        const categories = catMatches
          .map((c) => this.sanitizeText(c.replace(/<[^>]+>/g, '')))
          .filter(Boolean);

        // 8. ID / Guid
        const guidMatch = rawItem.match(/<guid[^>]*>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/guid>/i);
        const guid = guidMatch ? (guidMatch[1] || guidMatch[2] || '').trim() : link;
        const id = `feed_${defaultSource.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Math.abs(this.hashCode(guid || title + pubDate))}`;

        items.push({
          id,
          title,
          link,
          summary,
          pubDate,
          author: author || defaultSource,
          imageUrl,
          categories,
        });
      } catch (err) {
        // skip malformed item
      }
    }

    return items;
  }

  private static hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  }
}
