import { defineCollection } from 'astro:content';
import { docsSchema } from '@astrojs/starlight/schema';
import { themeStyleSchema } from '@bogoware/starlight-theme/schema';

export const collections = {
  docs: defineCollection({ schema: docsSchema({ extend: themeStyleSchema }) }),
};
