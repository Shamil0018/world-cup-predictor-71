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
  return new Date(kickoffIso).getTime() <= Date.now();
}

export function predictionError(
  ph: number,
  pa: number,
  ah: number,
  aa: number,
  stage: string = 'group',
  predictedWinnerId?: string | null,
  actualWinnerId?: string | null
) {
  const diff = Math.abs(ph - ah) + Math.abs(pa - aa) + Math.abs(ph - pa - (ah - aa));
  
  if (stage !== 'group') {
    const correctOutcome = !!(predictedWinnerId && actualWinnerId && predictedWinnerId === actualWinnerId);
    return diff + (correctOutcome ? 0 : 2);
  } else {
    const correctOutcome = (ah > aa && ph > pa) || (ah < aa && ph < pa) || (ah === aa && ph === pa);
    return diff + (correctOutcome ? 0 : 2);
  }
}
