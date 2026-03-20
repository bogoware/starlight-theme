import { describe, it, expect } from 'vitest';
import { bogowareThemeSchema, themeStyleSchema, type BogowareThemeConfig } from './schema.js';

describe('bogowareThemeSchema', () => {
  it('should accept a valid full config', () => {
    const config: BogowareThemeConfig = {
      mode: 'architect',
      styleRoutes: [
        { pattern: 'blog/**', style: 'florentine' },
      ],
      logoVariant: 'simplified',
      fieldLines: true,
      seo: {
        siteName: 'Bogoware.Monads',
        defaultDescription: 'Functional programming patterns for C#',
        locale: 'en_US',
        ogImage: { enabled: true, strategy: 'dynamic' },
        twitterCard: 'summary_large_image',
        twitterSite: '@bogoware',
        structuredData: { type: 'SoftwareSourceCode', author: 'Bogoware' },
      },
      analytics: {
        googleAnalyticsId: 'G-XXXXXXXXXX',
        respectDnt: true,
        cookieless: false,
      },
    };
    const result = bogowareThemeSchema.parse(config);
    expect(result.mode).toBe('architect');
    expect(result.styleRoutes).toHaveLength(1);
    expect(result.styleRoutes[0].pattern).toBe('blog/**');
    expect(result.seo.ogImage.strategy).toBe('dynamic');
  });

  it('should apply defaults for minimal config', () => {
    const result = bogowareThemeSchema.parse({});
    expect(result.mode).toBe('architect');
    expect(result.styleRoutes).toEqual([]);
    expect(result.logoVariant).toBe('simplified');
    expect(result.fieldLines).toBe(true);
    expect(result.seo.ogImage.enabled).toBe(true);
    expect(result.analytics.respectDnt).toBe(true);
  });

  it('should reject invalid mode', () => {
    expect(() => bogowareThemeSchema.parse({ mode: 'gothic' })).toThrow();
  });

  it('should reject invalid logoVariant', () => {
    expect(() => bogowareThemeSchema.parse({ logoVariant: 'neon' })).toThrow();
  });

  it('should reject invalid style in styleRoutes', () => {
    expect(() => bogowareThemeSchema.parse({
      styleRoutes: [{ pattern: 'blog/**', style: 'gothic' }],
    })).toThrow();
  });

  it('should accept multiple styleRoutes', () => {
    const result = bogowareThemeSchema.parse({
      styleRoutes: [
        { pattern: 'blog/**', style: 'florentine' },
        { pattern: 'philosophy/*', style: 'florentine' },
      ],
    });
    expect(result.styleRoutes).toHaveLength(2);
  });
});

describe('themeStyleSchema', () => {
  it('should accept valid themeStyle', () => {
    const result = themeStyleSchema.parse({ themeStyle: 'florentine' });
    expect(result.themeStyle).toBe('florentine');
  });

  it('should accept undefined themeStyle', () => {
    const result = themeStyleSchema.parse({});
    expect(result.themeStyle).toBeUndefined();
  });

  it('should reject invalid themeStyle', () => {
    expect(() => themeStyleSchema.parse({ themeStyle: 'gothic' })).toThrow();
  });
});
