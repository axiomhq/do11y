import { defineConfig } from 'vitepress'

const SITE_URL = 'https://axiomhq.github.io/do11y'
const OG_IMAGE = `${SITE_URL}/og-image.png`

export default defineConfig({
  base: '/do11y/',
  title: "Do11y",
  description: "Documentation observability for Axiom. Stream behavioral events from your docs site in real time.",
  sitemap: {
    hostname: `${SITE_URL}/`,
  },
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/do11y/logo-dark.svg' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: 'Do11y' }],
    ['meta', { property: 'og:image', content: OG_IMAGE }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:site', content: '@axiomhq' }],
    ['meta', { name: 'twitter:image', content: OG_IMAGE }],
    ['meta', { name: 'axiom-do11y-domain', content: 'us-east-1.aws.edge.axiom.co' }],
    ['meta', { name: 'axiom-do11y-token', content: 'xaat-72de74ac-7a9e-45a2-87cb-6b31cd8a3a84' }],
    ['meta', { name: 'axiom-do11y-dataset', content: 'mano-docs-site-of-do11y' }],
    ['meta', { name: 'axiom-do11y-framework', content: 'vitepress' }],
    ['script', { src: 'https://cdn.jsdelivr.net/npm/@axiomhq/do11y@latest/dist/do11y.min.js' }],
  ],
  themeConfig: {
    siteTitle: 'Do11y Documentation',
    
    logo: {
      light: '/logo-light.svg',
      dark: '/logo-dark.svg',
    },

    search: {
      provider: 'local',
    },

    nav: [
      { text: 'Home', link: '/' },
      { text: 'Quickstart', link: '/quickstart' },
      { text: 'Reference', link: '/reference' },
    ],

    sidebar: [
      {
        text: 'Get started',
        items: [
          { text: 'Introduction', link: '/quickstart#introduction' },
          { text: 'Prerequisites', link: '/quickstart#prerequisites' },
          { text: 'Mintlify', link: '/quickstart#mintlify' },
          { text: 'Docusaurus', link: '/quickstart#docusaurus' },
          { text: 'Nextra', link: '/quickstart#nextra' },
          { text: 'VitePress', link: '/quickstart#vitepress' },
          { text: 'MkDocs Material', link: '/quickstart#mkdocs-material' },
          { text: 'Manual setup', link: '/quickstart#manual-setup' },
          { text: 'Integration dashboard', link: '/quickstart#integration-dashboard' },
        ]
      },
      {
        text: 'Reference',
        items: [
          { text: 'Configuration', link: '/reference#configuration' },
          { text: 'Events', link: '/reference#events' },
          { text: 'AI traffic detection', link: '/reference#ai-traffic-detection' },
          { text: 'JavaScript API', link: '/reference#javascript-api' },
        ]
      }
    ],

    docFooter: {
      prev: false,
      next: false,
    },

    editLink: {
      pattern: 'https://github.com/axiomhq/do11y/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/axiomhq/do11y' }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © Axiom, Inc.'
    }
  }
})
