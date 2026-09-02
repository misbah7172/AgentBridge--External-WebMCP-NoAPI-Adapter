import { tools } from "../registry/toolRegistry";

declare global {
  interface Document { modelContext?: { registerTool(tool: { name: string; description: string; inputSchema: Record<string, unknown>; execute(input: Record<string, unknown>): Promise<unknown> }, options?: { signal?: AbortSignal }): Promise<void> }; }
}

export async function registerAgentBridgeTools() {
  if (!document.modelContext) return { registered: 0, reason: "WebMCP is unavailable in this browser." };
  const controller = new AbortController();
  for (const tool of tools) await document.modelContext.registerTool({ name: tool.name, description: tool.description, inputSchema: tool.inputSchema, execute: async (input) => tool.run(input) }, { signal: controller.signal });
  addEventListener("pagehide", () => controller.abort(), { once: true });
  return { registered: tools.length };
}

void registerAgentBridgeTools();
