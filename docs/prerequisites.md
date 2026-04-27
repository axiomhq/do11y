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

## Create an Axiom account

[Register a free Axiom account](https://app.axiom.co/register). The free tier is sufficient for the biggest documentation sites.

## Create a dataset

Datasets are collections of related events. Do11y sends all behavioral events to a single dataset you choose.

1. Click ⚙️ **Settings > Datasets and views**.
1. Click **New dataset**.
1. Name the dataset, and leave the default settings for the other fields.
1. Note the dataset name and the **Edge deployment** field.
1. Click **Save dataset**.

## Determine Axiom domain

Your Axiom domain is where Do11y sends events. It depends on the edge deployment of the dataset you have just created.

| Edge deployment | Axiom domain |
|---|---|
| US East 1 (AWS) | `us-east-1.aws.edge.axiom.co` |
| EU Central 1 (AWS) | `eu-central-1.aws.edge.axiom.co` |

## Create an API token

Do11y needs an ingest-only token scoped to the dataset you have just created. Ingest-only tokens can write data but cannot read it, which makes them safe to embed in client-side scripts.

1. Click ⚙️ **Settings > API Tokens**.
1. Click **New API token**.
1. Name your API token.
1. In the **Dataset Access** section, select **Allow ingest access to specific datasets only** and select the dataset you have created for Do11y. Don't select any other datasets.
1. Click **Create**.
1. Copy the API token that appears and store it securely. It won’t be displayed again.

## Axiom credentials

You now have the three values from Axiom that Do11y needs:

| Value | Example | Config option |
|---|---|---|
| Axiom domain | `us-east-1.aws.edge.axiom.co` | `axiomHost` |
| Dataset name | `my-docs` | `axiomDataset` |
| API token | `xaat-...` | `axiomToken` |

You're now ready to add Do11y to your documentation site. Follow the install guide for your documentation framework:

- [Install on Docusaurus](/install/docusaurus)
- [Install on Nextra](/install/nextra)
- [Install on VitePress](/install/vitepress)
- [Install on MkDocs Material](/install/mkdocs-material)
- [Install on GitBook](/install/gitbook)
- [Manual setup for other frameworks](/install/manual)

## Further reading

To learn more about Axiom, see these pages in the Axiom documentation:
- [Datasets](https://axiom.co/docs/reference/datasets)
- [Edge deployments](https://axiom.co/docs/reference/edge-deployments)
- [API tokens](https://axiom.co/docs/reference/tokens)
