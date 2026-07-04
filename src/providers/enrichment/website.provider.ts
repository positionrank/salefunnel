import type { IEnrichmentProvider, CompanyEnrichmentInput, CompanyEnrichmentResult } from './types';

export class WebsiteEnrichmentProvider implements IEnrichmentProvider {
  readonly name = 'website_scrape';

  async enrichCompany(input: CompanyEnrichmentInput): Promise<CompanyEnrichmentResult> {
    const urls = this.candidateUrls(input);

    for (const url of urls) {
      try {
        const result = await this.scrape(url);
        if (result.summary) return result;
      } catch {
        // try next URL
      }
    }

    return {
      confidence: 0,
      source: this.name,
      summary: undefined,
    };
  }

  private candidateUrls(input: CompanyEnrichmentInput): string[] {
    const urls: string[] = [];
    if (input.website) {
      const base = input.website.replace(/\/$/, '');
      urls.push(base, `${base}/about`, `${base}/about-us`);
    } else if (input.domain) {
      const base = `https://${input.domain}`;
      urls.push(base, `${base}/about`);
    }
    return urls;
  }

  private async scrape(url: string): Promise<CompanyEnrichmentResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SalesFunnelBot/1.0)' },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const html = await res.text();
      return this.extract(html);
    } finally {
      clearTimeout(timeout);
    }
  }

  private extract(html: string): CompanyEnrichmentResult {
    const metaDesc = this.getMeta(html, 'description') ?? this.getMeta(html, 'og:description');
    const title = this.getTitle(html);

    const summary = metaDesc ?? title ?? undefined;

    return {
      summary,
      description: metaDesc ?? undefined,
      confidence: summary ? 0.5 : 0,
      source: this.name,
    };
  }

  private getMeta(html: string, name: string): string | null {
    const patterns = [
      new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i'),
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${name}["']`, 'i'),
      new RegExp(`<meta[^>]+property=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i'),
    ];
    for (const re of patterns) {
      const m = html.match(re);
      if (m?.[1]) return m[1].trim();
    }
    return null;
  }

  private getTitle(html: string): string | null {
    const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    return m?.[1]?.trim() ?? null;
  }
}
