import type { StarlightPlugin } from '@astrojs/starlight/types';
import { bogowareThemeSchema, type BogowareThemeConfig } from './schema.js';

export type { BogowareThemeConfig, ResolvedBogowareThemeConfig } from './schema.js';
export { themeStyleSchema } from './schema.js';

export default function bogowareTheme(
  userConfig: BogowareThemeConfig = {}
): StarlightPlugin {
  const config = bogowareThemeSchema.parse(userConfig);

  return {
    name: '@bogoware/starlight-theme',
    hooks: {
      async setup({ updateConfig, addIntegration, astroConfig, config: starlightConfig, logger }) {
        logger.info(`Bogoware theme loaded (default: ${config.mode}, routes: ${config.styleRoutes.length})`);

        // Always load all CSS — both modes coexist via [data-bw-style] scoping
        const cssImports: string[] = [
          '@bogoware/starlight-theme/styles/base.css',
          '@bogoware/starlight-theme/styles/fonts.css',
          '@bogoware/starlight-theme/styles/architect.css',
          '@bogoware/starlight-theme/styles/florentine.css',
        ];

        const componentOverrides: Record<string, string> = {
          Header: '@bogoware/starlight-theme/overrides/Header.astro',
          Hero: '@bogoware/starlight-theme/overrides/Hero.astro',
          Sidebar: '@bogoware/starlight-theme/overrides/Sidebar.astro',
          Footer: '@bogoware/starlight-theme/overrides/Footer.astro',
          Head: '@bogoware/starlight-theme/overrides/Head.astro',
          MarkdownContent: '@bogoware/starlight-theme/overrides/MarkdownContent.astro',
        };

        updateConfig({
          customCss: [
            ...(starlightConfig.customCss ?? []),
            ...cssImports,
          ],
          components: {
            ...starlightConfig.components,
            ...componentOverrides,
          },
        });

        // Virtual module — exposes theme config to override components at build time
        addIntegration({
          name: '@bogoware/starlight-theme/virtual-config',
          hooks: {
            'astro:config:setup'({ updateConfig: updateAstroConfig }) {
              updateAstroConfig({
                vite: {
                  plugins: [{
                    name: 'vite-plugin-bogoware-theme-config',
                    resolveId(id: string) {
                      if (id === 'virtual:bogoware-theme/config') return '\0virtual:bogoware-theme/config';
                    },
                    load(id: string) {
                      if (id === '\0virtual:bogoware-theme/config') {
                        return `export default ${JSON.stringify({
                          mode: config.mode,
                          styleRoutes: config.styleRoutes,
                        })};`;
                      }
                    },
                  }],
                },
              });
            },
          },
        });

        // Analytics integration
        if (config.analytics.googleAnalyticsId) {
          const id = config.analytics.googleAnalyticsId;
          const respectDnt = config.analytics.respectDnt;
          const cookieless = config.analytics.cookieless;

          addIntegration({
            name: '@bogoware/starlight-theme/analytics',
            hooks: {
              'astro:config:setup'({ injectScript }) {
                injectScript('head-inline', `
                  (function(){
                    ${respectDnt ? "if(navigator.doNotTrack==='1')return;" : ''}
                    var s=document.createElement('script');
                    s.src='https://www.googletagmanager.com/gtag/js?id=${id}';
                    s.async=true;document.head.appendChild(s);
                    window.dataLayer=window.dataLayer||[];
                    function gtag(){dataLayer.push(arguments)}
                    gtag('js',new Date());
                    gtag('config','${id}'${cookieless ? ",{client_storage:'none',anonymize_ip:true}" : ''});
                  })();
                `);
              },
            },
          });
        }

        // Sitemap integration
        const hasSitemap = astroConfig.integrations.some(
          (i: { name: string }) => i.name === '@astrojs/sitemap'
        );
        if (!hasSitemap) {
          try {
            const sitemap = await import('@astrojs/sitemap');
            addIntegration(sitemap.default());
            logger.info('Sitemap integration added');
          } catch {
            logger.warn('Install @astrojs/sitemap for automatic sitemap generation');
          }
        }
      },
    },
  };
}
