---
title: Quickstart
description: Install Do11y on Mintlify, Docusaurus, Nextra, VitePress, or MkDocs Material in minutes. Stream documentation usage events to Axiom in real time.
head:
  - - meta
    - property: og:title
      content: Quickstart — Do11y
  - - meta
    - property: og:description
      content: Install Do11y on Mintlify, Docusaurus, Nextra, VitePress, or MkDocs Material in minutes.
---

# Get started

## Introduction

Do11y is a documentation observability solution from [Axiom](https://axiom.co). It streams behavioral events from your docs site to Axiom in real time: page views, scroll depth, link clicks, search queries, code-block copies, section reading time, tab switches, TOC clicks, feedback, and expand/collapse interactions.

## Prerequisites

1. [Create an Axiom account](https://app.axiom.co/register).
2. [Create a dataset](https://axiom.co/docs/reference/datasets#create-dataset) to store observability data for your docs site.
3. [Create an API token](https://axiom.co/docs/reference/tokens) with ingest-only permissions scoped to that dataset.

## Mintlify

1. Download the latest release from [GitHub](https://github.com/axiomhq/do11y/releases/latest) and extract the zip.
2. Copy `dist/do11y.min.js` and `examples/do11y-config.example.js` to the same folder in your docs project (for example, `scripts/`). Alphabetical ordering ensures the config loads first.
3. Rename `do11y-config.example.js` to `do11y-config.js`.
4. In `do11y-config.js`, replace the placeholder values with your Axiom credentials:

```js
window.Do11yConfig = {
  axiomHost: 'AXIOM_DOMAIN',
  axiomToken: 'API_TOKEN',
  axiomDataset: 'DATASET_NAME',
  framework: 'mintlify',
};
```

## Docusaurus

Add the following to `headTags` and `scripts` in `docusaurus.config.js` (or `.ts`):

```js
headTags: [
  { tagName: 'meta', attributes: { name: 'axiom-do11y-domain', content: 'AXIOM_DOMAIN' } },
  { tagName: 'meta', attributes: { name: 'axiom-do11y-token', content: 'API_TOKEN' } },
  { tagName: 'meta', attributes: { name: 'axiom-do11y-dataset', content: 'DATASET_NAME' } },
  { tagName: 'meta', attributes: { name: 'axiom-do11y-framework', content: 'docusaurus' } },
],
scripts: [{ src: 'https://cdn.jsdelivr.net/npm/@axiomhq/do11y@latest/dist/do11y.min.js', defer: true }],
```

## Nextra

Add the following to the `<Head>` component in `pages/_app.jsx` (Pages Router) or `app/layout.jsx` (App Router):

```jsx
<Head>
  <meta name="axiom-do11y-domain" content="AXIOM_DOMAIN" />
  <meta name="axiom-do11y-token" content="API_TOKEN" />
  <meta name="axiom-do11y-dataset" content="DATASET_NAME" />
  <meta name="axiom-do11y-framework" content="nextra" />
  <script src="https://cdn.jsdelivr.net/npm/@axiomhq/do11y@latest/dist/do11y.min.js" defer />
</Head>
```

## VitePress

Add the following to the `head` field in `.vitepress/config.js` (or `.ts`):

```js
head: [
  ['meta', { name: 'axiom-do11y-domain', content: 'AXIOM_DOMAIN' }],
  ['meta', { name: 'axiom-do11y-token', content: 'API_TOKEN' }],
  ['meta', { name: 'axiom-do11y-dataset', content: 'DATASET_NAME' }],
  ['meta', { name: 'axiom-do11y-framework', content: 'vitepress' }],
  ['script', { src: 'https://cdn.jsdelivr.net/npm/@axiomhq/do11y@latest/dist/do11y.min.js' }],
],
```

## MkDocs Material

Add the following to `mkdocs.yml`:

```yaml
theme:
  name: material
  custom_dir: overrides
extra_javascript:
  - https://cdn.jsdelivr.net/npm/@axiomhq/do11y@latest/dist/do11y.min.js
```

Create `overrides/main.html` to inject the meta tags:

```html
{% extends "base.html" %}
{% block extrahead %}
  <meta name="axiom-do11y-domain" content="AXIOM_DOMAIN">
  <meta name="axiom-do11y-token" content="API_TOKEN">
  <meta name="axiom-do11y-dataset" content="DATASET_NAME">
  <meta name="axiom-do11y-framework" content="mkdocs-material">
{% endblock %}
```

See the [MkDocs Material docs](https://squidfunk.github.io/mkdocs-material/customization/#extending-the-theme) for details on custom theme overrides.

## Manual setup

For frameworks not listed above, use manual setup.

### CDN

Add the script to every page of your docs site:

```html
<meta name="axiom-do11y-domain" content="AXIOM_DOMAIN">
<meta name="axiom-do11y-token" content="API_TOKEN">
<meta name="axiom-do11y-dataset" content="DATASET_NAME">
<meta name="axiom-do11y-framework" content="FRAMEWORK">
<script src="https://cdn.jsdelivr.net/npm/@axiomhq/do11y@latest/dist/do11y.min.js"></script>
```

To pin a specific version, replace `latest` with a version tag like `1.0.0`.

For advanced configuration such as scroll thresholds or custom selectors, set `window.Do11yConfig` in an inline script placed before the CDN script:

```html
<script>
window.Do11yConfig = {
  axiomHost: 'us-east-1.aws.edge.axiom.co',
  axiomToken: 'xaat-your-ingest-token',
  axiomDataset: 'do11y',
  framework: 'vitepress',
  scrollThresholds: [25, 50, 75, 100],
  trackFeedback: false,
};
</script>
<script src="https://cdn.jsdelivr.net/npm/@axiomhq/do11y@latest/dist/do11y.min.js"></script>
```

When both are present, meta tags take precedence over `window.Do11yConfig`, which takes precedence over the defaults.

### Self-host

1. Download the latest release from [GitHub](https://github.com/axiomhq/do11y/releases/latest) and extract the zip.
2. Copy `dist/do11y.min.js` and `examples/do11y-config.example.js` to your docs project.
3. Rename `do11y-config.example.js` to `do11y-config.js` and fill in your credentials.
4. Add both scripts to every page, with the config file loading first:

```html
<script src="/path/to/do11y-config.js"></script>
<script src="/path/to/do11y.min.js"></script>
```

Don't edit `do11y.min.js` directly — it's a build artifact.

#### Automatic sync via GitHub Action

If you self-host in a GitHub repo, the included `examples/sync-do11y-to-docs.yml` Action keeps your copy up to date. Copy it to `.github/workflows/` in your docs repo. It runs every Monday and opens a PR when a new release is available.

Add two repository variables under **Settings > Secrets and variables > Actions**:

| Variable | Example | Description |
|---|---|---|
| `DO11Y_JS_PATH` | `scripts/do11y.min.js` | Path to `do11y.min.js` in your docs repo. |
| `DO11Y_VER_PATH` | `scripts/do11y.version` | Path to a version tracking file. |

Enable **Allow GitHub Actions to create and approve pull requests** under **Settings > Actions > General > Workflow permissions**. No secrets needed.

## Integration dashboard

An integration dashboard is automatically created in Axiom when you add Do11y. To access it:

1. In Axiom, click **Dashboards**.
2. In the **Integrations** section, click **Documentation observability (Do11y) (DATASET_NAME)**.

Or go directly to `https://app.axiom.co/ORG_ID/dashboards/do11y.DATASET_NAME`.
