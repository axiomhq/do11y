---
title: Prerequisites
description: Set up an Axiom account, dataset, and API token before installing Do11y.
head:
  - - meta
    - property: og:title
      content: Prerequisites — Do11y
  - - meta
    - property: og:description
      content: Set up an Axiom account, dataset, and API token before installing Do11y.
---

# Prerequisites

Before installing Do11y, set up the following in Axiom.

## 1. Create an Axiom account

[Create an Axiom account](https://app.axiom.co/register) if you don't have one. The free tier is sufficient for most documentation sites.

## 2. Create a dataset

[Create a dataset](https://axiom.co/docs/reference/datasets#create-dataset) to store the observability data for your documentation site. Give it a descriptive name like `my-docs` or `docs-observability`.

## 3. Create an API token

[Create an API token](https://axiom.co/docs/reference/tokens) with **ingest-only** permissions scoped to the dataset you just created. Scoping the token to a single dataset limits the blast radius if the token is ever exposed.

The token value starts with `xaat-`. You'll use it as `axiomToken` in your Do11y config.

## What you need

Once complete, you'll have three values to use in your Do11y configuration:

| Value | Where to find it | Config option |
|---|---|---|
| Axiom domain | Shown in **Settings > Regions** | `axiomHost` |
| Dataset name | The name you chose above | `axiomDataset` |
| API token | Copied when you created the token | `axiomToken` |

With these in hand, follow the install guide for your documentation framework.
