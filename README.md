# Axiom Do11y

Documentation observability for Axiom. A single, dependency-free JavaScript file that tracks how people use your documentation — page views, scroll depth, link clicks, search usage, and code-block copies — and sends the data to [Axiom](https://axiom.co).

## Privacy

Do11y collects anonymous usage data without:

- Cookies (uses `sessionStorage` only — cleared when the browser closes)
- Personal identifiable information (PII)
- Device fingerprinting
- Cross-site tracking

No GDPR consent banner is required.

## Quick start

1. Add the script to every page of your documentation site, before the closing `</body>` tag:

```html
<script src="/path/to/do11y.js"></script>
```

2. Configure your Axiom credentials. You can either edit the `config` object at the top of `do11y.js` directly, or inject values via HTML `<meta>` tags:

```html
<meta name="axiom-do11y-domain" content="us-east-1.aws.edge.axiom.co">
<meta name="axiom-do11y-token" content="xaat-your-ingest-token">
<meta name="axiom-do11y-dataset" content="docs-analytics">
<meta name="axiom-do11y-framework" content="mintlify">
```

3. Create an API token in Axiom with **ingest-only** permissions scoped to a single dataset.

## Configuration

All options live in the `config` object at the top of `do11y.js`.

### Axiom connection

| Option | Default | Description |
|---|---|---|
| `axiom-domain` | `'AXIOM_DOMAIN'` | Axiom ingest endpoint. Use an [edge deployment](https://axiom.co/docs/reference/edge-deployments) domain for lower latency. |
| `dataset-name` | `'DATASET_NAME'` | Target Axiom dataset. |
| `api-token` | `'API_TOKEN'` | Ingest-only API token. |

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

When `framework` is set to a supported value, the script automatically uses the correct CSS selectors for search bars, copy buttons, code blocks, navigation, footers, and content areas. You can also set the framework via a meta tag:

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

## Events collected

| Event | Description | Key fields |
|---|---|---|
| `page_view` | Fires on every page load or SPA navigation. | `referrerDomain`, `isFirstPage`, `previousPath` |
| `link_click` | Internal, external, anchor, or email link click. | `linkType`, `targetUrl`, `linkText`, `linkContext`, `linkSection`, `linkIndex` |
| `scroll_depth` | User scrolls past a configured threshold. | `threshold`, `scrollPercent` |
| `page_exit` | Fires on `beforeunload`. | `totalTimeSeconds`, `activeTimeSeconds`, `engagementRatio`, `maxScrollDepth` |
| `search_opened` | User opens the search dialog (click or Cmd/Ctrl+K). | `trigger` |
| `code_copied` | User clicks a code block's copy button. | `language`, `codeSection`, `codeBlockIndex` |

Every event also includes: `sessionId`, `sessionPageCount`, `path`, `hash`, `title`, `viewportCategory`, `browserFamily`, `deviceType`, `language`, `timezoneOffset`.

## JavaScript API

Do11y exposes `window.AxiomDo11y` for debugging and integration:

```javascript
AxiomDo11y.getConfig()    // Current config (token redacted)
AxiomDo11y.isEnabled()    // Whether tracking is active
AxiomDo11y.debug(true)    // Toggle console logging
AxiomDo11y.flush()        // Force-send queued events
AxiomDo11y.getQueueSize() // Number of queued events
AxiomDo11y.cleanup()      // Disconnect observers and flush (for SPA unmount)
AxiomDo11y.version        // Script version
```

## Tests

The `test/` directory contains a test suite (`test-live-sites.js`). It runs headless Chromium via Puppeteer against real documentation sites to validate selectors in production.

```bash
cd test
npm install
npx puppeteer browsers install chrome
node test-live-sites.js
```

Sites tested:

| Framework | URL |
|---|---|
| Mintlify | https://axiom.co/docs/query-data/explore |
| Docusaurus | https://docusaurus.io/docs/configuration |
| Nextra | https://nextra.site/docs/getting-started |
| GitBook | https://docs.gitbook.com/content-creation/blocks/code-block |
| MkDocs Material | https://squidfunk.github.io/mkdocs-material/getting-started/ |
| VitePress | https://vitepress.dev/guide/getting-started |

## Known limitations

### Copy-button detection on Nextra and GitBook

The `copyButtonSelector` does not match copy buttons on **Nextra** or **GitBook** sites. Both frameworks render copy buttons with generic Tailwind CSS utility classes and no semantic attributes (`class`, `aria-label`, `title`, and `data-testid` all lack any "copy" identifier). There is no CSS selector that can reliably target these buttons without also matching unrelated elements.

**Workaround:** If you use Nextra or GitBook and need copy-button tracking, set `framework: 'custom'` and provide a selector specific to your site's DOM, or listen for clipboard events directly.

### Nextra search on custom themes

The default Nextra `searchSelector` (`.nextra-search input`) works on sites using the standard Nextra theme. Sites with heavily customized themes (for example, [SWR](https://swr.vercel.app)) may render search differently or only inject the search input into the DOM when the user presses Cmd/Ctrl+K, which means the element is not present on initial page load.

### Framework selectors may drift over time

CSS selectors are based on each framework's current DOM output and may break when frameworks release major updates that change class names or HTML structure. The live site test suite (`test-live-sites.js`) exists specifically to catch this. Run it periodically to verify selectors still match.

## License

[MIT](LICENSE)
