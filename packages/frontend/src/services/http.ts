const BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "";

type HttpOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

export class HttpError extends Error {
  constructor(
    message: string,
    public status?: number,
    public payload?: unknown,
  ) {
    super(message);
  }
}

export async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function http<T>(path: string, options: HttpOptions = {}): Promise<T> {
  const url = `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

  const res = await fetch(url, {
    method: options.method ?? "GET",
    headers: {
      "content-type": "application/json",
      ...(options.headers ?? {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  });

  if (!res.ok) {
    // tenta extrair mensagem segura
    let detail = "";
    try {
      const data = (await res.json()) as unknown;
      if (
        data &&
        typeof data === "object" &&
        "message" in data &&
        typeof (data as { message: unknown }).message === "string"
      ) {
        detail = `: ${(data as { message: string }).message}`;
      }
    } catch {
      // ignore parse error
    }
    throw new Error(`HTTP ${res.status}${detail}`);
  }

  // pode não haver body (ex: 204)
  if (res.status === 204) return undefined as T;

  const json = (await res.json()) as unknown;
  return json as T;
}
