# AgentBridge NoAPI WebMCP Adapter

## Project Overview

This is a standalone, website-specific **UI-automation-only** WebMCP adapter for the [AgentBridge NoAPI storefront](https://github.com/misbah7172/AgentBridge--External-WebMCP-Powered-E-Commerce-Platform-NoAPI). It is deployed independently as a [Cloudflare Worker](https://agentbridge-webmcp-noapi-adapter.agentbridge-noapi.workers.dev/).

## Problem Statement and Solution

A website can have a usable human interface without publishing an API for agents. This adapter adds an agent-facing WebMCP tool layer without changing the selected website into an API provider. The Worker proxies HTML from the storefront and injects a same-origin browser bridge. The bridge navigates pages, fills visible form controls, and clicks visible controls; it never calls `/api/*` or any other application data endpoint.

## Architecture and Flow

```text
Agent → WebMCP-capable browser → Worker public URL → injected DOM bridge
                                      │                     │
                                      └── HTML proxy ────────┘
                                                    ↓
                                      Render-hosted storefront UI
                                                    ↓
                                              server actions → PostgreSQL
```

1. Open the [Worker URL](https://agentbridge-webmcp-noapi-adapter.agentbridge-noapi.workers.dev/), not the direct [Render origin](https://agentbridge-external-webmcp-powered-e.onrender.com/).
2. The [Worker](https://github.com/misbah7172/AgentBridge--External-WebMCP-NoAPI-Adapter/blob/main/worker/index.ts) fetches the selected upstream HTML and inserts `/__agentbridge/webmcp-bridge.js`.
3. The injected bridge registers WebMCP tools through `document.modelContext`.
4. A tool performs a constrained UI operation against `data-agentbridge-*` hooks supplied by the rendered site.
5. The storefront’s normal server action and session protections perform the business operation.

`TARGET_ORIGIN` is the Worker’s public hostname and `ORIGIN_UPSTREAM` is the selected website. In this deployed demonstration they are:

```env
TARGET_ORIGIN=https://agentbridge-webmcp-noapi-adapter.agentbridge-noapi.workers.dev
ORIGIN_UPSTREAM=https://agentbridge-external-webmcp-powered-e.onrender.com
```

The Worker is intentionally used as the public demonstration origin while custom-domain registration is pending. Do not open the Render URL when validating WebMCP: browser cookies and injected code are scoped to the Worker URL.

## What and Why WebMCP

[WebMCP](https://webmachinelearning.github.io/webmcp/) lets a browser page register structured, named tools for browser-mediated agents. It replaces unconstrained automation with reviewed names, JSON schemas, visible-UI preconditions, and explicit confirmation for consequential actions.

## Tools, Discovery, and Contracts

The bridge registers public catalog-navigation tools when the rendered header is anonymous. It exposes cart, wishlist, order, coupon, and checkout tools only when `[data-agentbridge-session="authenticated"]` exists in the current UI. Tool names and the authentication boundary are reviewable in the [registry inventory](https://github.com/misbah7172/AgentBridge--External-WebMCP-NoAPI-Adapter/blob/main/src/registry/toolRegistry.ts); runtime schemas and DOM selectors are in the [Worker bridge](https://github.com/misbah7172/AgentBridge--External-WebMCP-NoAPI-Adapter/blob/main/worker/index.ts).

The 19 registered tool contracts cover catalog navigation, cart and wishlist actions, orders, coupons, and mock checkout. Each accepts only documented JSON fields with `additionalProperties: false`. Tools return a typed UI-action result or a clear `UI_ELEMENT_NOT_FOUND`, `UI_FIELD_NOT_FOUND`, or `UI_ACTION_UNAVAILABLE` error.

## State, Safety, and Recovery

Tool visibility follows visible session state instead of probing a REST session endpoint. Destructive cart operations and checkout require `confirmed: true`. A tool cannot issue arbitrary network requests, headers, selectors supplied by an agent, or direct database commands. If a required page is not open, the result identifies the missing visible UI; the agent can navigate with the appropriate tool and retry. Multi-step journeys therefore remain explicit: search → open product → add to cart → open checkout → confirm checkout.

## Testing, Evaluation, and Demo

Run static verification with `pnpm exec tsc --noEmit`. Validate browser behavior by opening the [Worker URL](https://agentbridge-webmcp-noapi-adapter.agentbridge-noapi.workers.dev/), checking injected bridge registration in a WebMCP-capable browser, then exercising catalog navigation and an authenticated cart journey. Deterministic checks should assert tool visibility, schema acceptance, confirmation gates, and DOM-hook failures; probabilistic evaluations should measure agent completion rate and recovery quality. Record tool-discovery count, completion rate, confirmation compliance, and UI-selector failure rate for benchmarks.

## Setup and Running

```bash
pnpm install
pnpm exec wrangler dev
pnpm exec tsc --noEmit
```

Configure the values above in [wrangler.toml](https://github.com/misbah7172/AgentBridge--External-WebMCP-NoAPI-Adapter/blob/main/wrangler.toml) or Worker environment variables. Deploy with `pnpm deploy` after authenticating Wrangler.

## Security, Limitations, and Future Work

The adapter does not expose website APIs and cannot bypass the site’s normal authentication or business rules. It depends on stable visible UI hooks and must be reviewed whenever the selected website changes. Future work includes automated E2E WebMCP inspector checks, richer accessible selectors, durable tool-result observation after navigation, and a configurable adapter-generation workflow for additional selected websites.

## License

MIT. See [LICENSE](https://github.com/misbah7172/AgentBridge--External-WebMCP-NoAPI-Adapter/blob/main/LICENSE).
