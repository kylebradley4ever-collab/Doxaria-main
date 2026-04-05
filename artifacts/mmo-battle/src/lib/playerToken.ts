const TOKEN_KEY = "mmo-player-token";

export function getPlayerToken(): string {
  let token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem(TOKEN_KEY, token);
  }
  return token;
}

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getPlayerToken();
  const { headers: existingHeaders, ...rest } = options;
  const merged = new Headers(existingHeaders);
  merged.set("X-Player-Token", token);
  if (!merged.has("Content-Type") && rest.body && typeof rest.body === "string") {
    merged.set("Content-Type", "application/json");
  }
  return fetch(url, { ...rest, headers: merged });
}
