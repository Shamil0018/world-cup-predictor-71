import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UserAvatar } from "@/components/UserAvatar";
import { Crown, Medal, Trophy } from "lucide-react";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({ meta: [{ title: "Leaderboard · PredictCup" }, { name: "description", content: "Live global ranking of FIFA World Cup 2026 predictors." }] }),
  component: LeaderboardPage,
});

type Row = { user_id: string; username: string; avatar_url: string | null; total_points: number; games_predicted: number; matches_scored: number };

function LeaderboardPage() {
  const q = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async (): Promise<Row[]> => {
      const { data, error } = await supabase
        .from("leaderboard")
        .select("*")
        .order("total_points", { ascending: false })
        .order("matches_scored", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as Row[];
    },
  });

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    const throttledRefetch = () => {
      if (timer) return;
      timer = setTimeout(() => {
        q.refetch();
        timer = null;
      }, 5000);
    };

    const ch = supabase
      .channel("lb-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "predictions" }, throttledRefetch)
      .on("postgres_changes", { event: "*", schema: "public", table: "matches" }, throttledRefetch)
      .subscribe();
    return () => {
      if (timer) clearTimeout(timer);
      supabase.removeChannel(ch);
    };
  }, [q]);

  const rows = q.data ?? [];

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs uppercase tracking-widest">
          <Trophy className="size-3 text-accent" /> Live rankings
        </div>
        <h1 className="mt-4 text-4xl md:text-5xl font-bold">Global <span className="gradient-gold-text">leaderboard</span></h1>
      </div>

      {q.isLoading ? (
        <div className="space-y-3">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="glass h-16 rounded-2xl animate-pulse" />)}</div>
      ) : rows.length === 0 ? (
        <p className="text-center text-muted-foreground">No results yet.</p>
      ) : (
        <ol className="space-y-2">
          {rows.map((r, i) => (
            <li key={r.user_id}>
              <Link
                to="/u/$username"
                params={{ username: r.username }}
                className="glass rounded-2xl p-4 flex items-center gap-4 hover:border-primary/40 transition"
              >
                <div className="w-10 text-center">
                  {i === 0 ? <Crown className="size-6 text-[var(--gold)] mx-auto" /> :
                   i === 1 ? <Medal className="size-6 text-[oklch(0.85_0.02_60)] mx-auto" /> :
                   i === 2 ? <Medal className="size-6 text-[oklch(0.65_0.10_50)] mx-auto" /> :
                   <span className="text-muted-foreground tabular-nums">#{i + 1}</span>}
                </div>
                <UserAvatar avatarUrl={r.avatar_url} username={r.username} className="size-10" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{r.username}</div>
                  <div className="text-xs text-muted-foreground">{r.matches_scored} scored</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold tabular-nums gradient-text">{r.total_points}</div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">points</div>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
