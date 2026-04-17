export type HttpMethod = "GET" | "POST";

/** Credenciales ya obtenidas (ticket, cookie de sesión, API key). */
export interface TicketCredentials {
  /** Ej. header Authorization: Bearer + token */
  bearerToken?: string;
  /** Nombre de header personalizado y valor (ej. sitios legacy con X-Access-Token). */
  customHeader?: { name: string; value: string };
  /** Cabecera Cookie completa, si el sitio usa sesión por cookie. */
  cookieHeader?: string;
}

/** Login por formulario que devuelve cookie o token en body/headers. */
export interface PinFormAuthConfig {
  loginUrl: string;
  method?: HttpMethod;
  /** Nombre del campo del PIN o clave en el formulario. */
  pinFieldName: string;
  pin: string;
  /** Campos extra (usuario, RUC, etc.). */
  extraFields?: Record<string, string>;
  /** Si la sesión viene en Set-Cookie, se reutiliza en siguientes requests. */
  sessionCookieNames?: string[];
  /** Si el token viene en JSON, ruta simple (ej. data.token). */
  tokenJsonPath?: string;
}

export interface SecureSiteAccessConfig {
  baseUrl: string;
  /** Si no hay pinForm, solo se usan ticketCredentials. */
  ticket?: TicketCredentials;
  pinForm?: PinFormAuthConfig;
  /** Timeout por request en ms. */
  timeoutMs?: number;
}
