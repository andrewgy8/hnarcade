import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'The HN Arcade',
  tagline: 'Discover games from Hacker News',
  favicon: 'img/favicon.svg',

  future: {
    v4: true,
  },

  url: 'https://hnarcade.com',
  baseUrl: '/',

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
          async sidebarItemsGenerator({defaultSidebarItemsGenerator, ...args}) {
            const sidebarItems = await defaultSidebarItemsGenerator(args);

            // Recursively add screenshot to customProps for each doc item
            function addScreenshotToItems(items: any[]): any[] {
              return items.map((item) => {
                if (item.type === 'category' && item.items) {
                  return {
                    ...item,
                    items: addScreenshotToItems(item.items),
                  };
                }
                if (item.type === 'doc') {
                  const doc = args.docs.find((d) => d.id === item.id);
                  if (doc?.frontMatter?.screenshot) {
                    return {
                      ...item,
                      customProps: {
                        ...item.customProps,
                        screenshot: doc.frontMatter.screenshot,
                      },
                    };
                  }
                }
                return item;
              });
            }

            return addScreenshotToItems(sidebarItems);
          },
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
        gtag: {
          trackingID: 'G-91J9BXKSM2',
          anonymizeIP: true,
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'The HN Arcade',
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
