import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'HN Arcade',
  tagline: 'Discover games from Hacker News',
  favicon: 'img/favicon.svg',

  future: {
    v4: true,
  },

  url: 'https://andrewgy8.github.io',
  baseUrl: '/hnarcade/',

  organizationName: 'andrewgy8',
  projectName: 'hnarcade',
  trailingSlash: false,

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: 'games',
          path: 'docs',
          tagsBasePath: 'tags',
          editUrl: 'https://github.com/andrewgy8/hnarcade/edit/main/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'HN Arcade',
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'gamesSidebar',
          position: 'left',
          label: 'Games',
        },
        {
          to: '/games/tags',
          label: 'Tags',
          position: 'left',
        },
        {
          to: '/games/how-it-works',
          label: 'How It Works',
          position: 'left',
        },
        {
          href: 'https://github.com/andrewgy8/hnarcade',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'light',
      copyright: `Games discoverd on HN. Built by <a href="https://andrew.grahamyooll.com" target="_blank" rel="noopener noreferrer">Andrew Graham-Yooll</a>`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
