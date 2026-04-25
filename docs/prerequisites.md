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

Before installing Do11y, complete the following steps in Axiom.

## 1. Create an Axiom account

[Register a free Axiom account](https://app.axiom.co/register). The free tier is sufficient for the biggest documentation sites.

## 2. Create a dataset

Datasets are collections of related events. Do11y sends all behavioral events to a single dataset you choose.

1. In Axiom, go to **Settings > Datasets and Views**.
2. Click **New dataset**.
3. Give the dataset a name. Something like `my-docs` or `docs-observability` works well. The name is used in your Do11y config as `axiomDataset` and appears in the integration dashboard title.
4. Optionally add a description, then save.

You can leave retention at the default for now. You can adjust it later under **Settings > Datasets and Views** by clicking the retention icon next to the dataset.

## 3. Create an API token

Do11y needs an ingest-only token scoped to the dataset you just created. Ingest-only tokens can write data but cannot read it, which makes them safe to embed in client-side scripts.

1. Go to **Settings > API Tokens**.
2. Click **New API token**.
3. Give the token a name, for example `do11y-my-docs`.
4. In the **Dataset Access** section, select **Allow ingest access to specific datasets only** and check the dataset you created in step 2.
5. Leave permissions set to **CanIngest**. Do not add query permissions — they are not needed and would increase the risk if the token is ever exposed.
6. Optionally set an expiry date. If you set one, remember to rotate the token before it expires.
7. Click **Save**. The token value is shown once — copy it now. It starts with `xaat-`.

## 4. Find your Axiom domain

Your Axiom domain (also called the edge deployment domain) is where Do11y sends events. It looks like `us-east-1.aws.edge.axiom.co`.

1. Go to **Settings > General**.
2. Find the **Region** field. Your domain is based on the region shown there.

Alternatively, use the domain from any API call you've made to Axiom — it's the hostname in the URL.

## What you need

You now have the three values required by Do11y:

| Value | Example | Config option |
|---|---|---|
| Axiom domain | `us-east-1.aws.edge.axiom.co` | `axiomHost` |
| Dataset name | `my-docs` | `axiomDataset` |
| API token | `xaat-...` | `axiomToken` |

With these in hand, follow the install guide for your documentation framework.
