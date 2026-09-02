type RequestSpec = { method: "GET" | "POST" | "PATCH" | "DELETE"; path: string; query?: Record<string, unknown>; body?: unknown };

function cleanQuery(query: Record<string, unknown> = {}) { const out = new URLSearchParams(); for (const [key, value] of Object.entries(query)) if (value !== undefined && value !== null && value !== "") out.set(key, String(value)); return out; }

export async function executeKnownApi(spec: RequestSpec) {
  if (!spec.path.startsWith("/api/")) throw new Error("Adapter rejected a non-API endpoint");
  const query = cleanQuery(spec.query); const url = `${spec.path}${query.size ? `?${query}` : ""}`;
  const response = await fetch(url, { method: spec.method, credentials: "same-origin", headers: spec.body ? { "content-type": "application/json" } : undefined, body: spec.body ? JSON.stringify(spec.body) : undefined });
  const payload = await response.json().catch(() => ({ success: false, error: { code: "INVALID_RESPONSE", message: "The origin returned an invalid response." } }));
  return payload;
}
