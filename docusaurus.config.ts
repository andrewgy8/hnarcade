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

  headTags: [
    {
      tagName: 'script',
      attributes: {},
      innerHTML: `!function(t,e){var o,n,p,r;e.__SV||(window.posthog&&window.posthog.__loaded)||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="$i ji init en nn Ar tn an Yi capture calculateEventProperties dn register register_once register_for_session unregister unregister_for_session gn getFeatureFlag getFeatureFlagPayload getFeatureFlagResult isFeatureEnabled reloadFeatureFlags updateFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSurveysLoaded onSessionId getSurveys getActiveMatchingSurveys renderSurvey displaySurvey cancelPendingSurvey canRenderSurvey canRenderSurveyAsync mn identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset setIdentity clearIdentity get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException addExceptionStep captureLog startExceptionAutocapture stopExceptionAutocapture loadToolbar get_property getSessionProperty fn hn createPersonProfile setInternalOrTestUser pn Ji opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing get_explicit_consent_status is_capturing clear_opt_in_out_capturing un debug Dr vn getPageViewId captureTraceFeedback captureTraceMetric Zi".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
posthog.init('phc_wY2et8CqpMxoa2LdYX5mscoBZN5yWYUzqBRPvHfqFJvN',{api_host:'https://eu.i.posthog.com',defaults:'2026-05-30',person_profiles:'identified_only'})`,
    },
  ],

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
