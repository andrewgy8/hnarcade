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

            // Recursively add frontmatter fields to customProps
            function processItems(items: any[]): any[] {
              return items.map((item) => {
                if (item.type === 'category' && item.items) {
                  return {
                    ...item,
                    items: processItems(item.items),
                  };
                }
                if (item.type === 'doc') {
                  const doc = args.docs.find((d) => d.id === item.id);
                  const customProps: any = { ...item.customProps };

                  // Add screenshot if present
                  if (doc?.frontMatter?.screenshot) {
                    customProps.screenshot = doc.frontMatter.screenshot;
                  }

                  // Add dateAdded for sorting
                  if (doc?.frontMatter?.dateAdded) {
                    customProps.dateAdded = doc.frontMatter.dateAdded;
                  }

                  // Add sidebar_position for random sorting
                  if (doc?.frontMatter?.sidebar_position !== undefined) {
                    customProps.sidebarPosition = doc.frontMatter.sidebar_position;
                  }

                  // Add HN points for popularity sorting
                  if (doc?.frontMatter?.points !== undefined) {
                    customProps.points = doc.frontMatter.points;
                  }

                  // Add HN ID for reference
                  if (doc?.frontMatter?.hnId) {
                    customProps.hnId = doc.frontMatter.hnId;
                  }

                  // Add tags for filtering
                  if (doc?.frontMatter?.tags) {
                    customProps.tags = doc.frontMatter.tags;
                  }

                  return {
                    ...item,
                    customProps,
                  };
                }
                return item;
              });
            }

            return processItems(sidebarItems);
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

  themes: [
    [
      '@easyops-cn/docusaurus-search-local',
      {
        hashed: true,
        indexDocs: true,
        indexBlog: false,
        indexPages: false,
        docsRouteBasePath: 'games',
        searchResultLimits: 8,
        searchBarShortcutHint: false,
      },
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
          to: '/newsletter',
          label: 'Newsletter',
          position: 'left',
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
      ],
    },
    footer: {
      style: 'light',
      copyright: `
        <div style="display: flex; align-items: center; justify-content: center; gap: 12px;">
          <span>Games discovered from Hacker News. Built by <a href="https://andrew.grahamyooll.com" target="_blank" rel="noopener noreferrer">AGY</a></span>
          <a href="https://github.com/andrewgy8/hnarcade" target="_blank" rel="noopener noreferrer" aria-label="GitHub" style="display: inline-flex; align-items: center;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
            </svg>
          </a>
        </div>
      `,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
