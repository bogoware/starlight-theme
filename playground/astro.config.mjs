import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import bogowareTheme from '@bogoware/starlight-theme';

export default defineConfig({
  site: 'https://bogoware.github.io',
  base: '/starlight-theme',
  integrations: [
    starlight({
      title: 'Pasta Protocol',
      logo: {
        src: './src/assets/logo-favicon.svg',
        replacesTitle: false,
      },
      plugins: [
        bogowareTheme({
          mode: 'architect',
          styleRoutes: [
            { pattern: 'blog/**', style: 'florentine' },
          ],
          logoVariant: 'simplified',
          fieldLines: true,
          seo: {
            siteName: 'Pasta Protocol',
            defaultDescription: 'Al dente consistency for your distributed systems',
            structuredData: { type: 'SoftwareSourceCode', author: 'Bogoware' },
          },
        }),
      ],
      sidebar: [
        {
          label: 'Theme Guide',
          slug: 'theme-guide',
          attrs: { style: 'font-weight: 600' },
        },
        {
          label: 'Prima Cottura',
          items: [
            { label: 'Installazione', slug: 'getting-started/installazione' },
            { label: 'La Ricetta Base', slug: 'getting-started/la-ricetta-base' },
            { label: "'O Primo Piatto", slug: 'getting-started/o-primo-piatto' },
          ],
        },
        {
          label: 'La Cucina',
          items: [
            { label: 'Panoramica', slug: 'architecture/panoramica' },
            { label: "'O Forno", slug: 'architecture/o-forno' },
            { label: 'La Dispensa', slug: 'architecture/la-dispensa' },
            { label: "'O Ragu", slug: 'architecture/o-ragu' },
            { label: "'A Rete", slug: 'architecture/a-rete' },
          ],
        },
        {
          label: "'O Menu",
          items: [
            { label: 'Panoramica API', slug: 'api/panoramica' },
            { label: 'Tipi di Pasta', slug: 'api/tipi-di-pasta' },
            { label: 'Protocolli', slug: 'api/protocolli' },
            { label: 'GarlicBreadcast', slug: 'api/garlicbreadcast' },
            { label: 'Configurazione', slug: 'api/configurazione' },
          ],
        },
        {
          label: 'Ricettario',
          items: [
            { label: 'Rigatoni (Pipeline)', slug: 'patterns/rigatoni' },
            { label: 'Lasagna (Layered)', slug: 'patterns/lasagna' },
            { label: 'Fusilli (Event Sourcing)', slug: 'patterns/fusilli' },
            { label: 'Spaghetti (Anti-Pattern)', slug: 'patterns/spaghetti' },
            { label: 'Certificazione DOC', slug: 'patterns/certificazione-doc', badge: { text: 'DOC', variant: 'success' } },
          ],
        },
        {
          label: "'O Vesuvio",
          items: [
            { label: 'Disaster Recovery', slug: 'operations/disaster-recovery', badge: { text: 'Critico', variant: 'danger' } },
            { label: "'A Pasta Scotta", slug: 'operations/a-pasta-scotta' },
            { label: "'O Termometro", slug: 'operations/o-termometro' },
            { label: "'A Tavolata", slug: 'operations/a-tavolata' },
          ],
        },
        {
          label: 'La Filosofia',
          items: [
            { label: "'A Via Napoletana", slug: 'philosophy/a-via-napoletana' },
            { label: "'O Zen d'a Pasta", slug: 'philosophy/o-zen-da-pasta' },
          ],
        },
        {
          label: "'O Blog 'e Giovanni",
          items: [
            { label: 'Chi Sono', slug: 'blog/chi-sono', badge: { text: 'Blog', variant: 'note' } },
            { label: "'A Pastiera", slug: 'blog/a-pastiera-napoletana', badge: { text: 'Blog', variant: 'note' } },
            { label: "'O Ragu d'a Domenica", slug: 'blog/o-ragu-da-domenica', badge: { text: 'Blog', variant: 'note' } },
            { label: 'Sfogliatella', slug: 'blog/sfogliatella', badge: { text: 'Blog', variant: 'note' } },
            { label: "'A Pizza DOC", slug: 'blog/a-pizza-napoletana', badge: { text: 'Blog', variant: 'note' } },
            { label: "'O Baba", slug: 'blog/o-baba-e-a-pazienza', badge: { text: 'Blog', variant: 'note' } },
          ],
        },
      ],
    }),
  ],
});
