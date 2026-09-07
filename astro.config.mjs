import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import baseLinks from './scripts/remark-base-links.mjs';

export default defineConfig({
  site: process.env.SITE_URL || 'https://lab-emi.github.io',
  base: process.env.BASE_PATH || '/',
  output: 'static',
  trailingSlash: 'always',
  markdown: { processor: unified({ remarkPlugins: [baseLinks] }) },
});
