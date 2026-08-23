# ESUT Marketplace Query Audit

**Date:** 23 August 2026  
**Scope:** Read-only audit and comparison testing only. The production marketplace query was not replaced.

## Executive finding

The current public marketplace query is functional, but it combines listing, store, category, primary-image, and inventory retrieval in one joined statement. The query applies the essential public filters—active listing status and active store status—and supports search, category, price, condition, verified-seller, sorting, pagination, and truthful image absence. The main maintainability risk is the broad join shape, especially the direct image and inventory joins, because future one-to-many records could duplicate listings or make media selection harder to reason about.

The proposed read-only shape retains the same public listing filters and ordering but separates media selection from the core listing query. It retrieves the listing identity set first, then selects the first ordered image per listing in memory, returning `null` where no image exists. This is a staged comparison only; the live procedure remains unchanged.

## Current contract observed

The public search procedure accepts a page and limit through the shared pager, plus optional `q`, `categorySlug`, `min`, `max`, `condition`, `verified`, and `sort` values. It returns `{ items, page, hasMore }`. The current production query joins active listings to active stores and active categories, left-joins a primary image and inventory, applies the requested filters, orders by the selected sort, and maps rows through the existing availability mapper.

The product-detail procedure separately loads the active listing, all listing images ordered by `sortOrder`, related listings, and reviews. This detail route is not changed by the comparison harness.

## Comparison method

`server/marketplaceQueryComparison.test.ts` contains a read-only harness. It reproduces the current query semantics and compares them with a staged query shape using the real configured database and schema. No inserts, updates, deletes, status changes, media uploads, or cache mutations are performed.

The harness compares default newest ordering, price ascending, price descending, popular ordering, text search, and the first active category. It checks listing identity and order, detects duplicate proposed listing IDs, and compares primary-image coverage including truthful `null` values.

## Results

| Check | Result |
|---|---|
| Default listing identity and order | Passed |
| Price ascending identity and order | Passed |
| Price descending identity and order | Passed |
| Popular identity and order | Passed |
| Text-search identity and order | Passed |
| Active-category identity and order | Passed |
| Duplicate listing detection in proposed shape | Passed |
| Primary-image coverage comparison | Passed |
| TypeScript validation | Passed |
| Production procedure changed | No |
| Marketplace data changed | No |

The focused Vitest run passed **2 test cases and 2 tests**. TypeScript validation passed with no reported errors.

## Interpretation

The comparison indicates that the proposed staged media-selection shape is behaviorally compatible with the current public catalogue for the tested real-data cases. It does not prove that a future refactor will be faster in every production workload; query-plan inspection and representative load testing should be completed before optimizing further. The audit also does not justify changing products that lack images. Those listings must remain visible with a truthful fallback until sellers upload authentic media.

The safest next implementation step is to extract the staged query into a small server-side helper behind the existing public tRPC contract, then rerun this comparison and the full regression suite before publishing. Until that approval step, the existing production query remains active.
