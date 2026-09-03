# AgentBridge NoAPI WebMCP Adapter

[AgentBridge NoAPI WebMCP Adapter](https://github.com/misbah7172/AgentBridge--External-WebMCP-NoAPI-Adapter) is a website-specific, edge-injected browser integration for the independent [AgentBridge NoAPI commerce application](https://github.com/misbah7172/AgentBridge--External-WebMCP-Powered-E-Commerce-Platform-NoAPI).

## 1. Project Overview

The adapter uses a Cloudflare Worker to inject a browser bridge that manually registers structured WebMCP tools and maps them to the origin application's existing REST API.

## 2. Problem Statement

Traditional websites offer human-facing interfaces and REST APIs but are not automatically safe or intelligible to browser agents. Generic DOM automation and arbitrary request interfaces are fragile and unsafe.

## 3. Solution / Approach

The adapter defines a fixed, reviewed registry for one known application. It injects a same-origin bridge, validates known inputs, calls only fixed API paths, and requires explicit confirmation for consequential operations.

## 4. What is WebMCP?

[WebMCP](https://webmachinelearning.github.io/webmcp/) is an emerging browser API for registering structured tools that browser-mediated agents can discover and invoke. The bridge calls `document.modelContext.registerTool()` only after it is injected into the target page.

## 5. Why WebMCP?

WebMCP provides explicit actions, schemas, and descriptions instead of relying on screen coordinates or inferred DOM behavior. This makes the integration more deterministic, auditable, and compatible with browser session security.

## 6. System Architecture

```text
Agent → WebMCP-capable browser → Cloudflare edge injection
      → same-origin bridge → fixed AgentBridge REST endpoints → PostgreSQL-backed origin
```

The edge implementation is [the Worker](https://github.com/misbah7172/AgentBridge--External-WebMCP-NoAPI-Adapter/blob/main/worker/index.ts); the target's API is owned by the [origin application](https://github.com/misbah7172/AgentBridge--External-WebMCP-Powered-E-Commerce-Platform-NoAPI).

## 7. Agent ↔ Browser ↔ WebMCP Flow

1. The user signs in to AgentBridge NoAPI in the browser.
2. The Worker injects the bridge into HTML served on the configured target origin.
3. The bridge registers fixed tools with the browser's WebMCP interface.
4. An agent discovers a tool and submits schema-valid structured input.
5. The bridge makes a same-origin API call using the browser's existing session.
6. The API response is returned as structured tool output; confirmation is required before destructive or transactional actions.

## 8. WebMCP Tools

| Permission | Tools |
| --- | --- |
| Read | `search_products`, `get_product_details`, `filter_products`, `sort_products`, `get_product_recommendations`, `get_shipping_estimate`, `get_cart`, `get_wishlist`, `get_orders`, `get_order_details` |
| Write | `add_to_cart`, `update_cart`, `add_to_wishlist`, `remove_from_wishlist`, `apply_coupon` |
| Destructive | `remove_from_cart`, `clear_cart`, `cancel_order` |
| Transactional | `checkout` |

See the authoritative [tool registry](https://github.com/misbah7172/AgentBridge--External-WebMCP-NoAPI-Adapter/blob/main/src/registry/toolRegistry.ts).

## 9. Tool Discovery

Registration is feature-detected at runtime. If `document.modelContext` is unavailable, the bridge registers no tools and reports that WebMCP is unavailable; the human website continues to work normally.

## 10. Tool Schemas & Contracts

Every tool has a JSON Schema object with named properties, required fields, and `additionalProperties: false`. Tool-to-endpoint mappings are fixed in the [registry](https://github.com/misbah7172/AgentBridge--External-WebMCP-NoAPI-Adapter/blob/main/src/registry/toolRegistry.ts) and the origin contract is exposed at [`/openapi.json`](http://localhost:3000/openapi.json) during local development.

## 11. Agent Interaction / User Journeys

Example: an agent searches for a product, fetches its details, adds the selected variant to the authenticated cart, obtains shipping information, then requests checkout. The first checkout call returns `requiresConfirmation: true`; a second call with `confirmed: true` creates the mock order.

## 12. State-Aware Tool Exposure

The current implementation registers the complete fixed tool set when WebMCP is available. The origin API remains state-aware: unauthenticated requests fail safely, and cart, wishlist, and order data is scoped to the active browser session.

## 13. Error Handling & Safety

The API executor accepts only `/api/` paths, normalizes JSON responses, and uses `credentials: "same-origin"`. The origin returns consistent `{ success, data }` or `{ success, error }` envelopes. No tool reads cookies, requests credentials, or permits arbitrary headers, methods, URLs, or request bodies.

## 14. Multi-Step Tool Execution

Tool calls are intentionally small and composable. The agent must discover products before selecting one; checkout is delegated to the origin's atomic transaction, which validates stock, coupon rules, totals, and session ownership.

## 15. Failure & Recovery Handling

Schema violations and origin errors return structured failures. Confirmation-required actions make no API mutation until confirmed. The agent can refresh read tools after a failure; the adapter does not silently retry writes.

## 16. Testing Strategy

The adapter is type-checked. Unit tests for schemas, mapping correctness, confirmation gates, and error normalization, plus browser integration tests, are planned before production deployment.

## 17. Deterministic Tests

Planned deterministic checks include endpoint construction, invalid input rejection, unauthorized responses, confirmation enforcement, and non-exposure of arbitrary request capability.

## 18. LLM / Probabilistic Evaluations

Planned evaluations will measure whether an agent selects the correct tool, supplies valid inputs, seeks confirmation at the correct boundary, and recovers from structured errors. Results are not yet available.

## 19. Browser / E2E Evaluations

Planned E2E flow: Worker injects bridge → browser discovers tools → agent searches products → authenticated cart changes → storefront reflects state → checkout pauses for confirmation → order appears in origin UI.

## 20. WebMCP Inspector Validation

Planned validation will use a WebMCP-capable browser inspector to confirm 19 registrations, schema visibility, tool invocation, and registration cleanup on `pagehide`.

## 21. Evaluation Metrics

Planned metrics: registration success rate, valid tool-call rate, tool-selection accuracy, confirmation compliance, API success rate, task completion rate, and recovery success rate.

## 22. Results / Benchmarks

No E2E benchmark has been run. The implementation has passed `npx tsc --noEmit`; future results will include environment, browser version, workload, and methodology.

## 23. Demo

Start the [origin application](https://github.com/misbah7172/AgentBridge--External-WebMCP-Powered-E-Commerce-Platform-NoAPI#29-running-the-application), route the Worker on its hostname, sign in, then perform search, cart, and confirmation-protected checkout as described in [Section 7](#7-agent--browser--webmcp-flow).

## 24. Screenshots / Demo GIF / Video

Demo media has not yet been published. This section will link to an inspector recording and end-to-end browser walkthrough when available.

## 25. Tech Stack

Cloudflare Workers, HTMLRewriter, TypeScript, native `fetch`, Zod, Vitest, and the browser's WebMCP API. See [package.json](https://github.com/misbah7172/AgentBridge--External-WebMCP-NoAPI-Adapter/blob/main/package.json).

## 26. Project Structure

| Area | Responsibility |
| --- | --- |
| [`src/bridge`](https://github.com/misbah7172/AgentBridge--External-WebMCP-NoAPI-Adapter/tree/main/src/bridge) | Browser-side registration lifecycle |
| [`src/config`](https://github.com/misbah7172/AgentBridge--External-WebMCP-NoAPI-Adapter/tree/main/src/config) | Fixed origin endpoint contract |
| [`src/executors`](https://github.com/misbah7172/AgentBridge--External-WebMCP-NoAPI-Adapter/tree/main/src/executors) | Same-origin API execution |
| [`src/registry`](https://github.com/misbah7172/AgentBridge--External-WebMCP-NoAPI-Adapter/tree/main/src/registry) | Tool schemas, descriptions, permissions, and mappings |
| [`src/security`](https://github.com/misbah7172/AgentBridge--External-WebMCP-NoAPI-Adapter/tree/main/src/security) | Confirmation rules |
| [`worker`](https://github.com/misbah7172/AgentBridge--External-WebMCP-NoAPI-Adapter/tree/main/worker) | Proxying and HTML bridge injection |

## 27. Setup & Installation

```bash
git clone https://github.com/misbah7172/AgentBridge--External-WebMCP-NoAPI-Adapter.git
cd AgentBridge--External-WebMCP-NoAPI-Adapter
npm install
copy .env.example .dev.vars
```

## 28. Environment Variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `TARGET_ORIGIN` | Yes | Exact public origin where the adapter may inject |
| `ORIGIN_UPSTREAM` | Production | Upstream origin behind the Worker, preventing proxy recursion |

Use the committed [environment template](https://github.com/misbah7172/AgentBridge--External-WebMCP-NoAPI-Adapter/blob/main/.env.example). Do not commit `.dev.vars`.

## 29. Running the Application

```bash
npm run dev
```

For local development set both environment values to `http://localhost:3000`, then visit the Wrangler development URL shown in the terminal.

## 30. Running Tests

```bash
npx tsc --noEmit
npm test
```

Type-checking is verified. `npm test` is reserved for the planned Vitest suite.

## 31. Running WebMCP Evaluations

After deployment to a Worker route on the target hostname, use a WebMCP-capable browser to inspect registrations, then execute the E2E scenario in [Section 19](#19-browser--e2e-evaluations). Do not treat a separate `workers.dev` hostname as a valid authenticated-session evaluation.

## 32. Reproducibility

Use the committed [lockfile](https://github.com/misbah7172/AgentBridge--External-WebMCP-NoAPI-Adapter/blob/main/package-lock.json), [Worker configuration](https://github.com/misbah7172/AgentBridge--External-WebMCP-NoAPI-Adapter/blob/main/wrangler.toml), and fixed [tool registry](https://github.com/misbah7172/AgentBridge--External-WebMCP-NoAPI-Adapter/blob/main/src/registry/toolRegistry.ts). Record the browser and WebMCP implementation version for evaluation runs.

## 33. Security Considerations

- The Worker rejects requests outside the exact `TARGET_ORIGIN`.
- The adapter is AgentBridge-specific; it never crawls arbitrary sites or generates tools dynamically.
- Same-origin browser credentials remain inside the browser.
- Checkout, cancellation, cart clearing, and cart-item removal require confirmation.
- The adapter must be deployed over HTTPS and reviewed alongside the origin's CSP policy.

## 34. Limitations

WebMCP availability depends on browser support. The Worker has not been deployed to a production Cloudflare route, browser E2E tests are not yet automated, and no payment provider is supported because the origin intentionally uses mock checkout.

## 35. Future Improvements

Add Zod execution validation at every bridge boundary, Vitest coverage, Playwright E2E tests, browser inspector automation, structured privacy-safe logs, deployment templates, and explicit state-based registration policies.

## 36. Hackathon Requirements / How the Project Addresses Them

The project demonstrates a production-oriented separation of concerns: the [origin website](https://github.com/misbah7172/AgentBridge--External-WebMCP-Powered-E-Commerce-Platform-NoAPI) stays WebMCP-unaware, while a separate, website-specific adapter injects manually defined browser tools. It includes fixed schemas, same-origin session handling, confirmation gates, no arbitrary HTTP tool, and an edge-injection architecture.

## 37. References

- [WebMCP specification](https://webmachinelearning.github.io/webmcp/)
- [WebMCP reference implementation](https://github.com/webmachinelearning/webmcp)
- [Cloudflare Workers documentation](https://developers.cloudflare.com/workers/)
- [Cloudflare HTMLRewriter documentation](https://developers.cloudflare.com/workers/runtime-apis/html-rewriter/)
- [Origin application repository](https://github.com/misbah7172/AgentBridge--External-WebMCP-Powered-E-Commerce-Platform-NoAPI)

## 38. License

Released under the [MIT License](https://github.com/misbah7172/AgentBridge--External-WebMCP-NoAPI-Adapter/blob/main/LICENSE).
