---
title: Introduction
description: What Do11y is, what it tracks, how it handles privacy, and which documentation frameworks it supports.
head:
  - - meta
    - property: og:title
      content: Introduction — Do11y
  - - meta
    - property: og:description
      content: What Do11y is, what it tracks, how it handles privacy, and which documentation frameworks it supports.
---

# Introduction

Do11y is a documentation observability solution from [Axiom](https://axiom.co). It turns documentation usage into machine data by streaming behavioral events from your docs site to Axiom in real time.

Do11y is built for humans and machines alike. It emits observability data that is easy to read in the Axiom UI and easy to query programmatically.

Do11y is agent-native: in an era where AI assistants and autonomous agents increasingly read and cite documentation alongside human users, Do11y detects AI platform referrers so you can understand how agents and humans engage with your content differently.

The runtime artifact is a single dependency-free JavaScript file built from TypeScript with [rolldown](https://rolldown.rs). You can load it from a CDN or self-host it.

## Events

Do11y streams the following behavioral events:

| Event | Description |
|---|---|
| Page views | Every page load and SPA navigation, with referrer and AI platform classification. |
| Scroll depth | How far down the page users actually scroll. |
| Link clicks | Internal links, external links, anchor links, and email links. |
| Search queries | When users open the search dialog. |
| Code-block copies | Which code blocks users copy and in which language. |
| Section reading time | How long each heading stays in the viewport. |
| Tab switches | Which code language or framework tab users select. |
| TOC usage | Which table of contents entries users click. |
| Feedback | "Was this helpful?" widget responses. |
| Expand/collapse | Interactions with `<details>` elements and accordions. |

## Privacy

Do11y collects anonymous usage data with no impact on user privacy:

- No cookies. Do11y uses `sessionStorage`, which the browser clears when it closes.
- No personal identifiable information (PII).
- No device fingerprinting.
- No cross-site tracking.

You don't need a GDPR consent banner for using Do11y.

## Supported frameworks

Do11y supports the latest versions of the following documentation frameworks out of the box:

| Framework | Install guide |
|---|---|
| [Mintlify](https://mintlify.com) | [Install on Mintlify](/install/mintlify) |
| [Docusaurus](https://docusaurus.io) | [Install on Docusaurus](/install/docusaurus) |
| [Nextra](https://nextra.site) | [Install on Nextra](/install/nextra) |
| [MkDocs Material](https://squidfunk.github.io/mkdocs-material/) | [Install on MkDocs Material](/install/mkdocs-material) |
| [VitePress](https://vitepress.dev) | [Install on VitePress](/install/vitepress) |

For other frameworks, use [manual setup](/install/manual).
