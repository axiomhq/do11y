---
title: Reference
description: Full reference for Do11y configuration options, events, AI traffic detection fields, and the JavaScript API.
head:
  - - meta
    - property: og:title
      content: Reference — Do11y
  - - meta
    - property: og:description
      content: Full reference for Do11y configuration options, events, AI traffic detection fields, and the JavaScript API.
---

# Reference

## Configuration

All options can be set via `window.Do11yConfig` (inline script or a separate config file) or via meta tags. Meta tags take precedence over `window.Do11yConfig`, which takes precedence over the defaults.

### Axiom connection

| Option | Default | Description |
|---|---|---|
| `axiomHost` | `'AXIOM_DOMAIN'` | Base domain of the edge deployment where you want to store your data. See [Edge deployments](https://axiom.co/docs/reference/edge-deployments). |
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

### Framework

Set `framework` to auto-configure CSS selectors for your docs platform:

| Value | Framework |
|---|---|
| `'mintlify'` | [Mintlify](https://mintlify.com) (default) |
| `'docusaurus'` | [Docusaurus](https://docusaurus.io) |
| `'nextra'` | [Nextra](https://nextra.site) |
| `'mkdocs-material'` | [MkDocs Material](https://squidfunk.github.io/mkdocs-material/) |
| `'vitepress'` | [VitePress](https://vitepress.dev) |
| `'custom'` | Provide your own selectors (see below) |

When `framework` is set to a supported value, Do11y automatically uses the correct CSS selectors for search bars, copy buttons, code blocks, navigation, footers, and content areas. You can also set it via meta tag:

```html
<meta name="axiom-do11y-framework" content="docusaurus">
```

### Custom selectors

Set `framework: 'custom'` and provide any combination of these selectors. Selectors left `null` fall back to the Mintlify defaults.

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

---

## Events

Every event includes: `sessionId`, `sessionPageCount`, `path`, `hash`, `title`, `viewportCategory`, `browserFamily`, `deviceType`, `language`, and `timezoneOffset`.

| Event | Description | Key fields |
|---|---|---|
| `page_view` | Fires on every page load or SPA navigation. | `referrerDomain`, `referrerCategory`, `aiPlatform`, `isFirstPage`, `previousPath` |
| `link_click` | Internal, external, anchor, or email link click. | `linkType`, `targetUrl`, `linkText`, `linkContext`, `linkSection`, `linkIndex` |
| `scroll_depth` | User scrolls past a configured threshold. | `threshold`, `scrollPercent` |
| `page_exit` | Fires on `beforeunload`. | `totalTimeSeconds`, `activeTimeSeconds`, `engagementRatio`, `maxScrollDepth`, `referrerCategory`, `aiPlatform` |
| `search_opened` | User opens the search dialog (click or Cmd/Ctrl+K). | `trigger` |
| `code_copied` | User clicks a code block's copy button. | `language`, `codeSection`, `codeBlockIndex` |
| `section_visible` | A heading stayed visible in the viewport long enough to read. | `heading`, `headingLevel`, `visibleSeconds` |
| `tab_switch` | User switches a code language/framework tab. | `tabLabel`, `tabGroup`, `isDefault` |
| `toc_click` | User clicks an entry in the on-page table of contents. | `heading`, `headingLevel`, `tocPosition` |
| `feedback` | User clicks a "Was this helpful?" button. | `rating` |
| `expand_collapse` | User toggles a `<details>` element or accordion. | `summary`, `action`, `section` |

---

## AI traffic detection

Do11y classifies referrer domains to detect traffic from AI platforms. Each `page_view` event includes:

| Field | Values | Description |
|---|---|---|
| `referrerCategory` | `ai`, `search-engine`, `social`, `community`, `code-host`, `direct`, `internal`, `other`, `unknown` | High-level traffic source category. |
| `aiPlatform` | `ChatGPT`, `Perplexity`, `Claude`, `Gemini`, `Copilot`, `DeepSeek`, `Meta AI`, `Grok`, `Mistral`, `You.com`, `Phind`, or `null` | Specific AI platform when `referrerCategory` is `ai`. |

Detection is referrer-based: it checks whether `document.referrer` hostname matches a known AI platform. No fingerprinting, user-agent parsing, or additional data collection.

**Limitation:** Most AI platforms (especially ChatGPT mobile and API-sourced visits) don't pass referrer headers. Those visits appear as `direct` traffic. Referrer-based detection typically captures 20–40% of AI traffic.

---

## JavaScript API

Do11y exposes `window.AxiomDo11y` for debugging and integration:

```javascript
AxiomDo11y.getConfig()    // Current config (token redacted)
AxiomDo11y.isEnabled()    // Whether tracking is active
AxiomDo11y.flush()        // Force-send queued events
AxiomDo11y.getQueueSize() // Number of queued events
AxiomDo11y.version        // Script version
```

---

## Known limitations

**Custom themes:** The selectors work on sites using the standard theme of each supported framework. Heavily customized themes may render elements differently. If you use a custom theme, check whether you need to set selectors manually.

**Framework selector drift:** CSS selectors reflect each framework's current DOM output and may break when frameworks release major updates that change class names or HTML structure. Run the test suites periodically to verify selectors still match.
