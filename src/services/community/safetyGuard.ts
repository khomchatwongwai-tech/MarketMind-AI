import { TickerSymbol } from '../../types/market.js';

export const FINANCIAL_DISCLAIMER_TEXT =
  'Community posts represent the opinions of individual users and may be inaccurate, misleading or incomplete. MarketMind AI does not endorse community content. Nothing posted in the community constitutes personalized investment advice or a guarantee of future performance. Conduct your own research before making financial decisions.';

export const RESERVED_USERNAMES = new Set([
  'admin',
  'administrator',
  'marketmind',
  'marketmindai',
  'official',
  'system',
  'root',
  'security',
  'moderator',
  'mod',
  'support',
  'help',
  'billing',
  'finance',
  'api',
  'bot',
  'quant',
  'verified',
  'null',
  'undefined',
  'everyone',
]);

const PUMP_AND_DUMP_PATTERNS = [
  /guaranteed\s+(?:\d+[%x]|return|profit|gain|money)/i,
  /100%\s+(?:win\s*rate|guarantee|risk\s*free|profit)/i,
  /(?:send|deposit)\s+(?:eth|btc|sol|crypto|usdt)\s+to\s+double/i,
  /pump\s+(?:and\s+dump|it\s+now|signal\s+group|coin\s+to\s+the\s+moon)/i,
  /join\s+(?:my|our)\s+(?:vip|telegram|whatsapp)\s+for\s+(?:insider|guaranteed)/i,
  /moon\s+guaranteed/i,
  /insider\s+trading\s+leak/i,
  /risk[\s-]*free\s+strategy/i,
  /make\s+\$\d+k?\s+(?:overnight|per\s+day\s+guaranteed)/i,
];

const MALICIOUS_DOMAIN_PATTERNS = [
  /bit\.ly\/[a-z0-9_-]+/i,
  /tinyurl\.com\/[a-z0-9_-]+/i,
  /free-crypto/i,
  /airdrop-claim/i,
  /gift-reward/i,
  /drainer/i,
  /telegram\.me\//i,
  /t\.me\/joinchat/i,
  /whatsapp\.com\/invite/i,
];

export interface SafetyScanResult {
  isSafe: boolean;
  score: number; // 0 (clean) to 100 (high risk)
  warnings: string[];
  blockReason?: string;
}

export class CommunitySafetyGuard {
  /**
   * Scans post or comment content for financial manipulation, pump-and-dump language, phishing, and scam links.
   */
  static scanContent(text: string): SafetyScanResult {
    const warnings: string[] = [];
    let score = 0;
    let isSafe = true;
    let blockReason: string | undefined;

    if (!text || text.trim().length === 0) {
      return { isSafe: false, score: 0, warnings: ['Content cannot be empty'], blockReason: 'Empty content' };
    }

    // Check for Pump and Dump / Guaranteed Profit patterns
    for (const pattern of PUMP_AND_DUMP_PATTERNS) {
      if (pattern.test(text)) {
        score += 45;
        warnings.push('Contains prohibited claims of guaranteed returns, risk-free profit, or coordinated pumping.');
        break;
      }
    }

    // Check for Malicious/Phishing links
    for (const pattern of MALICIOUS_DOMAIN_PATTERNS) {
      if (pattern.test(text)) {
        score += 55;
        warnings.push('Contains suspicious external redirect, unverified shortener, or scam link.');
        break;
      }
    }

    // Check for excessive ALL CAPS shouting (spam indicator)
    const letters = text.replace(/[^a-zA-Z]/g, '');
    if (letters.length > 30) {
      const upper = letters.replace(/[^A-Z]/g, '');
      if (upper.length / letters.length > 0.8) {
        score += 20;
        warnings.push('High volume of capital letters detected.');
      }
    }

    if (score >= 60) {
      isSafe = false;
      blockReason = warnings[0] || 'Content violated MarketMind AI financial safety and anti-manipulation standards.';
    }

    return {
      isSafe,
      score: Math.min(score, 100),
      warnings,
      blockReason,
    };
  }

  /**
   * Validates and normalizes usernames.
   */
  static validateUsername(username: string): { valid: boolean; error?: string; normalized: string } {
    const clean = username.trim().toLowerCase().replace(/^@+/, '');

    if (clean.length < 3) {
      return { valid: false, error: 'Username must be at least 3 characters long', normalized: clean };
    }
    if (clean.length > 25) {
      return { valid: false, error: 'Username cannot exceed 25 characters', normalized: clean };
    }
    if (!/^[a-z0-9_]+$/.test(clean)) {
      return { valid: false, error: 'Username can only contain alphanumeric characters and underscores', normalized: clean };
    }
    if (RESERVED_USERNAMES.has(clean)) {
      return { valid: false, error: `The username "@${clean}" is reserved by MarketMind AI system administration`, normalized: clean };
    }

    return { valid: true, normalized: clean };
  }

  /**
   * Extracts $TICKER tags from text.
   */
  static extractTickers(text: string): TickerSymbol[] {
    const regex = /\$([A-Z]{1,6})\b/g;
    const matches = new Set<string>();
    let m;
    while ((m = regex.exec(text.toUpperCase())) !== null) {
      if (m[1]) {
        matches.add(m[1]);
      }
    }
    return Array.from(matches) as TickerSymbol[];
  }

  /**
   * Extracts @username mentions from text.
   */
  static extractMentions(text: string): string[] {
    const regex = /@([a-zA-Z0-9_]{3,25})\b/g;
    const mentions = new Set<string>();
    let m;
    while ((m = regex.exec(text)) !== null) {
      if (m[1]) {
        mentions.add(m[1].toLowerCase());
      }
    }
    return Array.from(mentions);
  }

  /**
   * Extracts #hashtags from text.
   */
  static extractHashtags(text: string): string[] {
    const regex = /#([a-zA-Z0-9_]{2,30})\b/g;
    const tags = new Set<string>();
    let m;
    while ((m = regex.exec(text)) !== null) {
      if (m[1]) {
        tags.add(m[1].toLowerCase());
      }
    }
    return Array.from(tags);
  }

  /**
   * Strips XSS and escapes HTML tags.
   */
  static sanitizeText(input: string): string {
    if (!input) return '';
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Validates image files before upload (size limit 2MB, allowed MIME types).
   */
  static validateImageFile(file: File): { valid: boolean; error?: string } {
    const MAX_SIZE = 2.5 * 1024 * 1024; // 2.5MB
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

    if (!ALLOWED_TYPES.includes(file.type)) {
      return { valid: false, error: 'Only JPG, PNG, WEBP and GIF image formats are supported.' };
    }
    if (file.size > MAX_SIZE) {
      return { valid: false, error: 'Image size exceeds the 2.5MB maximum limit.' };
    }

    return { valid: true };
  }

  /**
   * Compresses image using HTML Canvas and returns optimized WebP/JPEG base64 data URL.
   */
  static async compressImage(file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.82): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        };
        img.onerror = () => reject(new Error('Failed to load image for processing'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read image file'));
      reader.readAsDataURL(file);
    });
  }
}
