import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Shield, Plus } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin · PredictCup" }] }),
  component: AdminPage,
});

type Team = { id: string; code: string; name: string; flag_emoji: string };
type Match = {
  id: string; kickoff_at: string; status: string; home_score: number | null; away_score: number | null;
  home_team: Team; away_team: Team;
};

function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) navigate({ to: "/auth" });
      else if (!isAdmin) navigate({ to: "/" });
    }
  }, [loading, user, isAdmin, navigate]);

  const teamsQ = useQuery({
    queryKey: ["admin-teams"],
    queryFn: async (): Promise<Team[]> => {
      const { data, error } = await supabase.from("teams").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const matchesQ = useQuery({
    queryKey: ["admin-matches"],
    queryFn: async (): Promise<Match[]> => {
      const { data, error } = await supabase
        .from("matches")
        .select("id,kickoff_at,status,home_score,away_score,home_team:home_team_id(id,code,name,flag_emoji),away_team:away_team_id(id,code,name,flag_emoji)")
        .order("kickoff_at");
      if (error) throw error;
      return data as unknown as Match[];
    },
  });

  // Add match form
  const [home, setHome] = useState(""); const [away, setAway] = useState("");
  const [kickoff, setKickoff] = useState(""); const [venue, setVenue] = useState(""); const [stage, setStage] = useState("group");

  const addMatch = async () => {
    if (!home || !away || !kickoff || home === away) return toast.error("Pick two teams and a kickoff");
    const { error } = await supabase.from("matches").insert({
      home_team_id: home, away_team_id: away, kickoff_at: new Date(kickoff).toISOString(), venue, stage,
    });
    if (error) return toast.error(error.message);
    toast.success("Match added");
    setHome(""); setAway(""); setKickoff(""); setVenue("");
    matchesQ.refetch();
  };

  const saveResult = async (m: Match, hs: number, as_: number) => {
    const { error } = await supabase.from("matches").update({
      home_score: hs, away_score: as_, status: "finished",
    }).eq("id", m.id);
    if (error) return toast.error(error.message);
    toast.success("Result saved · leaderboard updated");
    matchesQ.refetch();
  };

  if (!isAdmin) return null;

  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      <div className="flex items-center gap-2 mb-8">
        <Shield className="text-accent" /> <h1 className="text-3xl font-bold">Admin</h1>
      </div>

      <section className="glass rounded-3xl p-6 mb-10">
        <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><Plus className="size-4" /> Add a fixture</h2>
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Home</Label>
            <Select value={home} onValueChange={setHome}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Team" /></SelectTrigger>
              <SelectContent>{teamsQ.data?.map(t => <SelectItem key={t.id} value={t.id}>{t.flag_emoji} {t.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Away</Label>
            <Select value={away} onValueChange={setAway}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Team" /></SelectTrigger>
              <SelectContent>{teamsQ.data?.map(t => <SelectItem key={t.id} value={t.id}>{t.flag_emoji} {t.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Kickoff</Label>
            <Input type="datetime-local" value={kickoff} onChange={(e) => setKickoff(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Stage</Label>
            <Input value={stage} onChange={(e) => setStage(e.target.value)} className="mt-1" />
          </div>
          <div className="md:col-span-2">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Venue</Label>
            <Input value={venue} onChange={(e) => setVenue(e.target.value)} className="mt-1" />
          </div>
        </div>
        <Button onClick={addMatch} className="mt-4 bg-[var(--gradient-primary)] text-primary-foreground">Add fixture</Button>
      </section>

      <section>
        <h2 className="font-bold text-lg mb-4">Enter results</h2>
        <div className="space-y-2">
          {matchesQ.data?.map((m) => <ResultRow key={m.id} m={m} onSave={saveResult} />)}
        </div>
      </section>
    </div>
  );
}

function ResultRow({ m, onSave }: { m: Match; onSave: (m: Match, hs: number, as_: number) => void }) {
  const [hs, setHs] = useState<number>(m.home_score ?? 0);
  const [as_, setAs] = useState<number>(m.away_score ?? 0);
  const finished = m.status === "finished";
  return (
    <div className="glass rounded-2xl p-4 flex flex-wrap items-center gap-3">
      <div className="flex-1 min-w-[200px] flex items-center gap-2">
        <span className="text-xl">{m.home_team.flag_emoji}</span>
        <span className="font-medium">{m.home_team.code}</span>
        <span className="text-muted-foreground">vs</span>
        <span className="font-medium">{m.away_team.code}</span>
        <span className="text-xl">{m.away_team.flag_emoji}</span>
      </div>
      <div className="text-xs text-muted-foreground">{new Date(m.kickoff_at).toLocaleString()}</div>
      <Input type="number" value={hs} onChange={(e) => setHs(parseInt(e.target.value || "0"))} className="w-16" />
      <span>–</span>
      <Input type="number" value={as_} onChange={(e) => setAs(parseInt(e.target.value || "0"))} className="w-16" />
      <Button size="sm" onClick={() => onSave(m, hs, as_)} variant={finished ? "outline" : "default"}>
        {finished ? "Update" : "Save result"}
      </Button>
    </div>
  );
}
