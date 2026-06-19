const BASE_URL = process.env.VIKUNJA_URL ?? "";
const TOKEN = process.env.VIKUNJA_TOKEN ?? "";

if (!BASE_URL || !TOKEN) {
  console.error("VIKUNJA_URL and VIKUNJA_TOKEN environment variables are required");
  process.exit(1);
}

/**
 * Vikunja REST API를 호출하는 기본 fetch 헬퍼.
 *
 * @template T - 응답 JSON의 타입
 * @param method - HTTP 메서드 (GET, POST, PUT, DELETE 등)
 * @param path - API 경로 (e.g. `/tasks/1`)
 * @param body - 요청 바디 (선택). JSON으로 직렬화됨
 * @returns 파싱된 응답 JSON
 * @throws Vikunja API가 2xx 외 상태코드를 반환한 경우
 */
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

/**
 * 리소스를 안전하게 업데이트하는 헬퍼.
 *
 * Vikunja의 POST(업데이트) 엔드포인트는 PUT과 달리 전체 필드를 요구하는 경우가 있어,
 * 일부 필드만 보내면 나머지(description 등)가 빈 값으로 덮어써지는 버그가 발생한다.
 * 이 함수는 먼저 GET으로 기존 데이터를 가져온 뒤, patch 필드만 덮어써서 POST한다.
 *
 * @template T - 응답 JSON의 타입
 * @param path - 리소스 경로 (e.g. `/tasks/1`)
 * @param patch - 변경할 필드만 담은 객체
 * @returns 업데이트된 리소스
 */
export async function safeUpdate<T>(path: string, patch: Record<string, unknown>): Promise<T> {
  const existing = await api<Record<string, unknown>>("GET", path);
  return api<T>("POST", path, { ...existing, ...patch });
}
