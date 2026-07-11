// Garante que a URL começa com https:// mesmo se a variável de ambiente estiver mal formatada
const rawUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const API_URL = rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`;

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(body?.detail ?? `Erro ${response.status}`, response.status);
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
};

export function absoluteUrl(path: string): string {
  return `${API_URL}${path}`;
}
