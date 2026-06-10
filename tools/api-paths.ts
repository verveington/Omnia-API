export function normalizeObservedPath(pathname: string): string {
  return pathname
    .split("/")
    .map((segment) => {
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)) return "{uuid}";
      if (looksLikeRedactedUuidSegment(segment)) return "{uuid}";
      if (/^\d+$/.test(segment)) return "{id}";
      return segment;
    })
    .join("/");
}

function looksLikeRedactedUuidSegment(segment: string): boolean {
  if (!segment.includes("[REDACTED]") || !segment.includes("-")) return false;
  const placeholder = "00000000";
  return /^[0-9a-f-]+$/i.test(segment.replace(/\[REDACTED\]/g, placeholder));
}
