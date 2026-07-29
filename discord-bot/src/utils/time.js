import ms from "ms";

export function parseDuration(input) {
  if (!input) return null;
  const value = ms(String(input));
  if (!value || value < 1000) return null;
  return value;
}

export function formatDuration(msValue) {
  if (!msValue || msValue < 1000) return "1 saniye";
  return ms(msValue, { long: true });
}
