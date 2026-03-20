import { z } from 'zod';

const ogImageSchema = z.object({
  enabled: z.boolean().default(true),
  strategy: z.enum(['dynamic', 'static']).default('dynamic'),
});

const structuredDataSchema = z.object({
  type: z.enum(['SoftwareSourceCode', 'Blog', 'WebSite']).default('SoftwareSourceCode'),
  author: z.string().default('Bogoware'),
});

const seoSchema = z.object({
  siteName: z.string().default('Bogoware'),
  defaultDescription: z.string().default(''),
  locale: z.string().default('en_US'),
  ogImage: ogImageSchema.default({}),
  twitterCard: z.enum(['summary', 'summary_large_image']).default('summary_large_image'),
  twitterSite: z.string().optional(),
  structuredData: structuredDataSchema.default({}),
});

const analyticsSchema = z.object({
  googleAnalyticsId: z.string().optional(),
  respectDnt: z.boolean().default(true),
  cookieless: z.boolean().default(false),
});

const styleRouteSchema = z.object({
  pattern: z.string(),
  style: z.enum(['architect', 'florentine']),
});

export const bogowareThemeSchema = z.object({
  mode: z.enum(['architect', 'florentine']).default('architect'),
  styleRoutes: z.array(styleRouteSchema).default([]),
  logoVariant: z.enum(['full', 'simplified', 'monochrome']).default('simplified'),
  accentColor: z.string().optional(),
  fieldLines: z.boolean().default(true),
  seo: seoSchema.default({}),
  analytics: analyticsSchema.default({}),
});

/** Zod schema for extending Starlight's docsSchema with per-page style override. */
export const themeStyleSchema = z.object({
  themeStyle: z.enum(['architect', 'florentine']).optional(),
});

export type BogowareThemeConfig = z.input<typeof bogowareThemeSchema>;
export type ResolvedBogowareThemeConfig = z.output<typeof bogowareThemeSchema>;
