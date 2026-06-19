const BASE_URL = process.env.VIKUNJA_URL ?? "";
const TOKEN = process.env.VIKUNJA_TOKEN ?? "";

if (!BASE_URL || !TOKEN) {
  console.error("VIKUNJA_URL and VIKUNJA_TOKEN environment variables are required");
  process.exit(1);
}

export async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Vikunja API error ${res.status}: ${text}`);
  }

  const text = await res.text();
  return text ? (JSON.parse(text) as T) : ({} as T);
}

// GET 먼저 조회 후 변경 필드만 덮어써서 POST — description 등 미포함 필드 보존
export async function safeUpdate<T>(path: string, patch: Record<string, unknown>): Promise<T> {
  const existing = await api<Record<string, unknown>>("GET", path);
  return api<T>("POST", path, { ...existing, ...patch });
}
