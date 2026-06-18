export function formatKickoff(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function timeUntil(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "Kickoff";
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ${mins % 60}m`;
  const days = Math.floor(hrs / 24);
  return `${days}d ${hrs % 24}h`;
}

export function isLocked(kickoffIso: string) {
  return new Date(kickoffIso).getTime() - Date.now() < 30 * 60 * 1000;
}

export function predictionError(ph: number, pa: number, ah: number, aa: number) {
  return Math.abs(ph - ah) + Math.abs(pa - aa) + Math.abs(ph - pa - (ah - aa));
}
