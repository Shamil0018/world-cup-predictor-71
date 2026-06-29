import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UserAvatar } from "@/components/UserAvatar";
import { predictionError } from "@/lib/format";

export const Route = createFileRoute("/u/$username")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.username} · PredictCup` },
      { name: "description", content: `${params.username}'s World Cup 2026 predictions and ranking.` },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { username } = Route.useParams();

  const profQ = useQuery({
    queryKey: ["profile", username],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("username", username).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const lbQ = useQuery({
    queryKey: ["leaderboard-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leaderboard")
        .select("user_id,total_points,matches_scored")
        .order("total_points", { ascending: false })
        .order("matches_scored", { ascending: false });
      if (error) throw error;
      return data as { user_id: string; total_points: number; matches_scored: number }[];
    },
  });

  const predsQ = useQuery({
    queryKey: ["user-preds", profQ.data?.id],
    enabled: !!profQ.data?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("predictions")
        .select("id,predicted_home,predicted_away,predicted_winner_id,created_at,match:match_id(id,kickoff_at,status,stage,winner_id,home_score,away_score,home_team:home_team_id(code,name,flag_emoji),away_team:away_team_id(code,name,flag_emoji))")
        .eq("user_id", profQ.data!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Array<{
        id: string;
        predicted_home: number;
        predicted_away: number;
        predicted_winner_id: string | null;
        created_at: string;
        match: {
          id: string;
          kickoff_at: string;
          status: "scheduled" | "live" | "finished" | "postponed";
          stage: string;
          winner_id: string | null;
          home_score: number | null;
          away_score: number | null;
          home_team: { code: string; name: string; flag_emoji: string };
          away_team: { code: string; name: string; flag_emoji: string };
        };
      }>;
    },
  });

  if (profQ.isLoading) return <div className="container mx-auto px-4 py-10">Loading…</div>;
  if (!profQ.data) return <div className="container mx-auto px-4 py-10 text-center text-muted-foreground">User not found. <Link to="/" className="text-primary underline">Go home</Link></div>;

  const prof = profQ.data;
  const lbRow = lbQ.data?.find((r) => r.user_id === prof.id);
  const rank = lbQ.data ? lbQ.data.findIndex((r) => r.user_id === prof.id) + 1 : null;

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      <div className="glass rounded-3xl p-8 flex flex-col md:flex-row items-center gap-6">
        <UserAvatar avatarUrl={prof.avatar_url} username={prof.username} className="size-24" />
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-3xl font-bold">{prof.display_name ?? prof.username}</h1>
          <p className="text-muted-foreground">@{prof.username}</p>
          {prof.bio && <p className="mt-2 text-sm">{prof.bio}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Rank" value={rank ? `#${rank}` : "—"} accent />
          <Stat label="Total points" value={lbRow?.total_points ?? 0} />
        </div>
      </div>

      <h2 className="mt-10 mb-4 text-xl font-bold">Predictions</h2>
      <div className="space-y-2">
        {predsQ.data?.length === 0 && <p className="text-muted-foreground">No predictions yet.</p>}
        {predsQ.data?.map((p) => {
          const finished = p.match.status === "finished" && p.match.home_score != null && p.match.away_score != null;
          const isKnockout = p.match.stage !== "group";
          const err = finished ? predictionError(p.predicted_home, p.predicted_away, p.match.home_score!, p.match.away_score!, p.match.stage, p.predicted_winner_id, p.match.winner_id) : null;
          const pointsEarned = isKnockout ? 20 - (err ?? 0) : (20 - (err ?? 0)) / 2;
          return (
            <div key={p.id} className="glass rounded-2xl p-4 flex items-center gap-4">
              <div className="flex-1 flex items-center gap-3 min-w-0">
                <span className="text-2xl">{p.match.home_team.flag_emoji}</span>
                <span className="font-medium truncate">{p.match.home_team.code} vs {p.match.away_team.code}</span>
                <span className="text-2xl">{p.match.away_team.flag_emoji}</span>
                <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded uppercase font-semibold text-muted-foreground ml-2">{p.match.stage}</span>
              </div>
              <div className="text-sm tabular-nums">
                <span className="text-primary font-bold">{p.predicted_home}–{p.predicted_away}</span>
                {finished && (
                  <span className="text-muted-foreground ml-3">actual {p.match.home_score}–{p.match.away_score}</span>
                )}
              </div>
              {finished && (
                <div className="text-right">
                  <div className="text-lg font-bold gradient-text tabular-nums">+{pointsEarned}</div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">points</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="text-center px-4 py-3 rounded-xl bg-white/5">
      <div className={`text-2xl font-bold tabular-nums ${accent ? "gradient-gold-text" : "gradient-text"}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
}
