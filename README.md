# Axiom Do11y

Do11y is a documentation observability solution from [Axiom](https://axiom.co). It turns documentation usage into machine data. It streams behavioral events like the ones below from your docs site to Axiom in real time:

- Page views
- Scroll depth
- Link clicks
- Search queries
- Code-block copies
- Section reading time
- Tab switches
- Table of contents (TOC) usage
- Feedback widget usage
- Expand/collapse interactions

Do11y is built for humans and machines alike. It emits observability data designed to be easy to use for human users, while also being easy to query and analyze for machines.

Do11y is agent-native: in an era where AI assistants and autonomous agents increasingly read and cite documentation alongside human users, Do11y detects AI platform referrers (ChatGPT, Perplexity, Claude, Gemini, and others) so you can understand how agents and humans engage with your content differently.

The runtime artifact is a single dependency-free JavaScript file. The source is TypeScript (`src/do11y.ts`). [rolldown](https://rolldown.rs) produces the built output.

## Privacy

Do11y collects anonymous usage data:

- No cookies. Do11y uses `sessionStorage`, which the browser clears when it closes.
- No personal identifiable information (PII).
- No device fingerprinting.
- No cross-site tracking.

You don't need a GDPR consent banner for using Do11y.

## Prerequisites

1. [Create an Axiom account](https://app.axiom.co/register).
1. [Create a dataset in Axiom](https://axiom.co/docs/reference/datasets#create-dataset) to store observability data for your documentation site.
1. [Create an API token in Axiom](https://axiom.co/docs/reference/tokens) with **ingest-only** permissions scoped to the dataset.

## Quickstart

### Mintlify

1. Download the latest release from [GitHub](https://github.com/axiomhq/do11y/releases/latest) and extract the `do11y-<version>.zip` file.
1. Copy `dist/do11y.min.js` and `examples/do11y-config.example.js` to the same folder in your documentation project (for example, `scripts/`). Alphabetical ordering ensures the config loads first.
1. Rename `do11y-config.example.js` to `do11y-config.js`.
1. In `do11y-config.js`, replace the placeholder values with your Axiom credentials.

    ```js
    window.Do11yConfig = {
    axiomHost: 'AXIOM_DOMAIN',
    axiomToken: 'API_TOKEN',
    axiomDataset: 'DATASET_NAME',
    framework: 'mintlify',
    };
    ```

1. Optional: Set up the [automatic sync to your docs repo](#automatic-sync-to-your-docs-repo) to keep your copy of `do11y.min.js` up to date.

### Docusaurus

Add the following to `docusaurus.config.js`:

```js
module.exports = {
  headTags: [
    { tagName: 'meta', attributes: { name: 'axiom-do11y-domain', content: 'AXIOM_DOMAIN' } },
    { tagName: 'meta', attributes: { name: 'axiom-do11y-token', content: 'API_TOKEN' } },
    { tagName: 'meta', attributes: { name: 'axiom-do11y-dataset', content: 'DATASET_NAME' } },
    { tagName: 'meta', attributes: { name: 'axiom-do11y-framework', content: 'docusaurus' } },
  ],
  scripts: [{ src: 'https://cdn.jsdelivr.net/npm/@axiomhq/do11y@latest/dist/do11y.min.js', defer: true }],
};
```

### Nextra

Add the following to `pages/_app.jsx` (or `_app.tsx`):

```jsx
import Head from 'next/head';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta name="axiom-do11y-domain" content="AXIOM_DOMAIN" />
        <meta name="axiom-do11y-token" content="API_TOKEN" />
        <meta name="axiom-do11y-dataset" content="DATASET_NAME" />
        <meta name="axiom-do11y-framework" content="nextra" />
        <script src="https://cdn.jsdelivr.net/npm/@axiomhq/do11y@latest/dist/do11y.min.js" defer />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
```

### VitePress

Add the following to `.vitepress/config.js` (or `.vitepress/config.ts`):

```js
export default {
  head: [
    ['meta', { name: 'axiom-do11y-domain', content: 'AXIOM_DOMAIN' }],
    ['meta', { name: 'axiom-do11y-token', content: 'API_TOKEN' }],
    ['meta', { name: 'axiom-do11y-dataset', content: 'DATASET_NAME' }],
    ['meta', { name: 'axiom-do11y-framework', content: 'vitepress' }],
    ['script', { src: 'https://cdn.jsdelivr.net/npm/@axiomhq/do11y@latest/dist/do11y.min.js' }],
  ],
};
```

### MkDocs Material

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

### GitBook

In your GitBook workspace, go to **Customization** and add the following to the custom HTML head field:

```html
<meta name="axiom-do11y-domain" content="AXIOM_DOMAIN">
<meta name="axiom-do11y-token" content="API_TOKEN">
<meta name="axiom-do11y-dataset" content="DATASET_NAME">
<meta name="axiom-do11y-framework" content="gitbook">
<script src="https://cdn.jsdelivr.net/npm/@axiomhq/do11y@latest/dist/do11y.min.js" defer></script>
```

## Query data

Once you've installed Do11y and information about your documentation usage is flowing into Axiom, you can query the data in Axiom. See [QUERIES.md](QUERIES.md) for exampleAPL queries to analyze your documentation, including:

- AI traffic detection and trends
- Traffic sources and entry points
- Page engagement and scroll completion
- Where users get stuck (exit pages, low engagement)
- Navigation patterns and user journeys
- Link and CTA performance
- Code block engagement

For more information, see [Query data with Axiom](https://axiom.co/docs/query-data/explore).

## Integration dashboard

An integration dashboard provides a visual overview of your documentation usage. It shows important metrics like the number of page views, scroll depth, link clicks, code-block copies, section reading time, tab switches, TOC usage, feedback widget usage, and expand/collapse interactions. It's automatically created when you add Do11y to your docs site.

To access the integration dashboard:
1. In Axiom, click **Dashboards**.
1. In the **Integrations** section, click the integration dashboard **Documentation observability (Do11y) (DATASET_NAME)**.

Alternatively, access the integration dashboard with the URL `https://app.axiom.co/ORG_ID/dashboards/do11y.DATASET_NAME`.

## AI traffic detection

Do11y classifies referrer domains to detect traffic from AI platforms such as ChatGPT, Perplexity, Claude, Gemini, Copilot, DeepSeek, and others. Each `page_view` event includes:

| Field | Values | Description |
|---|---|---|
| `referrerCategory` | `ai`, `search-engine`, `social`, `community`, `code-host`, `direct`, `internal`, `other`, `unknown` | High-level traffic source category. |
| `aiPlatform` | `ChatGPT`, `Perplexity`, `Claude`, `Gemini`, `Copilot`, `DeepSeek`, `Meta AI`, `Grok`, `Mistral`, `You.com`, `Phind`, or `null` | Specific AI platform when `referrerCategory` is `ai`. |

This detection is referrer-based: it checks whether the `document.referrer` hostname matches a known AI platform. Do11y uses no fingerprinting, user-agent parsing, or additional data collection.

**Limitation:** Most AI platforms (especially ChatGPT mobile and API-sourced visits) don't pass referrer headers. These visits appear as `direct` traffic. Referrer-based detection typically captures 20-40% of AI traffic. Detecting the remaining "dark AI" traffic would require fingerprinting techniques that conflict with Do11y's privacy-first design.

See [QUERIES.md](QUERIES.md) for APL queries to analyze AI traffic, including per-platform breakdowns, trends, and engagement comparisons.

## Known limitations

### Copy-button detection on GitBook

The `copyButtonSelector` doesn't match copy buttons on GitBook sites. GitBook renders copy buttons with generic Tailwind CSS utility classes and no semantic attributes (`class`, `aria-label`, `title`, and `data-testid` all lack any "copy" identifier). There is no CSS selector that can reliably target these buttons without also matching unrelated elements.

**Workaround:** If you use GitBook and need copy-button tracking, set `framework: 'custom'` and provide a selector specific to your site's DOM, or listen for clipboard events directly.

### Custom themes

The selectors work on sites using the standard themes of each supported framework. Sites with heavily customized themes may render page elements differently. If you use a custom theme, check whether you need to set the selectors manually.

### Framework selector drift

CSS selectors reflect each framework's current DOM output and may break when frameworks release major updates that change class names or HTML structure. The test suites (`test-live-sites.ts` and `test-queries.ts`) exist specifically to catch this. Run them periodically to verify selectors still match.

## Setup for unsupported frameworks

### Option 1: CDN (recommended)

Add the script to every page of your docs site. The simplest setup uses meta tags for the required settings:

```html
<meta name="axiom-do11y-domain" content="AXIOM_DOMAIN">
<meta name="axiom-do11y-token" content="API_TOKEN">
<meta name="axiom-do11y-dataset" content="DATASET_NAME">
<meta name="axiom-do11y-framework" content="FRAMEWORK">
<script src="https://cdn.jsdelivr.net/npm/@axiomhq/do11y@latest/dist/do11y.min.js"></script>
```

Replace the meta tag values with your Axiom credentials and docs framework. To pin a specific version, replace `latest` with a version tag like `1.0.0`.

#### Advanced configuration via CDN

Meta tags only cover the essential settings. To configure any of the [advanced options](#configuration) such as scroll thresholds, tracking toggles, or custom selectors, set `window.Do11yConfig` in an inline script placed **before** the CDN script tag:

```html
<script>
window.Do11yConfig = {
  axiomHost: 'us-east-1.aws.edge.axiom.co',
  axiomToken: 'xaat-your-ingest-token',
  axiomDataset: 'do11y',
  framework: 'vitepress',
  scrollThresholds: [25, 50, 75, 100],
  trackFeedback: false,
  sectionVisibleThreshold: 5,
  // Any option from the Configuration table below can be set here
};
</script>
<script src="https://cdn.jsdelivr.net/npm/@axiomhq/do11y@1.0.0/dist/do11y.min.js"></script>
```

When both are present, meta tags take precedence over `window.Do11yConfig`, which takes precedence over the defaults.

### Option 2: Self-host

If you can't use a CDN, self-host the script.

1. Download the latest release from [GitHub](https://github.com/axiomhq/do11y/releases/latest) and extract the `do11y-<version>.zip` file.
1. Copy `dist/do11y.min.js` and `examples/do11y-config.example.js` to your documentation project (for example, `scripts/`).
1. Rename `do11y-config.example.js` to `do11y-config.js`.
1. In `do11y-config.js`, replace the placeholder values with your Axiom credentials.

    ```js
    window.Do11yConfig = {
    axiomHost: 'AXIOM_DOMAIN',
    axiomToken: 'API_TOKEN',
    axiomDataset: 'DATASET_NAME',
    framework: 'FRAMEWORK',
    };
    ```

1. Add both scripts to every page, with the config file loading first:

    ```html
    <script src="/path/to/do11y-config.js"></script>
    <script src="/path/to/do11y.min.js"></script>
    ```

1. Optional: Set up the [automatic sync to your docs repo](#automatic-sync-to-your-docs-repo) to keep your copy of `do11y.min.js` up to date.

Don't edit `do11y.min.js` directly. It's a build artifact and updating to a new release overwrites it.

#### Automatic sync to your docs repo

If you self-host `do11y.min.js` in GitHub repo, the included GitHub Action (`.github/workflows/sync-do11y-to-docs.yml`) keeps your copy up to date automatically.

1. Copy `.github/workflows/sync-do11y-to-docs.yml` to `.github/workflows/` in your docs repo. It runs every Monday and opens a PR whenever a new do11y release is available.
1. Create an empty file at `do11y.version`. This file is used to track the version of `do11y.min.js`.
1. Add the following repository variables in your docs repo under **Settings > Secrets and variables > Actions > Variables > New repository variable**:

    | Variable | Example | Description |
    |---|---|---|
    | `DO11Y_JS_PATH` | `scripts/do11y.min.js` | Path to `do11y.min.js` in your docs repo. |
    | `DO11Y_VER_PATH` | `scripts/do11y.version` | Path to a version tracking file in your docs repo. |

1. Ensure the GitHub Action has permission to push to your docs repo. Go to **Settings > Actions > General > Workflow permissions**, and turn on **Allow GitHub Actions to create and approve pull requests**.

You don't need to add any secrets.

## Configuration

All options can be set via `window.Do11yConfig` (inline script or a separate config file) or via meta tags.

### Axiom connection

| Option | Default | Description |
|---|---|---|
| `axiomHost` | `'AXIOM_DOMAIN'` | Base domain of the edge deployment where you want to store your data. For more information, see [Edge deployments](https://axiom.co/docs/reference/edge-deployments). |
| `axiomDataset` | `'DATASET_NAME'` | Name of the Axiom dataset where you want to store your data. |
| `axiomToken` | `'API_TOKEN'` | Ingest-only API token scoped to the dataset. |

### Behavior

| Option | Default | Description |
|---|---|---|
| `debug` | `false` | Log events to the browser console. |
| `flushInterval` | `5000` | Milliseconds between batch flushes. |
| `maxBatchSize` | `10` | Events queued before forcing a flush. |
| `trackOutboundLinks` | `true` | Track clicks on external links. |
| `trackInternalLinks` | `true` | Track clicks on internal links. |
| `trackScrollDepth` | `true` | Track scroll depth thresholds. |
| `scrollThresholds` | `[25, 50, 75, 90]` | Scroll percentages to record. |
| `trackSectionVisibility` | `true` | Track which headings users actually read (via IntersectionObserver). |
| `sectionVisibleThreshold` | `3` | Minimum seconds a section must be visible before recording. |
| `trackTabSwitches` | `true` | Track code language/framework tab switches. |
| `trackTocClicks` | `true` | Track on-page table of contents clicks. |
| `trackExpandCollapse` | `true` | Track expand/collapse interactions (details, accordions). |
| `trackFeedback` | `true` | Track "Was this helpful?" feedback widget clicks. |
| `allowedDomains` | `['ALLOWED_DOMAINS']` | Restrict which domains may send data. Set to `null` to allow any. |
| `respectDNT` | `true` | Honor the browser's Do Not Track setting. |
| `maxRetries` | `2` | Retry count for failed requests. |
| `retryDelay` | `1000` | Base delay between retries (doubles each attempt). |
| `rateLimitMs` | `100` | Minimum gap between events of the same type. |

### Documentation framework

Set `framework` to auto-configure CSS selectors for your docs platform:

| Value | Framework |
|---|---|
| `'mintlify'` | [Mintlify](https://mintlify.com) (default) |
| `'docusaurus'` | [Docusaurus](https://docusaurus.io) |
| `'nextra'` | [Nextra](https://nextra.site) |
| `'gitbook'` | [GitBook](https://gitbook.com) |
| `'mkdocs-material'` | [MkDocs Material](https://squidfunk.github.io/mkdocs-material/) |
| `'vitepress'` | [VitePress](https://vitepress.dev) |
| `'custom'` | Provide your own selectors (see below) |

When `framework` is set to a supported value, the script automatically uses the correct CSS selectors for search bars, copy buttons, code blocks, navigation, footers, and content areas. Optional: Set the framework via a meta tag:

```html
<meta name="axiom-do11y-framework" content="docusaurus">
```

### Custom selectors

Set `framework: 'custom'` and provide any combination of these selectors. Any selector left `null` falls back to the Mintlify default.

| Selector | What it targets |
|---|---|
| `searchSelector` | Search trigger elements (input, button). |
| `copyButtonSelector` | "Copy code" buttons inside code blocks. |
| `codeBlockSelector` | Code block containers (`<pre>`, wrappers). |
| `navigationSelector` | Navigation and sidebar regions. |
| `footerSelector` | Page footer. |
| `contentSelector` | Main content area. |
| `tabContainerSelector` | Tab groups for code language/framework switching. |
| `tocSelector` | On-page table of contents container. |
| `feedbackSelector` | "Was this helpful?" feedback widget container. |

## Events collected

| Event | Description | Key fields |
|---|---|---|
| `page_view` | Fires on every page load or SPA navigation. | `referrerDomain`, `referrerCategory`, `aiPlatform`, `isFirstPage`, `previousPath` |
| `link_click` | Internal, external, anchor, or email link click. | `linkType`, `targetUrl`, `linkText`, `linkContext`, `linkSection`, `linkIndex` |
| `scroll_depth` | User scrolls past a configured threshold. | `threshold`, `scrollPercent` |
| `page_exit` | Fires on `beforeunload`. | `totalTimeSeconds`, `activeTimeSeconds`, `engagementRatio`, `maxScrollDepth`, `referrerCategory`, `aiPlatform` |
| `search_opened` | User opens the search dialog (click or Cmd/Ctrl+K). | `trigger` |
| `code_copied` | User clicks a code block's copy button. | `language`, `codeSection`, `codeBlockIndex` |
| `section_visible` | A heading stayed visible in the viewport long enough for the user to read it. | `heading`, `headingLevel`, `visibleSeconds` |
| `tab_switch` | User switches a code language/framework tab. | `tabLabel`, `tabGroup`, `isDefault` |
| `toc_click` | User clicks an entry in the on-page table of contents. | `heading`, `headingLevel`, `tocPosition` |
| `feedback` | User clicks a "Was this helpful?" button. | `rating` |
| `expand_collapse` | User toggles a `<details>` element or accordion. | `summary`, `action`, `section` |

Every event also includes: `sessionId`, `sessionPageCount`, `path`, `hash`, `title`, `viewportCategory`, `browserFamily`, `deviceType`, `language`, and `timezoneOffset`.

## JavaScript API

Do11y exposes `window.AxiomDo11y` for debugging and integration:

```javascript
AxiomDo11y.getConfig()    // Current config (token redacted)
AxiomDo11y.isEnabled()    // Whether tracking is active
AxiomDo11y.flush()        // Force-send queued events
AxiomDo11y.getQueueSize() // Number of queued events
AxiomDo11y.version        // Script version
```

Do11y doesn't expose `cleanup()` and `debug()` on the global object. Exposing `cleanup()` would allow any third-party script on the page to silently stop tracking. Exposing `debug()` would allow any script to enable verbose console output that reveals the configured ingest endpoint and queued event data.

## Tests

The `tests` directory contains multiple layers of testing.

### Selector tests against live sites (`tests/test-live-sites.ts`)

Runs headless Chromium via Puppeteer against real documentation sites to validate that selectors match elements in production.

```bash
cd tests
npm i
npx puppeteer browsers install chrome
npm run test-live-sites
```

The test covers the following sites:

| Framework | URL |
|---|---|
| Mintlify | https://axiom.co/docs/query-data/explore |
| Docusaurus | https://docusaurus.io/docs/configuration |
| Nextra | https://nextra.site/docs/getting-started |
| GitBook | https://docs.gitbook.com/content-creation/blocks/code-block |
| MkDocs Material | https://squidfunk.github.io/mkdocs-material/getting-started/ |
| VitePress | https://vitepress.dev/guide/getting-started |

### Query validation (`tests/test-queries.ts`)

Validates that all APL queries in [QUERIES.md](QUERIES.md) are syntactically correct by executing them against the Axiom API.

```bash
cd tests
npm run test-queries
```

### Integration tests (`tests/test-integrations.ts`)

End-to-end tests that install each supported framework, inject `do11y.js`, start a local dev server, drive user interactions via Puppeteer, and then query the Axiom API to verify that events arrived correctly.

```bash
cd tests
npm i
npx puppeteer browsers install chrome
```

Copy `tests/.env.example` to `tests/.env` and add your credentials:

```
AXIOM_DOMAIN=us-east-1.aws.edge.axiom.co
AXIOM_TOKEN=xaat-your-ingest-token
AXIOM_DATASET=do11y
```

The token requires both **ingest** and **query** permissions on the target dataset.

Run the full suite:

```bash
npm run test-integrations
```

Run a subset of frameworks:

```bash
FRAMEWORKS=mintlify,vitepress npm run test-integrations
```

Skip dependency installation on repeat runs:

```bash
SKIP_INSTALL=1 npm run test-integrations
```

The test covers the following frameworks:

| Name | Type | Port | Notes |
|---|---|---|---|
| `mintlify` | npm (Mintlify CLI) | 4005 | Full framework install |
| `gitbook` | npm (HonKit) + static serve | 4006 | Built with HonKit (GitBook OSS fork), served as static HTML |
| `docusaurus` | npm (Docusaurus 3) | 4001 | Full framework install |
| `nextra` | npm (Next.js + Nextra 3) | 4002 | Full framework install |
| `vitepress` | npm (VitePress 1.x) | 4003 | Full framework install |
| `mkdocs-material` | pip (MkDocs Material) | 4004 | Requires Python. Skips if unavailable. |

The test validates the following events per framework:

| Event | Minimum expected | Notes |
|---|---|---|
| `page_view` | 2 | Start page + guide page |
| `scroll_depth` | 1 | |
| `link_click` | 1 | |
| `page_exit` | 1 | |
| `expand_collapse` | 0 | Best-effort, requires `<details>` in DOM |
| `toc_click` | 0 | Best-effort. GitBook static has no on-page TOC. The automated test cannot synthesise a VitePress TOC click (Vue's reactive rendering replaces the link node before the synthetic event fires) |
| `search_opened` | 0 | Best-effort. No search button in GitBook static build |
| `code_copied` | 0 | Best-effort. GitBook exposes no identifiable copy button selectors |
| `feedback` | 0 | Best-effort. Only GitBook has a native feedback widget |
| `section_visible` | 1 | `sectionVisibleThreshold: 1` + 2 s dwell on page load |

## Development

### Create release

1. Run all [tests](#tests).
1. Run the following commands to build the package and run the tests:

    ```bash
    npm run build
    npm run check
    npm run lint
    ```

1. Bump the version in `package.json` and `src/do11y.ts`.
1. Tag and release via the GitHub CLI:

    ```bash
    git tag v1.1.0
    git push origin v1.1.0
    gh release create v1.1.0
    ```

    Alternatively, use the GitHub UI to create a release at https://github.com/axiomhq/do11y/releases/new

1. Publish the package to npm as `@axiomhq/do11y`. This requires access to the `@axiomhq` npm organization.

    ```bash
    npm login
    npm publish --access public
    npm logout
    ```

### Repository layout

```
do11y/
├── src/
│   └── do11y.ts          ← TypeScript source
├── examples/
│   └── do11y-config.example.js  ← self-host config template
├── dist/                  ← built output
│   ├── do11y.js
│   └── do11y.min.js
├── package.json
├── tsconfig.json
├── rolldown.config.ts
├── .oxlintrc.json
└── .github/workflows/
    ├── publish.yml        ← npm publish on release
    └── sync-do11y-to-docs.yml   ← weekly update workflow (copy to your docs repo)
```

### Toolchain

| Tool | Purpose |
|---|---|
| [TypeScript](https://www.typescriptlang.org) | Type checking (`npm run check`) |
| [rolldown](https://rolldown.rs) | Bundling to IIFE (`npm run build`) |
| [oxlint](https://oxc.rs/docs/guide/usage/linter) | Linting (`npm run lint`) |
| [oxfmt](https://oxc.rs/docs/guide/usage/formatter) | Formatting (`npm run format`) |

### Local setup

```bash
npm install
npm run build   # outputs dist/do11y.js and dist/do11y.min.js (see examples/ for config template)
npm run check   # TypeScript type checking
npm run lint    # oxlint
```

All source changes go in `src/do11y.ts`. The build produces the `dist/` directory. The self-host config template lives in `examples/do11y-config.example.js` and ships with the package.

## License

[MIT](LICENSE)
