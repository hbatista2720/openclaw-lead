import type { PinFormAuthConfig, TicketCredentials } from "./types.js";

function joinCookies(setCookieHeaders: string[], names: string[]): string {
  const wanted = new Set(names.map((n) => n.toLowerCase()));
  const parts: string[] = [];
  for (const line of setCookieHeaders) {
    const name = line.split("=")[0]?.trim();
    if (name && wanted.has(name.toLowerCase())) {
      const value = line.split(";")[0];
      if (value) parts.push(value);
    }
  }
  return parts.join("; ");
}

function getByPath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in acc) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

/**
 * Aplica ticket estático (Bearer, header custom o Cookie) a los headers de salida.
 */
export function headersFromTicket(t: TicketCredentials): HeadersInit {
  const h: Record<string, string> = {};
  if (t.bearerToken) h.Authorization = `Bearer ${t.bearerToken}`;
  if (t.customHeader) h[t.customHeader.name] = t.customHeader.value;
  if (t.cookieHeader) h.Cookie = t.cookieHeader;
  return h;
}

/**
 * Intenta obtener sesión haciendo POST al formulario de PIN (o credencial única).
 * Devuelve headers Cookie y/o Bearer si tokenJsonPath está definido.
 */
export async function loginWithPinForm(
  cfg: PinFormAuthConfig,
  timeoutMs: number,
  fetchImpl: typeof fetch = fetch
): Promise<TicketCredentials> {
  const body = new URLSearchParams();
  body.set(cfg.pinFieldName, cfg.pin);
  if (cfg.extraFields) {
    for (const [k, v] of Object.entries(cfg.extraFields)) body.set(k, v);
  }

  const method = cfg.method ?? "POST";
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  const res = await fetchImpl(cfg.loginUrl, {
    method,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json, text/html;q=0.9, */*;q=0.8",
    },
    body: method === "POST" ? body.toString() : undefined,
    redirect: "manual",
    signal: controller.signal,
  });
  clearTimeout(id);

  const setCookie = res.headers.getSetCookie?.() ?? [];
  const legacy = res.headers.get("set-cookie");
  const allSetCookies =
    setCookie.length > 0 ? setCookie : legacy ? [legacy] : [];

  let cookieHeader = "";
  if (cfg.sessionCookieNames?.length) {
    cookieHeader = joinCookies(allSetCookies, cfg.sessionCookieNames);
  } else if (allSetCookies.length) {
    cookieHeader = allSetCookies
      .map((c) => c.split(";")[0])
      .filter(Boolean)
      .join("; ");
  }

  let bearerToken: string | undefined;
  if (cfg.tokenJsonPath) {
    const ct = res.headers.get("content-type") ?? "";
    if (ct.includes("application/json")) {
      const json = (await res.json()) as unknown;
      const token = getByPath(json, cfg.tokenJsonPath);
      if (typeof token === "string") bearerToken = token;
    }
  }

  return { cookieHeader: cookieHeader || undefined, bearerToken };
}
