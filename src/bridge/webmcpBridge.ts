import { tools } from "../registry/toolRegistry";

const authenticatedToolNames = new Set([
  "get_cart", "add_to_cart", "update_cart", "remove_from_cart", "clear_cart",
  "get_wishlist", "add_to_wishlist", "remove_from_wishlist",
  "get_orders", "get_order_details", "cancel_order", "apply_coupon", "checkout",
]);

declare global {
  interface Document { modelContext?: { registerTool(tool: { name: string; description: string; inputSchema: Record<string, unknown>; execute(input: Record<string, unknown>): Promise<unknown> }, options?: { signal?: AbortSignal }): Promise<void> }; }
}

export async function registerAgentBridgeTools() {
  if (!document.modelContext) return { registered: 0, reason: "WebMCP is unavailable in this browser." };
  const controller = new AbortController();
  let authenticated = false;
  try {
    const response = await fetch("/api/auth/session", { credentials: "same-origin" });
    const session: any = await response.json();
    authenticated = Boolean(session?.success && session?.data?.user);
  } catch {
    authenticated = false;
  }
  const visibleTools = authenticated ? tools : tools.filter((tool) => !authenticatedToolNames.has(tool.name));
  for (const tool of visibleTools) await document.modelContext.registerTool({ name: tool.name, description: tool.description, inputSchema: tool.inputSchema, execute: async (input) => tool.run(input) }, { signal: controller.signal });
  addEventListener("pagehide", () => controller.abort(), { once: true });
  return { registered: visibleTools.length, authenticated };
}

void registerAgentBridgeTools();
