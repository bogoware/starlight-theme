# @bogoware/starlight-theme

Bogoware brand identity theme for [Astro Starlight](https://starlight.astro.build/) documentation sites.

## Features

- **Dual typography system**: Architect mode (Space Grotesk + DM Sans) for technical docs, Florentine mode (Cormorant Garamond + Crimson Pro) for blogs — both coexist on the same site
- **Route-based style switching**: Assign typography modes to URL patterns (e.g., `blog/**` → Florentine)
- **Per-page and inline overrides**: Override via frontmatter or the `<Style>` component within MDX content
- **Complete brand identity**: Bogoliubov Vertex logo, color palette, spacing system
- **SEO optimized**: Font preconnect, favicon, Open Graph meta support
- **Google Analytics**: Optional GA4 with DNT respect and cookieless mode
- **Sitemap**: Automatic sitemap generation via @astrojs/sitemap
- **Self-hosted fonts**: WOFF2 font files for offline/air-gapped builds

## Live Demo

Explore the theme in action at **[Pasta Protocol](https://bogoware.github.io/starlight-theme/)** — a fictional Neapolitan-flavored distributed systems framework that showcases every feature of the Bogoware Starlight theme, including both typography modes, all custom components, and the complete Starlight component catalog.

## Installation

```bash
pnpm add @bogoware/starlight-theme
```

## Usage

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import bogowareTheme from '@bogoware/starlight-theme';

export default defineConfig({
  integrations: [
    starlight({
      title: 'My Project',
      plugins: [
        bogowareTheme({
          mode: 'architect',           // default typography for the site
          styleRoutes: [
            { pattern: 'blog/**', style: 'florentine' },
          ],
          logoVariant: 'simplified',   // 'full' | 'simplified' | 'monochrome'
          fieldLines: true,
          analytics: {
            googleAnalyticsId: 'G-XXXXXXXXXX', // optional
          },
        }),
      ],
    }),
  ],
});
```

## Typography Modes

| Mode | Display | Body | Code | Best For |
|------|---------|------|------|----------|
| **Architect** | Space Grotesk | DM Sans | Space Mono | Technical docs, APIs |
| **Florentine** | Cormorant Garamond | Crimson Pro | Fira Code | Blogs, essays |

Both modes are always available. The `mode` option sets the site-wide default; `styleRoutes` assigns modes to URL patterns.

## Dual Style Support

### Style Resolution Order

The theme resolves the typography style for each page in this order (highest priority first):

1. **Frontmatter** `themeStyle` field on the page
2. **Route patterns** matching `styleRoutes` configuration
3. **Global default** `mode` setting

### Route-Based Styles

Use `styleRoutes` to assign a typography mode to URL patterns:

```javascript
bogowareTheme({
  mode: 'architect',
  styleRoutes: [
    { pattern: 'blog/**', style: 'florentine' },     // all blog pages
    { pattern: 'philosophy/*', style: 'florentine' }, // direct children only
  ],
})
```

Supported patterns:
- `blog/**` — matches recursively (e.g., `blog/foo`, `blog/foo/bar`)
- `blog/*` — matches single level only (e.g., `blog/foo` but not `blog/foo/bar`)
- `blog/my-post` — exact match

### Per-Page Style Override

Override the style for a specific page using frontmatter:

```markdown
---
title: My Literary Post
themeStyle: 'florentine'
---

This page uses Florentine typography regardless of route patterns.
```

To enable the `themeStyle` frontmatter field, extend Starlight's content schema:

```typescript
// src/content.config.ts
import { defineCollection } from 'astro:content';
import { docsSchema } from '@astrojs/starlight/schema';
import { themeStyleSchema } from '@bogoware/starlight-theme/schema';

export const collections = {
  docs: defineCollection({ schema: docsSchema({ extend: themeStyleSchema }) }),
};
```

### Inline Style Switching

Switch typography within a page using the `<Style>` component in MDX:

```mdx
import Style from '@bogoware/starlight-theme/components/Style.astro';

This paragraph uses the page's default style.

<Style mode="florentine">

This section uses Florentine typography — classical serif fonts
for a literary feel within a technical page.

</Style>

Back to the page's default style.
```

## License

MIT
