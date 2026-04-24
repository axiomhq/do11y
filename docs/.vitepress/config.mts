import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "Do11y",
  description: "Documentation observability for Axiom. Stream behavioral events from your docs site in real time.",
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Quickstart', link: '/quickstart' },
      { text: 'Reference', link: '/reference' },
    ],

    sidebar: [
      {
        text: 'Getting started',
        items: [
          { text: 'Quickstart', link: '/quickstart' },
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

    socialLinks: [
      { icon: 'github', link: 'https://github.com/axiomhq/do11y' }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © Axiom, Inc.'
    }
  }
})
