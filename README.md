# AgentBridge NoAPI WebMCP Adapter

[AgentBridge NoAPI WebMCP Adapter](https://github.com/misbah7172/AgentBridge--External-WebMCP-NoAPI-Adapter) is a website-specific, edge-injected browser integration for the independent [AgentBridge NoAPI commerce application](https://github.com/misbah7172/AgentBridge--External-WebMCP-Powered-E-Commerce-Platform-NoAPI).

## 1. Project Overview

The adapter uses a Cloudflare Worker to inject a browser bridge that manually registers structured WebMCP tools and maps them to the origin application's existing REST API.

## 2. Problem Statement

Traditional websites offer human-facing interfaces and REST APIs but are not automatically safe or intelligible to browser agents. Generic DOM automation and arbitrary request interfaces are fragile and unsafe.

## 3. Solution / Approach

The adapter defines a fixed, reviewed registry for one known application. The [Cloudflare Worker](https://github.com/misbah7172/AgentBridge--External-WebMCP-NoAPI-Adapter/blob/main/worker/index.ts) verifies the configured hostname, proxies the target response, injects a bridge from the same hostname, and exposes only mapped AgentBridge API operations. The typed [registry source](https://github.com/misbah7172/AgentBridge--External-WebMCP-NoAPI-Adapter/blob/main/src/registry/toolRegistry.ts), [API executor](https://github.com/misbah7172/AgentBridge--External-WebMCP-NoAPI-Adapter/blob/main/src/executors/apiExecutor.ts), and [confirmation policy](https://github.com/misbah7172/AgentBridge--External-WebMCP-NoAPI-Adapter/blob/main/src/security/permissions.ts) make those boundaries reviewable.

## 4. What is WebMCP?

[WebMCP](https://webmachinelearning.github.io/webmcp/) is an emerging browser API for registering structured tools that browser-mediated agents can discover and invoke. The bridge calls `document.modelContext.registerTool()` only after it is injected into the target page.

## 5. Why WebMCP?

WebMCP provides explicit actions, schemas, and descriptions instead of relying on screen coordinates or inferred DOM behavior. This makes the integration more deterministic, auditable, and compatible with browser session security.

## 6. System Architecture

```text
                         public AgentBridge hostname
┌─────────┐         ┌─────────────────────┐         ┌───────────────────────┐
│  Agent  │ ──────► │ WebMCP-capable      │ ──────► │ Cloudflare Worker     │
│         │ tools   │ browser             │ request │ validates target      │
└─────────┘         └─────────┬───────────┘         └───────────┬───────────┘
                              │                                 │ proxy HTML
                              │ loads injected bridge            ▼
                              │                      ┌───────────────────────┐
                              └────────────────────► │ AgentBridge NoAPI     │
                                    same-origin API   │ Next.js REST API      │
                                    + session cookie  └───────────┬───────────┘
                                                                    ▼
                                                               PostgreSQL
```

The connection is configured through [`TARGET_ORIGIN` and `ORIGIN_UPSTREAM`](https://github.com/misbah7172/AgentBridge--External-WebMCP-NoAPI-Adapter/blob/main/.env.example). The Worker code performs the [origin comparison, upstream proxy, HTML injection, and bridge serving](https://github.com/misbah7172/AgentBridge--External-WebMCP-NoAPI-Adapter/blob/main/worker/index.ts). The destination contract is owned by the [origin application](https://github.com/misbah7172/AgentBridge--External-WebMCP-Powered-E-Commerce-Platform-NoAPI), including its [product search route](https://github.com/misbah7172/AgentBridge--External-WebMCP-Powered-E-Commerce-Platform-NoAPI/blob/main/app/api/products/search/route.ts), [cart routes](https://github.com/misbah7172/AgentBridge--External-WebMCP-Powered-E-Commerce-Platform-NoAPI/tree/main/app/api/cart), and [checkout route](https://github.com/misbah7172/AgentBridge--External-WebMCP-Powered-E-Commerce-Platform-NoAPI/blob/main/app/api/checkout/route.ts).

### Current Demonstration Endpoint

Use the deployed Worker URL for the adapter demonstration: [https://agentbridge-webmcp-noapi-adapter.agentbridge-noapi.workers.dev/](https://agentbridge-webmcp-noapi-adapter.agentbridge-noapi.workers.dev/). It proxies the Render-hosted origin at [https://agentbridge-external-webmcp-powered-e.onrender.com/](https://agentbridge-external-webmcp-powered-e.onrender.com/) and injects the bridge into the proxied HTML response.

The Worker is not yet attached to a registered custom application domain because domain registration and route configuration are pending. Therefore, do **not** use the direct Render URL for the WebMCP demonstration; open the Worker URL above, sign in there, and keep that hostname open while using the browser agent. A session created directly on the Render hostname is a separate browser-origin session.

## 7. Agent ↔ Browser ↔ WebMCP Flow

```text
1. Browser requests https://shop.example/path
2. Cloudflare route invokes Worker
3. Worker requires request origin === TARGET_ORIGIN
4. Worker fetches ORIGIN_UPSTREAM/path and injects /__agentbridge/webmcp-bridge.js
5. Browser loads that bridge from https://shop.example (not a third-party origin)
6. Bridge calls document.modelContext.registerTool(...)
7. Agent discovers a registered tool and submits structured input
8. Tool executes fetch('/api/...', { credentials: 'same-origin' })
9. AgentBridge validates session and request, then returns structured JSON
10. Bridge returns that result to the browser agent
```

The key security property is that the bridge uses a relative API URL on the authenticated application hostname. The browser attaches the HTTP-only session cookie to the origin request; neither the Worker bridge nor the agent reads the cookie. The runtime bridge is served by the [Worker](https://github.com/misbah7172/AgentBridge--External-WebMCP-NoAPI-Adapter/blob/main/worker/index.ts); the typed registration reference is [webmcpBridge.ts](https://github.com/misbah7172/AgentBridge--External-WebMCP-NoAPI-Adapter/blob/main/src/bridge/webmcpBridge.ts).

## 8. WebMCP Tools

| Permission | Tools |
| --- | --- |
| Read | `search_products`, `get_product_details`, `filter_products`, `sort_products`, `get_product_recommendations`, `get_shipping_estimate`, `get_cart`, `get_wishlist`, `get_orders`, `get_order_details` |
| Write | `add_to_cart`, `update_cart`, `add_to_wishlist`, `remove_from_wishlist`, `apply_coupon` |
| Destructive | `remove_from_cart`, `clear_cart`, `cancel_order` |
| Transactional | `checkout` |

See the typed [tool registry](https://github.com/misbah7172/AgentBridge--External-WebMCP-NoAPI-Adapter/blob/main/src/registry/toolRegistry.ts), the runtime [injected bridge in the Worker](https://github.com/misbah7172/AgentBridge--External-WebMCP-NoAPI-Adapter/blob/main/worker/index.ts), and the origin's [OpenAPI route](https://github.com/misbah7172/AgentBridge--External-WebMCP-Powered-E-Commerce-Platform-NoAPI/blob/main/app/openapi.json/route.ts).

## 9. Tool Discovery

Registration is feature-detected at runtime. If `document.modelContext` is unavailable, the bridge registers no tools; the human website continues to work normally. The registration lifecycle is implemented in the typed [bridge module](https://github.com/misbah7172/AgentBridge--External-WebMCP-NoAPI-Adapter/blob/main/src/bridge/webmcpBridge.ts) and the injected runtime equivalent in the [Worker](https://github.com/misbah7172/AgentBridge--External-WebMCP-NoAPI-Adapter/blob/main/worker/index.ts).

## 10. Tool Schemas & Contracts

Every tool has a JSON Schema object with named properties, required fields, and `additionalProperties: false`. Tool-to-endpoint mappings are fixed in the [registry](https://github.com/misbah7172/AgentBridge--External-WebMCP-NoAPI-Adapter/blob/main/src/registry/toolRegistry.ts); endpoint execution is constrained by the [API executor](https://github.com/misbah7172/AgentBridge--External-WebMCP-NoAPI-Adapter/blob/main/src/executors/apiExecutor.ts). The origin contract is exposed by the [OpenAPI route](https://github.com/misbah7172/AgentBridge--External-WebMCP-Powered-E-Commerce-Platform-NoAPI/blob/main/app/openapi.json/route.ts), available locally at [`http://localhost:3000/openapi.json`](http://localhost:3000/openapi.json).

## 11. Agent Interaction / User Journeys

Example: an agent searches for a product, fetches its details, adds the selected variant to the authenticated cart, obtains shipping information, then requests checkout. The first checkout call returns `requiresConfirmation: true`; a second call with `confirmed: true` creates the mock order.

## 12. State-Aware Tool Exposure

The bridge checks [`/api/auth/session`](https://github.com/misbah7172/AgentBridge--External-WebMCP-Powered-E-Commerce-Platform-NoAPI/blob/main/app/api/auth/session/route.ts) before registration. Signed-out pages expose only the six public discovery tools: product search, product details, filtering, sorting, recommendations, and shipping estimates. After a user signs in and navigates or refreshes, the bridge registers the remaining 13 session-bound cart, wishlist, order, coupon, and checkout tools. The origin API independently enforces the same authorization boundary.

## 13. Error Handling & Safety

The [API executor](https://github.com/misbah7172/AgentBridge--External-WebMCP-NoAPI-Adapter/blob/main/src/executors/apiExecutor.ts) accepts only `/api/` paths, normalizes JSON responses, and uses `credentials: "same-origin"`. The [origin response helper](https://github.com/misbah7172/AgentBridge--External-WebMCP-Powered-E-Commerce-Platform-NoAPI/blob/main/lib/api-response.ts) returns consistent `{ success, data }` or `{ success, error }` envelopes. No tool reads cookies, requests credentials, or permits arbitrary headers, methods, URLs, or request bodies.

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

Planned validation will use a WebMCP-capable browser inspector to confirm six signed-out registrations, 19 signed-in registrations, schema visibility, tool invocation, and registration cleanup on `pagehide`.

## 21. Evaluation Metrics

Planned metrics: registration success rate, valid tool-call rate, tool-selection accuracy, confirmation compliance, API success rate, task completion rate, and recovery success rate.

## 22. Results / Benchmarks

No E2E benchmark has been run. The implementation has passed `npx tsc --noEmit`; future results will include environment, browser version, workload, and methodology.

## 23. Demo

Open the [deployed Worker endpoint](https://agentbridge-webmcp-noapi-adapter.agentbridge-noapi.workers.dev/) rather than the direct [Render origin](https://agentbridge-external-webmcp-powered-e.onrender.com/). Sign in through the Worker endpoint using the [seeded demonstration account](https://github.com/misbah7172/AgentBridge--External-WebMCP-Powered-E-Commerce-Platform-NoAPI#23-demo), then perform search, cart, and confirmation-protected checkout as described in [Section 7](#7-agent--browser--webmcp-flow).

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

For the current `workers.dev` demonstration deployment, use:

```dotenv
TARGET_ORIGIN=https://agentbridge-webmcp-noapi-adapter.agentbridge-noapi.workers.dev
ORIGIN_UPSTREAM=https://agentbridge-external-webmcp-powered-e.onrender.com
```

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
