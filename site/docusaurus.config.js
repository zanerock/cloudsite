// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import { themes as prismThemes } from 'prism-react-renderer'

/** @type {import('@docusaurus/types').Config} */
const config = {
  title   : 'Cloudsite',
  tagline : 'Fast, free website hosting',
  favicon : 'img/cloudsite-favicon.png',

  // Set the production url of your site here
  url     : 'https://cloudsitehosting.org',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl : '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName : 'liquid-labs', // Usually your GitHub org/user name.
  projectName      : 'cloudsitehosting', // Usually your repo name.

  onBrokenLinks         : 'throw',
  onBrokenMarkdownLinks : 'throw',
  onBrokenAnchors       : 'warn', // can't use throw because the checker doesn't recognize our '<span id="...">' anchor

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n : {
    defaultLocale : 'en',
    locales       : ['en']
  },

  plugins : ['docusaurus-plugin-image-zoom'],

  presets : [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs : {
          sidebarPath : './sidebars.js',
          editUrl :
            'https://github.com/liquid-labs/cloudsite/tree/main/site'
        },
        blog : {
          showReadingTime : true,
          editUrl :
            'https://github.com/liquid-labs/cloudsite/tree/main/site',
          feedOptions : {
            type            : 'all',
            copyright       : `Copyright © ${new Date().getFullYear()} Liquid Labs, LLC`,
            createFeedItems : async (params) => {
              const { blogPosts, defaultCreateFeedItems, ...rest } = params
              return defaultCreateFeedItems({
                // keep only the 10 most recent blog posts in the feed
                blogPosts : blogPosts.filter((item, index) => index < 10),
                ...rest
              })
            }
          }
        },
        theme : {
          customCss : './src/css/custom.css'
        }
      })
    ]
  ],

  themeConfig :
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      docs      : { sidebar : { autoCollapseCategories : true } },
      image     : 'img/cloudsite-social-card.png',
      colorMode : {
        defaultMode               : 'light',
        respectPrefersColorScheme : true,
        disableSwitch             : false
      },
      navbar : {
        title : '',
        logo  : {
          alt     : 'Cloudsite',
          src     : 'img/cloudsite-name-only.svg',
          srcDark : 'img/cloudsite-name-only-dark.svg'
        },
        items : [
          {
            type      : 'docSidebar',
            sidebarId : 'docsSidebar',
            position  : 'left',
            label     : 'Docs'
          },
          { to : '/blog', label : 'Blog', position : 'left' },
          {
            type     : 'html',
            value    : '<a href="/support" class="button buttom--sm">Comprehensive Support</a>',
            position : 'right'
          },
          {
            html         : '<img class="light none" src="/img/github-mark.svg" /><img class="light hover" src="/img/github-mark-hover.svg" /><img class="dark none" src="/img/github-mark-dark.svg" /><img class="dark hover" src="/img/github-mark-dark-hover.svg" />',
            href         : 'https://github.com/liquid-labs/cloudsite',
            position     : 'right',
            className    : 'header-github-link',
            'aria-label' : 'GitHub repository'
          }
        ]
      },
      footer : {
        copyright : `Copyright © ${new Date().getFullYear()} <a class="footer__link-item" href="https://liquid-labs.com">Liquid Labs, LLC</a>`
      },
      prism : {
        theme     : prismThemes.github,
        darkTheme : prismThemes.dracula
      },
      zoom : {
        selector   : '.markdown img',
        background : {
          light : 'rgb(255, 255, 255)',
          dark  : 'rgb(50, 50, 50)'
        },
        config : {
          // options you can specify via https://github.com/francoischalifour/medium-zoom#usage
        }
      }
    })
}

export default config
