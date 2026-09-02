# AgentBridge NoAPI WebMCP Adapter

This is a separate, website-specific compatibility layer for AgentBridge NoAPI. It injects a bridge at the edge and manually maps fixed WebMCP tools to the origin application's REST API. It is not a generic web controller and exposes no arbitrary HTTP tool.

Set `TARGET_ORIGIN` to the exact AgentBridge NoAPI origin and attach the Worker to that hostname. Set `ORIGIN_UPSTREAM` to the application origin when proxying through the Worker. Browser requests remain same-origin, so HTTP-only session cookies are used without exposing them to tools or models.

`checkout`, `clear_cart`, `remove_from_cart`, and `cancel_order` return a confirmation requirement until invoked with `confirmed: true`.
