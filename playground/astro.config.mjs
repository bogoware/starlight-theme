import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import bogowareTheme from '@bogoware/starlight-theme';

export default defineConfig({
  site: 'https://example.com',
  base: '/',
  integrations: [
    starlight({
      title: 'Theme Playground',
      plugins: [
        bogowareTheme({
          mode: 'architect',
          logoVariant: 'simplified',
          fieldLines: true,
          seo: {
            siteName: 'Theme Playground',
            defaultDescription: 'Test site for @bogoware/starlight-theme',
            structuredData: { type: 'SoftwareSourceCode', author: 'Bogoware' },
          },
        }),
      ],
      sidebar: [
        { label: 'Home', slug: '' },
      ],
    }),
  ],
});
