export const REDACTED = "[REDACTED]";

type HeaderValue = string | string[] | number | boolean | null | undefined;
export type HeaderMap = Record<string, HeaderValue>;

const SENSITIVE_HEADER_KEYS = new Set([
  "authorization",
  "cookie",
  "set-cookie",
  "x-auth-token",
  "x-csrf-token",
  "x-workspace",
  "proxy-authorization",
]);

const SENSITIVE_KEY_RE =
  /(^|[-_])(authorization|cookie|set-cookie|token|access_token|refresh_token|id_token|session|secret|password|passwort|username|user_name|hostname|tenant|tenantid|tenant_id|machine|machineid|machine_id|workspace|workspaceid|workspace_id|patient|kunde|customer|client|versichertennummer|kvnr|insurance|geburtsdatum|birthdate|dob|vorname|nachname|name|full.?name|email|e-mail|telefon|phone|mobile|adresse|address|strasse|straße|street|plz|postcode|zip|ort|city|iban)($|[-_])/i;

const SENSITIVE_NORMALIZED_KEY_RE =
  /(authorization|setcookie|cookie|token|accesstoken|refreshtoken|idtoken|session|secret|password|passwort|username|userid|mainuserid|hostname|tenantid|machineid|workspaceid|patient|kunde|customer|client|versichert|kvnr|insurance|geburtsdatum|birthdate|dateofbirth|dob|vorname|nachname|firstname|lastname|fullname|displayname|filename|email|telefon|phone|mobile|adresse|address|strasse|straße|street|postcode|zipcode|iban|editorname|editorid|authorname|authorid|consultantname|consultantid|createdby|changedby|updatedby|modifiedby|lookupkeyword|keywords|keyword|searchterm|query|departmentfilialeleads|filialeleads|vermittler|arzt)/i;

const QUERY_ALLOWLIST = new Set([
  "page",
  "size",
  "limit",
  "offset",
  "sort",
  "order",
  "direction",
  "lang",
  "locale",
  "view",
]);

const QUERY_SENSITIVE_KEY_RE =
  /token|auth|session|cookie|password|passwort|secret|username|user_name|hostname|tenant|machine|workspace|patient|kunde|customer|client|name|vorname|nachname|email|mail|telefon|phone|adresse|address|strasse|straße|street|geburt|birth|dob|versichert|kvnr|insurance|q|query|search|term/i;

const BEARER_RE = /\bBearer\s+[A-Za-z0-9._~+/=-]+/gi;
const JWT_RE = /\b[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g;
const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE_RE = /(?<!\w)(?:\+|00)?\d{1,3}[\s()./-]*(?:\d[\s()./-]*){6,14}\d(?!\w)/g;
const DOB_LABEL_RE = /\b(Geburtsdatum|Geb\.?|DOB|Birthdate|Date of birth)(\s*[:=]?\s*)(\d{1,2}[./-]\d{1,2}[./-]\d{2,4}|\d{4}-\d{2}-\d{2})/gi;
const INSURANCE_LABEL_RE = /\b(Versichertennummer|KVNR|Insurance(?:\s+number)?)(\s*[:=]?\s*)([A-Z]\d{9}|[A-Z0-9][A-Z0-9\s/-]{5,24})\b/gi;
const GERMAN_KVNR_RE = /\b[A-Z]\d{9}\b/g;
const XML_SENSITIVE_TAG_RE =
  /<([A-Za-z0-9_-]*(?:authorization|token|session|secret|password|passwort|patient|kunde|customer|client|versichertennummer|kvnr|insurance|geburtsdatum|birthdate|dob|vorname|nachname|name|email|telefon|phone|mobile|adresse|address|strasse|straße|street|plz|postcode|zip|ort|city)[A-Za-z0-9_-]*)(\s[^>]*)?>[\s\S]*?<\/\1>/gi;
const JSON_LIKE_SENSITIVE_VALUE_RE =
  /((?:"|')?(?:authorization|token|session|secret|password|passwort|patient|kunde|customer|client|versichertennummer|kvnr|insurance|geburtsdatum|birthdate|dob|vorname|nachname|name|email|telefon|phone|mobile|adresse|address|strasse|straße|street|plz|postcode|zip|ort|city)(?:"|')?\s*:\s*)(["'])(.*?)\2/gi;
const LABELED_NAME_RE = /\b((?:Patient|Kunde|Name|Vorname|Nachname|Full name)\s*[:=]\s*)([^,;\n\r]+)/gi;
const LABELED_ADDRESS_RE =
  /\b((?:Adresse|Address|Anschrift)\s*[:=]\s*)([^,\n\r]+(?:Straße|Strasse|str\.|Str\.|Weg|Platz|Allee|Ring|Gasse|Damm|Ufer|Chaussee)[^,\n\r]*)/gi;
const STREET_RE =
  /\b([A-ZÄÖÜ][A-Za-zÄÖÜäöüß.-]+(?:straße|strasse|str\.|Str\.|weg|platz|allee|ring|gasse|damm|ufer|chaussee)\s+\d+[a-zA-Z]?)\b/g;
const UUID_PATH_SEGMENT_RE = /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?=\/|$|[?#])/gi;
const KEYCLOAK_REALM_RE = /(\/keycloak\/auth\/realms\/)[^/?#]+/gi;
const WEBSOCKET_USER_TOPIC_RE =
  /(api-user-response\.topic\/\*\.)([^.\s]+)\.([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/gi;
const UI_LABEL_PERSON_NAME_RE = /\b[A-ZÄÖÜ][A-Za-zÄÖÜäöüß.'-]{2,}\s+[A-ZÄÖÜ][A-Za-zÄÖÜäöüß.'-]{2,}\b/g;
const UI_LABEL_LABELED_PERSON_NAME_RE =
  /\b(Kunde|Patient|Name|Vorname|Nachname)\s+([A-ZÄÖÜ][A-Za-zÄÖÜäöüß.'-]{2,}\s+[A-ZÄÖÜ][A-Za-zÄÖÜäöüß.'-]{2,})\b/gi;
const UI_LABEL_TERMS = new Set([
  "aenderung",
  "angebot",
  "app",
  "artikel",
  "aufgabe",
  "aufgaben",
  "auftrag",
  "barverkauf",
  "bearbeiten",
  "bestellung",
  "dashboard",
  "details",
  "export",
  "exportieren",
  "filter",
  "geburtsdatum",
  "kasse",
  "kunde",
  "kunden",
  "kundensuche",
  "letzte",
  "menue",
  "neuer",
  "offene",
  "rechnung",
  "speichern",
  "stammdaten",
  "status",
  "suche",
  "suchbegriff",
  "treffer",
  "versichertennummer",
  "vorgang",
  "vorgaenge",
  "wawi",
]);

export function redactHeaders(headers: HeaderMap | undefined | null): HeaderMap | undefined | null {
  if (!headers) return headers;

  const redacted: HeaderMap = {};
  for (const [key, value] of Object.entries(headers)) {
    if (SENSITIVE_HEADER_KEYS.has(key.toLowerCase()) || isSensitiveKey(key)) {
      redacted[key] = REDACTED;
      continue;
    }

    redacted[key] = redactHeaderValue(key, value);
  }

  return redacted;
}

export function redactJsonBody<T>(value: T): T | string {
  return redactJsonValue(value, new WeakSet()) as T | string;
}

export function redactQueryParams(input: string | URL | URLSearchParams): string {
  if (input instanceof URLSearchParams) {
    const params = cloneAndRedactParams(input);
    return params.toString();
  }

  const raw = String(input);
  try {
    const parsed = new URL(raw);
    parsed.search = cloneAndRedactParams(parsed.searchParams).toString();
    return parsed.toString();
  } catch {
    const [path, query = ""] = raw.split("?", 2);
    if (!query) return redactText(raw);
    const params = cloneAndRedactParams(new URLSearchParams(query));
    return `${path}?${params.toString()}`;
  }
}

export function redactUrl(input: string): string {
  return redactUrlPath(redactQueryParams(input));
}

export function redactText(input: unknown): string {
  if (input === null || input === undefined) return "";

  return String(input)
    .replace(XML_SENSITIVE_TAG_RE, (_match, tag, attrs = "") => `<${tag}${attrs}>${REDACTED}</${tag}>`)
    .replace(JSON_LIKE_SENSITIVE_VALUE_RE, (_match, prefix, quote) => `${prefix}${quote}${REDACTED}${quote}`)
    .replace(BEARER_RE, REDACTED)
    .replace(JWT_RE, REDACTED)
    .replace(EMAIL_RE, REDACTED)
    .replace(DOB_LABEL_RE, (_match, label, separator) => `${label}${separator}${REDACTED}`)
    .replace(INSURANCE_LABEL_RE, (_match, label, separator) => `${label}${separator}${REDACTED}`)
    .replace(GERMAN_KVNR_RE, REDACTED)
    .replace(LABELED_NAME_RE, (_match, label) => `${label}${REDACTED}`)
    .replace(LABELED_ADDRESS_RE, (_match, label) => `${label}${REDACTED}`)
    .replace(STREET_RE, REDACTED)
    .replace(PHONE_RE, REDACTED)
    .replace(WEBSOCKET_USER_TOPIC_RE, (_match, prefix) => `${prefix}${REDACTED}.${REDACTED}`);
}

export function redactUiLabel(input: unknown): string {
  const value = redactText(input).replace(/\s+/g, " ").trim();
  if (!value) return "";
  if (looksLikeUiDataRow(value)) return `UI-Zeile ${REDACTED}`;
  return value
    .replace(UI_LABEL_LABELED_PERSON_NAME_RE, (_match, label) => `${label} ${REDACTED}`)
    .replace(UI_LABEL_PERSON_NAME_RE, (match) => {
      const words = match.toLowerCase().split(/\s+/);
      if (words.some((word) => UI_LABEL_TERMS.has(word))) return match;
      return REDACTED;
    });
}

export function redactBodyText(input: string | null | undefined, contentType = ""): unknown {
  if (!input) return null;

  const normalizedContentType = contentType.toLowerCase();
  if (normalizedContentType.includes("json")) {
    try {
      return redactJsonBody(JSON.parse(input));
    } catch {
      return redactText(input);
    }
  }

  if (normalizedContentType.includes("x-www-form-urlencoded")) {
    return redactQueryParams(new URLSearchParams(input));
  }

  return redactText(input);
}

export function redactRecord<T>(value: T): T | string {
  return redactJsonBody(value);
}

function redactHeaderValue(key: string, value: HeaderValue): HeaderValue {
  if (Array.isArray(value)) return value.map((item) => redactHeaderScalar(key, item));
  return redactHeaderScalar(key, value);
}

function redactHeaderScalar(key: string, value: Exclude<HeaderValue, string[]>): Exclude<HeaderValue, string[]> {
  if (typeof value === "string") {
    return isUrlLikeHeader(key) ? redactUrl(value) : redactText(value);
  }
  return value;
}

function isUrlLikeHeader(key: string): boolean {
  return isUrlLikeKey(key);
}

function isUrlLikeKey(key: string): boolean {
  return ["url", ":path", "referer", "referrer", "location"].includes(key.toLowerCase());
}

function redactJsonValue(value: unknown, seen: WeakSet<object>, redactAllLeaves = false): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value !== "object") return redactAllLeaves ? redactPrimitive(value) : redactJsonPrimitive(value);

  if (seen.has(value)) return REDACTED;
  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => redactJsonValue(item, seen, redactAllLeaves));
  }

  const out: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (typeof child === "string" && isUrlLikeKey(key)) {
      out[key] = redactUrl(child);
      continue;
    }

    if (isSensitiveKey(key)) {
      out[key] = isJsonContainer(child) ? redactJsonValue(child, seen, true) : redactPrimitive(child);
      continue;
    }

    out[key] = redactJsonValue(child, seen, redactAllLeaves);
  }
  return out;
}

function redactJsonPrimitive(value: unknown): unknown {
  return typeof value === "string" ? redactText(value) : value;
}

function redactPrimitive(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === "string") return REDACTED;
  if (typeof value === "number") return 0;
  if (typeof value === "boolean") return false;
  if (typeof value === "bigint") return 0;
  return REDACTED;
}

function isJsonContainer(value: unknown): value is object {
  return value !== null && typeof value === "object";
}

function isSensitiveKey(key: string): boolean {
  if (SENSITIVE_KEY_RE.test(key)) return true;
  const normalized = key.toLowerCase().replace(/[^a-z0-9äöüß]/g, "");
  if (SENSITIVE_NORMALIZED_KEY_RE.test(normalized)) return true;
  return false;
}

function cloneAndRedactParams(params: URLSearchParams): URLSearchParams {
  const redacted = new URLSearchParams();
  for (const [key, value] of params.entries()) {
    const normalized = key.toLowerCase();
    const shouldRedact = !QUERY_ALLOWLIST.has(normalized) && (QUERY_SENSITIVE_KEY_RE.test(normalized) || value !== "");
    redacted.append(key, shouldRedact ? REDACTED : redactText(value));
  }
  return redacted;
}

function redactUrlPath(value: string): string {
  return String(value)
    .replace(KEYCLOAK_REALM_RE, (_match, prefix) => `${prefix}${REDACTED}`)
    .replace(UUID_PATH_SEGMENT_RE, `/${REDACTED}`);
}

function looksLikeUiDataRow(value: string): boolean {
  return value.length > 60
    || /^\d+\.\s+\d{3,}\b/.test(value)
    || /\bhinweisnotiz\b/i.test(value);
}
