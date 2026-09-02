# AgentBridge NoAPI WebMCP Adapter

AgentBridge NoAPI WebMCP Adapter is a separate, website-specific compatibility layer for the AgentBridge NoAPI commerce application. A Cloudflare Worker proxies the configured website origin, injects a small browser bridge into HTML responses, and the bridge registers manually authored WebMCP tools in the page context.

The adapter does not modify the AgentBridge NoAPI source repository. It is not a universal website controller, does not crawl or infer arbitrary actions, and does not expose an arbitrary HTTP request tool.

## Architecture

```text
Browser agent
     |
     v
WebMCP-capable browser
     |
     v
Cloudflare Worker and HTML injection
     |
     v
Injected AgentBridge bridge
     |
     v
Fixed AgentBridge NoAPI REST API mappings
     |
     v
AgentBridge NoAPI application
```

The browser bridge executes at the same origin as the target application. Consequently, authenticated API calls use the browser's existing HTTP-only session cookie without exposing passwords, tokens, or cookie values to a model.

## Tool Set

The registry contains 19 manually designed tools:

| Category | Tools |
| --- | --- |
| Read | `search_products`, `get_product_details`, `filter_products`, `sort_products`, `get_product_recommendations`, `get_shipping_estimate`, `get_cart`, `get_wishlist`, `get_orders`, `get_order_details` |
| Write | `add_to_cart`, `update_cart`, `add_to_wishlist`, `remove_from_wishlist`, `apply_coupon` |
| Destructive | `remove_from_cart`, `clear_cart`, `cancel_order` |
| Transactional | `checkout` |

Destructive and transactional operations do not run on the initial invocation. They return a structured confirmation requirement and execute only when called again with `confirmed: true`.

## Security Model

- The Worker accepts only the exact configured `TARGET_ORIGIN`.
- Tool handlers call only fixed `/api/...` paths defined for AgentBridge NoAPI.
- The adapter contains no general-purpose URL, method, header, or body tool.
- Browser requests use `credentials: "same-origin"` and never read or return cookies.
- The adapter does not bypass access controls, CAPTCHA, anti-bot systems, or application authorization.
- Tool names, input schemas, permissions, and confirmation rules are explicit and reviewable.

## Project Structure

```text
src/
  bridge/        Browser-side WebMCP registration
  config/        Fixed AgentBridge endpoint contract
  executors/     Same-origin API execution
  registry/      Manual tool definitions
  security/      Permission and confirmation rules
worker/          Cloudflare Worker and HTML injection
```

## Local Development

### Prerequisites

- Node.js 20 or later
- A running AgentBridge NoAPI application
- Cloudflare account and Wrangler authentication for deployment

### Setup

```bash
npm install
copy .env.example .dev.vars
```

Set the target application values in `.dev.vars`:

```dotenv
TARGET_ORIGIN=http://localhost:3000
ORIGIN_UPSTREAM=http://localhost:3000
```

Start the Worker:

```bash
npm run dev
```

## Production Deployment

1. Deploy AgentBridge NoAPI to its production origin.
2. Configure `TARGET_ORIGIN` to the public AgentBridge hostname.
3. Configure `ORIGIN_UPSTREAM` to the non-Worker upstream application origin.
4. Attach the Worker to a Cloudflare route for the AgentBridge hostname.
5. Deploy the Worker:

```bash
npm run deploy
```

The Worker must be routed on the target application's hostname rather than used solely from a separate `workers.dev` hostname. This preserves the browser's same-origin session context for authenticated actions.

## Verification

```bash
npx tsc --noEmit
npm test
```

For end-to-end validation, sign in to AgentBridge NoAPI through the Worker-routed hostname, ensure the browser exposes WebMCP support, and verify that product search, cart changes, and confirmation-protected checkout operate against the original application's REST API.

## Relationship to the Origin Application

This repository owns the WebMCP-specific implementation. The origin application's repository owns the user experience, REST API, and data model. Neither project imports the other, and they can be developed, deployed, and maintained independently.
