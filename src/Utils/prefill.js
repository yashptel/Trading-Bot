export function decodePrefill(raw) {
  if (typeof raw !== "string" || raw.length === 0) return null;

  try {
    const padded =
      raw.replace(/-/g, "+").replace(/_/g, "/") +
      "=".repeat((4 - (raw.length % 4)) % 4);
    const json = atob(padded);
    const data = JSON.parse(json);

    if (typeof data.x !== "string" || typeof data.p !== "string") return null;
    if (
      !Number.isFinite(data.e) ||
      !Number.isFinite(data.s) ||
      !Number.isFinite(data.t)
    ) {
      return null;
    }

    return data;
  } catch (_) {
    return null;
  }
}
