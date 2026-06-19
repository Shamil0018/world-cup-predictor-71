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
import { Shield, Plus, Trash2 } from "lucide-react";
import { seedTeamsFn } from "@/lib/seed.server";

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
  const [seeding, setSeeding] = useState(false);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await seedTeamsFn();
      if (res.success) {
        toast.success("Successfully seeded 48 teams list & granted DB admin role!");
        teamsQ.refetch();
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to seed teams");
    } finally {
      setSeeding(false);
    }
  };
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

  const saveResult = async (m: Match, hs: number | null, as_: number | null, status: string) => {
    const { error } = await supabase.from("matches").update({
      home_score: hs,
      away_score: as_,
      status: status as any,
    }).eq("id", m.id);
    if (error) return toast.error(error.message);
    toast.success("Match updated successfully");
    matchesQ.refetch();
  };

  const deleteMatch = async (id: string) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this fixture?");
    if (!confirmDelete) return;

    await supabase.from("predictions").delete().eq("match_id", id);
    const { error } = await supabase.from("matches").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Fixture deleted successfully");
    matchesQ.refetch();
  };

  if (!isAdmin) return null;

  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
        <div className="flex items-center gap-2">
          <Shield className="text-accent" /> <h1 className="text-3xl font-bold">Admin</h1>
        </div>
        <Button 
          onClick={handleSeed} 
          disabled={seeding} 
          variant="outline" 
          className="border-white/10 hover:bg-white/5 cursor-pointer text-xs"
        >
          {seeding ? "Seeding 48 Teams..." : "Seed 48 Teams List"}
        </Button>
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
        <Button onClick={addMatch} className="mt-4 bg-gradient-primary text-primary-foreground cursor-pointer">Add fixture</Button>
      </section>

      <section>
        <h2 className="font-bold text-lg mb-4">Enter results</h2>
        <div className="space-y-2 pb-16 md:pb-0">
          {matchesQ.data?.map((m) => <ResultRow key={m.id} m={m} onSave={saveResult} onDelete={deleteMatch} />)}
        </div>
      </section>
    </div>
  );
}

function ResultRow({ m, onSave, onDelete }: { m: Match; onSave: (m: Match, hs: number | null, as_: number | null, status: string) => void; onDelete: (id: string) => void }) {
  const [hs, setHs] = useState<string>(m.home_score !== null ? m.home_score.toString() : "");
  const [as_, setAs] = useState<string>(m.away_score !== null ? m.away_score.toString() : "");
  const [status, setStatus] = useState<string>(m.status);

  const handleSave = () => {
    const homeScore = hs === "" ? null : parseInt(hs);
    const awayScore = as_ === "" ? null : parseInt(as_);
    onSave(m, homeScore, awayScore, status);
  };

  return (
    <div className="glass rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-[220px]">
        <span className="text-2xl">{m.home_team.flag_emoji}</span>
        <span className="font-bold tracking-wider">{m.home_team.code}</span>
        <span className="text-muted-foreground text-xs">vs</span>
        <span className="font-bold tracking-wider">{m.away_team.code}</span>
        <span className="text-2xl">{m.away_team.flag_emoji}</span>
      </div>

      <div className="text-xs text-muted-foreground">
        {new Date(m.kickoff_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
      </div>

      <div className="flex items-center gap-2">
        <Input
          type="number"
          placeholder="—"
          value={hs}
          onChange={(e) => setHs(e.target.value)}
          className="w-14 text-center h-9 bg-white/5 border-white/10"
        />
        <span className="text-muted-foreground">–</span>
        <Input
          type="number"
          placeholder="—"
          value={as_}
          onChange={(e) => setAs(e.target.value)}
          className="w-14 text-center h-9 bg-white/5 border-white/10"
        />
      </div>

      <div className="flex items-center gap-3">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-32 h-9 bg-white/5 border-white/10 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="live">🔴 Live</SelectItem>
            <SelectItem value="finished">🏁 Finished</SelectItem>
            <SelectItem value="postponed">Postponed</SelectItem>
          </SelectContent>
        </Select>

        <Button size="sm" onClick={handleSave} className="h-9 cursor-pointer">
          Save
        </Button>
        <Button size="icon" variant="destructive" onClick={() => onDelete(m.id)} className="h-9 w-9 cursor-pointer" title="Delete Fixture">
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}
