import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'HN Arcade',
  tagline: 'Discover games from Hacker News Show HN',
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
          href: 'https://news.ycombinator.com',
          label: 'Hacker News',
          position: 'right',
        },
      ],
    },
    footer: {
      links: [
        {
          title: 'Browse',
          items: [
            {
              label: 'All Games',
              to: '/games/category/games',
            },
            {
              label: 'Tags',
              to: '/games/tags',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'Hacker News',
              href: 'https://news.ycombinator.com',
            },
            {
              label: 'Show HN',
              href: 'https://news.ycombinator.com/shownew',
            },
          ],
        },
      ],
      copyright: `HN Arcade — A directory of games from Hacker News Show HN.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
