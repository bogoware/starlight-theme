# Changelog

All notable changes to `@bogoware/starlight-theme` will be documented in this file.

## [0.2.0] - 2026-03-20

### Added

- **Dual typography system**: Architect and Florentine modes coexist on the same site via `[data-bw-style]` attribute scoping
- **Route-based style switching**: `styleRoutes` config option assigns typography modes to URL patterns (e.g., `blog/** → florentine`)
- **Per-page style override**: `themeStyle` frontmatter field with `themeStyleSchema` export for content schema extension
- **Inline style switching**: `<Style>` component for switching typography within a single MDX page
- **Virtual module**: `virtual:bogoware-theme/config` exposes theme config to override components
- **MarkdownContent override**: Resolves and applies the correct typography style per page
- **Fonts CSS**: Dedicated `fonts.css` registers all font families globally (both modes always available)
- **Playground site**: Complete "Pasta Protocol" fictional documentation — 32 pages across 7 sections showcasing every theme capability
- **Blog section**: Giovanni 'O Cuoco's Neapolitan traditions & recipes in Florentine typography
- **Landing page**: Hero with quantum field animation, feature cards, quick start, architecture overview
- **CI/CD pipeline**: GitHub Actions for tests, GitHub Pages deployment, and npm publishing on tags
- **CHANGELOG**: This file

### Changed

- **CSS architecture**: Styles scoped by `[data-bw-style="architect"]` / `[data-bw-style="florentine"]` instead of global mode switching
- **All CSS always loaded**: No conditional CSS imports — both architect and florentine stylesheets are present on every page
- **Content layout**: Left-aligned against sidebar, wider main content area, TOC flush after content
- **README**: Updated with dual style documentation, `styleRoutes` examples, and live demo link

### Fixed

- Sidebar active item contrast in dark and light modes
- Footer heart emoji and header social icon sizing
- Font loading: removed broken local paths, using correct Google Fonts CDN URLs
- Content layout spacing and max-width for better readability
- Integration tests: playground deps installed before test execution in CI

## [0.1.3] - 2026-03-20

### Fixed

- Release workflow: install playground deps before tests
- Font paths: use correct Google Fonts CDN URLs

## [0.1.2] - 2026-03-20

### Added

- CI workflow for tests and playground build
- Deploy workflow for playground to GitHub Pages
- Release workflow for npm publishing on `v*` tags
- Pinned pnpm version via `packageManager` field

### Fixed

- Sidebar active item styling
- `.npmrc` aligned with `NODE_AUTH_TOKEN` convention

## [0.1.1] - 2026-03-20

### Fixed

- Footer purple heart emoji
- Header social icon sizing

## [0.1.0] - 2026-03-20

### Added

- Initial release
- Architect mode typography (Space Grotesk + DM Sans + Space Mono)
- Florentine mode typography (Cormorant Garamond + Crimson Pro + Fira Code)
- Brand identity: Bogoliubov Vertex logo (full, simplified, monochrome)
- Design tokens: color palette, spacing scale, border radii, transitions
- Component overrides: Header, Footer, Hero, Sidebar, Head
- Custom components: FeatureCard, FeatureGrid, FieldLines, BogowareLogo, Analytics, OgImage
- SEO: font preconnect, favicon, Open Graph, structured data, sitemap
- Google Analytics with DNT respect and cookieless mode
- Self-hosted WOFF2 fonts
