# Example APL queries

This page contains example APL queries for analyzing documentation observability data collected by Do11y. Replace `do11y` with your dataset name.

## Traffic and discovery

### Entry points

Find the most common first pages users land on.

```apl
['do11y']
| where eventType == 'page_view' and isFirstPage == true
| summarize entries = count() by path
| order by entries desc
| take 20
```

### Traffic sources

See where your visitors come from.

```apl
['do11y']
| where eventType == 'page_view' and isFirstPage == true
| summarize sessions = count() by referrerDomain
| order by sessions desc
```

### Entry point by referrer

Understand which sources land on which pages.

```apl
['do11y']
| where eventType == 'page_view' and isFirstPage == true
| summarize sessions = count() by referrerDomain, path
| order by sessions desc
| take 30
```

## Engagement and page performance

### Page engagement score

Combine time, scroll depth, and engagement ratio into a single score.

```apl
['do11y']
| where eventType == 'page_exit'
| summarize 
    avgActiveTime = avg(activeTimeSeconds),
    avgEngagement = avg(engagementRatio),
    avgScrollDepth = avg(maxScrollDepth),
    visits = count()
  by path
| where visits > 10
| extend engagementScore = (avgActiveTime * avgEngagement * avgScrollDepth) / 100
| order by engagementScore desc
```

### Scroll completion rate

Find pages where users read to the end.

```apl
['do11y']
| where eventType == 'page_exit'
| summarize 
    total = count(),
    completed = countif(maxScrollDepth >= 90)
  by path
| extend completionRate = round(100.0 * completed / total, 1)
| where total > 10
| order by completionRate desc
```

### Bounce detection

Identify pages with high bounce rates (low scroll, low time).

```apl
['do11y']
| where eventType == 'page_exit'
| summarize 
    avgTime = avg(activeTimeSeconds),
    avgScroll = avg(maxScrollDepth),
    visits = count()
  by path
| where visits > 5
| where avgTime < 10 and avgScroll < 25
| order by visits desc
```

## Where users get stuck

### Exit pages

Find where sessions end (excluding single-page sessions).

```apl
['do11y']
| where eventType == 'page_view'
| order by _time asc
| summarize 
    pages = make_list(path),
    pageCount = count()
  by sessionId
| where pageCount > 1
| extend firstPage = tostring(pages[0]), lastPage = tostring(pages[array_length(pages) - 1])
| where firstPage != lastPage
| summarize exits = count() by lastPage
| order by exits desc
| take 20
```

### Low engagement pages

Find high-traffic pages with poor engagement.

```apl
['do11y']
| where eventType == 'page_exit'
| summarize 
    visits = count(),
    avgScroll = avg(maxScrollDepth),
    avgTime = avg(activeTimeSeconds)
  by path
| where visits > 20 and avgScroll < 30
| order by visits desc
```

### Pages with high search rate

Identify pages where users frequently open search (potential confusion signal).

```apl
['do11y']
| summarize 
    pageViews = countif(eventType == 'page_view'),
    searches = countif(eventType == 'search_opened')
  by sessionId, path
| where pageViews > 0
| summarize 
    totalViews = sum(pageViews),
    sessionsWithSearch = countif(searches > 0)
  by path
| extend searchRate = round(100.0 * sessionsWithSearch / totalViews, 1)
| where totalViews > 10
| order by searchRate desc
```

## Navigation patterns

### Page-to-page transitions

See how users move between pages.

```apl
['do11y']
| where eventType == 'page_view' and isnotnull(previousPath)
| summarize transitions = count() by previousPath, path
| where transitions > 5
| order by transitions desc
| take 50
```

### Journey depth distribution

Understand how many pages users view per session.

```apl
['do11y']
| where eventType == 'page_view'
| summarize pageCount = count() by sessionId
| summarize 
    sessions = count(),
    avgPages = avg(pageCount),
    medianPages = percentile(pageCount, 50),
    p90Pages = percentile(pageCount, 90)
```

### Full session journeys

View complete page sequences for multi-page sessions.

```apl
['do11y']
| where eventType == 'page_view'
| order by _time asc
| summarize journey = make_list(path) by sessionId
| extend journeyLength = array_length(journey)
| where journeyLength >= 3
| take 100
```

## Link and CTA performance

### Most clicked links

Find the most popular links across all pages.

```apl
['do11y']
| where eventType == 'link_click'
| summarize clicks = count() by linkText, targetUrl
| order by clicks desc
| take 30
```

### External link destinations

See where users go when they leave.

```apl
['do11y']
| where eventType == 'link_click' and linkType == 'external'
| summarize clicks = count() by targetUrl
| order by clicks desc
```

### Link clicks by section

Track specific CTAs (like "Run in Playground") by page and section.

```apl
['do11y']
| where eventType == 'link_click' and linkText contains 'Playground'
| summarize clicks = count() by path, linkSection
| order by clicks desc
```

### Pages with low link engagement

Find pages where users don't click links.

```apl
['do11y']
| summarize 
    views = countif(eventType == 'page_view'),
    linkClicks = countif(eventType == 'link_click')
  by path
| extend clickRate = round(100.0 * linkClicks / views, 1)
| where views > 20
| order by clickRate asc
```

## Code block engagement

### Code copy rate by language

See which code languages users copy most.

```apl
['do11y']
| where eventType == 'code_copied'
| summarize copies = count() by language
| order by copies desc
```

### Code copies by page

Find pages with the most code block engagement.

```apl
['do11y']
| where eventType == 'code_copied'
| summarize copies = count() by path, codeSection
| order by copies desc
| take 30
```

## Content performance comparison

### Page performance dashboard

Get a comprehensive view of all pages.

```apl
['do11y']
| summarize 
    pageViews = countif(eventType == 'page_view'),
    avgScrollDepth = avgif(maxScrollDepth, eventType == 'page_exit'),
    avgTimeSeconds = avgif(activeTimeSeconds, eventType == 'page_exit'),
    linkClicks = countif(eventType == 'link_click'),
    codeCopies = countif(eventType == 'code_copied'),
    searches = countif(eventType == 'search_opened')
  by path
| where pageViews > 10
| extend 
    clicksPerView = round(1.0 * linkClicks / pageViews, 2),
    copiesPerView = round(1.0 * codeCopies / pageViews, 2)
| order by pageViews desc
```

### Compare sections

Aggregate performance by URL prefix (section).

```apl
['do11y']
| extend section = extract("^/([^/]+)", 1, path)
| where eventType == 'page_exit'
| summarize 
    visits = count(),
    avgTime = avg(activeTimeSeconds),
    avgScroll = avg(maxScrollDepth)
  by section
| order by visits desc
```

### Week-over-week trend

Track traffic growth over time.

```apl
['do11y']
| where eventType == 'page_view'
| extend week = startofweek(_time)
| summarize pageViews = count(), uniqueSessions = dcount(sessionId) by week
| order by week asc
```

## Device and context

### Mobile vs desktop engagement

Compare engagement by device type.

```apl
['do11y']
| where eventType == 'page_exit'
| summarize 
    visits = count(),
    avgTime = avg(activeTimeSeconds),
    avgScroll = avg(maxScrollDepth)
  by deviceType
```

### Viewport impact on engagement

See how screen size affects user behavior.

```apl
['do11y']
| where eventType == 'page_exit'
| summarize 
    visits = count(),
    avgScroll = avg(maxScrollDepth)
  by viewportCategory
| order by visits desc
```

### Browser breakdown

Understand your audience's browser preferences.

```apl
['do11y']
| where eventType == 'page_view'
| summarize sessions = dcount(sessionId) by browserFamily
| order by sessions desc
```

## Key metrics reference

| Metric | Good signal | Warning signal |
|--------|-------------|----------------|
| Avg scroll depth | > 60% | < 25% |
| Avg active time | 30–120s | < 10s |
| Completion rate (90% scroll) | > 40% | < 15% |
| Pages per session | > 3 | 1 (bounce) |
| Search rate after page view | Low | High (confusion) |
| Exit rate | Low on guides | High on intro pages |
