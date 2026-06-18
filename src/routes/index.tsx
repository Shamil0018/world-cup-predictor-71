import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MatchCard } from "@/components/MatchCard";
import { PredictionDialog } from "@/components/PredictionDialog";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import heroImg from "@/assets/hero.jpg";
import { Sparkles, Trophy, Users } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PredictCup · FIFA World Cup 2026 Predictions" },
      { name: "description", content: "Predict every FIFA World Cup 2026 match. Lower error wins. Live chat and global leaderboard." },
    ],
  }),
  component: Index,
});

type MatchRow = {
  id: string;
  kickoff_at: string;
  stage: string;
  venue: string | null;
  status: "scheduled" | "live" | "finished" | "postponed";
  home_score: number | null;
  away_score: number | null;
  home_team: { code: string; name: string; flag_emoji: string };
  away_team: { code: string; name: string; flag_emoji: string };
};

function Index() {
  const { user } = useAuth();
  const [openMatch, setOpenMatch] = useState<MatchRow | null>(null);

  const matchesQ = useQuery({
    queryKey: ["matches"],
    queryFn: async (): Promise<MatchRow[]> => {
      const { data, error } = await supabase
        .from("matches")
        .select("id,kickoff_at,stage,venue,status,home_score,away_score,home_team:home_team_id(code,name,flag_emoji),away_team:away_team_id(code,name,flag_emoji)")
        .order("kickoff_at", { ascending: true });
      if (error) throw error;
      return data as unknown as MatchRow[];
    },
  });

  const predsQ = useQuery({
    queryKey: ["my-preds", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("predictions")
        .select("match_id,predicted_home,predicted_away")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data as { match_id: string; predicted_home: number; predicted_away: number }[];
    },
  });

  useEffect(() => {
    const ch = supabase
      .channel("matches-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "matches" }, () => matchesQ.refetch())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [matchesQ]);

  const predMap = useMemo(() => {
    const m = new Map<string, { predicted_home: number; predicted_away: number }>();
    predsQ.data?.forEach((p) => m.set(p.match_id, p));
    return m;
  }, [predsQ.data]);

  const upcoming = matchesQ.data?.filter((m) => m.status !== "finished") ?? [];
  const finished = matchesQ.data?.filter((m) => m.status === "finished") ?? [];

  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img src={heroImg} alt="" className="w-full h-full object-cover opacity-40" width={1536} height={768} />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
        </div>
        <div className="container mx-auto px-4 pt-16 pb-20 md:pt-24 md:pb-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs uppercase tracking-widest">
              <Sparkles className="size-3 text-accent" /> FIFA World Cup 2026
            </div>
            <h1 className="mt-5 text-5xl md:text-7xl font-bold leading-[0.95]">
              Predict every <span className="gradient-gold-text">goal.</span><br />
              Climb the <span className="gradient-text">global ladder.</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-xl">
              Lock in your scores before kickoff. The smaller your error, the higher you climb.
              Compete with fans worldwide, live.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {!user && (
                <Button asChild size="lg" className="bg-[var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-glow)]">
                  <Link to="/auth">Start predicting</Link>
                </Button>
              )}
              <Button asChild size="lg" variant="outline">
                <Link to="/leaderboard"><Trophy className="size-4 mr-2" /> Leaderboard</Link>
              </Button>
              <Button asChild size="lg" variant="ghost">
                <Link to="/chat"><Users className="size-4 mr-2" /> Join the chat</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-16">
        <div className="flex items-end justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-bold">Upcoming matches</h2>
          <span className="text-xs text-muted-foreground">Locks 30 min before kickoff</span>
        </div>

        {matchesQ.isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass h-44 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : upcoming.length === 0 ? (
          <p className="text-muted-foreground">No upcoming matches.</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcoming.map((m) => (
              <MatchCard
                key={m.id}
                match={m}
                prediction={predMap.get(m.id)}
                onClick={() => setOpenMatch(m)}
              />
            ))}
          </div>
        )}

        {finished.length > 0 && (
          <>
            <h2 className="text-2xl md:text-3xl font-bold mt-16 mb-6">Recent results</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {finished.map((m) => (
                <MatchCard key={m.id} match={m} prediction={predMap.get(m.id)} onClick={() => setOpenMatch(m)} />
              ))}
            </div>
          </>
        )}
      </section>

      {openMatch && (
        <PredictionDialog
          open={!!openMatch}
          onOpenChange={(b) => !b && setOpenMatch(null)}
          matchId={openMatch.id}
          homeName={openMatch.home_team.name}
          awayName={openMatch.away_team.name}
          homeFlag={openMatch.home_team.flag_emoji}
          awayFlag={openMatch.away_team.flag_emoji}
          kickoffAt={openMatch.kickoff_at}
          existing={predMap.get(openMatch.id)}
          onSaved={() => predsQ.refetch()}
        />
      )}
    </div>
  );
}
