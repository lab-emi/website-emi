import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import baseLinks from './scripts/remark-base-links.mjs';

export default defineConfig({
  site: process.env.SITE_URL || 'https://www.tudemi.com',
  base: process.env.BASE_PATH || '/',
  output: 'static',
  trailingSlash: 'always',
  markdown: { processor: unified({ remarkPlugins: [baseLinks] }) },
});
