import { formatKickoff, isLocked, timeUntil } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Lock, Radio, CheckCircle2 } from "lucide-react";

type Team = { code: string; name: string; flag_emoji: string };
type Match = {
  id: string;
  kickoff_at: string;
  stage: string;
  venue: string | null;
  status: "scheduled" | "live" | "finished" | "postponed";
  home_score: number | null;
  away_score: number | null;
  home_team: Team;
  away_team: Team;
};

type Prediction = { predicted_home: number; predicted_away: number } | null;

export function MatchCard({
  match,
  prediction,
  onClick,
}: {
  match: Match;
  prediction?: Prediction;
  onClick?: () => void;
}) {
  const locked = isLocked(match.kickoff_at) || match.status !== "scheduled";
  const finished = match.status === "finished";

  return (
    <button
      onClick={onClick}
      className="group bg-white/[0.02] border border-white/5 rounded-2xl p-5 text-left w-full transition-all duration-300 hover:bg-white/[0.04] hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgb(0,0,0,0.15)] hover:border-primary/30 cursor-pointer"
    >
      <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
        <span className="uppercase tracking-widest">{match.stage}</span>
        <div className="flex items-center gap-2">
          {match.status === "live" && (
            <Badge className="bg-destructive/20 text-destructive border-destructive/30">
              <Radio className="size-3 mr-1 animate-pulse" /> LIVE
            </Badge>
          )}
          {finished && (
            <Badge className="bg-success/20 text-success border-success/30">
              <CheckCircle2 className="size-3 mr-1" /> FT
            </Badge>
          )}
          {!finished && match.status !== "live" && (
            <span>{formatKickoff(match.kickoff_at)}</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <TeamSide team={match.home_team} align="end" />

        <div className="text-center">
          {finished ? (
            <div className="text-3xl font-bold tabular-nums gradient-gold-text">
              {match.home_score} <span className="text-muted-foreground/40">–</span> {match.away_score}
            </div>
          ) : (
            <div className="text-xl font-bold text-muted-foreground/60">vs</div>
          )}
          {prediction && (
            <div className="mt-1 text-[11px] text-primary tabular-nums">
              your pick {prediction.predicted_home}–{prediction.predicted_away}
            </div>
          )}
        </div>

        <TeamSide team={match.away_team} align="start" />
      </div>

      <div className="mt-4 flex items-center justify-between text-xs">
        <span className="text-muted-foreground truncate">{match.venue}</span>
        {!finished && (
          <span className={`flex items-center gap-1 ${locked ? "text-destructive" : "text-primary"}`}>
            {locked ? <Lock className="size-3" /> : null}
            {locked ? "Locked" : `Locks in ${timeUntil(new Date(new Date(match.kickoff_at).getTime() - 30 * 60000).toISOString())}`}
          </span>
        )}
      </div>
    </button>
  );
}

function TeamSide({ team, align }: { team: Team; align: "start" | "end" }) {
  return (
    <div className={`flex items-center gap-3 ${align === "end" ? "justify-end" : "justify-start"}`}>
      {align === "start" && <span className="text-4xl leading-none">{team.flag_emoji}</span>}
      <div className={align === "end" ? "text-right" : "text-left"}>
        <div className="font-semibold">{team.name}</div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{team.code}</div>
      </div>
      {align === "end" && <span className="text-4xl leading-none">{team.flag_emoji}</span>}
    </div>
  );
}
