import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Shield, Plus, Trash2 } from "lucide-react";
import { seedTeamsFn, deleteUserFn } from "@/lib/seed.server";

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

  const profilesQ = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, display_name, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const predictionsQ = useQuery({
    queryKey: ["admin-predictions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("predictions")
        .select("id,predicted_home,predicted_away,user_id,match_id,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const predictionList = useMemo(() => {
    if (!predictionsQ.data || !profilesQ.data || !matchesQ.data) return [];
    
    const profileMap = new Map(profilesQ.data.map(p => [p.id, p]));
    const matchMap = new Map(matchesQ.data.map(m => [m.id, m]));
    
    return predictionsQ.data.map(p => {
      const prof = profileMap.get(p.user_id);
      const match = matchMap.get(p.match_id);
      return {
        ...p,
        username: prof?.username ?? "Unknown User",
        match
      };
    }).filter(p => p.match);
  }, [predictionsQ.data, profilesQ.data, matchesQ.data]);

  const removePrediction = async (id: string) => {
    const confirmRemove = window.confirm("Are you sure you want to remove this prediction? This will remove it from the leaderboard.");
    if (!confirmRemove) return;
    
    const { error } = await supabase.from("predictions").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Prediction removed successfully");
    predictionsQ.refetch();
  };

  const handleDeleteUser = async (id: string) => {
    if (id === user?.id) {
      return toast.error("You cannot delete yourself!");
    }
    const confirmDelete = window.confirm("Are you sure you want to delete this user completely? This will delete their profile, predictions, and chat history.");
    if (!confirmDelete) return;

    try {
      const res = await deleteUserFn({ data: id });
      if (res.success) {
        toast.success("User deleted successfully!");
        profilesQ.refetch();
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to delete user");
    }
  };

  useEffect(() => {
    if (teamsQ.data && teamsQ.data.length < 48 && !seeding) {
      handleSeed();
    }
  }, [teamsQ.data, seeding]);
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

      <section className="mb-10">
        <h2 className="font-bold text-lg mb-4">Enter results</h2>
        <div className="space-y-2">
          {matchesQ.data?.map((m) => <ResultRow key={m.id} m={m} onSave={saveResult} onDelete={deleteMatch} />)}
        </div>
      </section>

      <section className="glass rounded-3xl p-6 mb-10">
        <h2 className="font-bold text-lg mb-4">Manage Predictions ({predictionList.length})</h2>
        {predictionsQ.isLoading || profilesQ.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading predictions...</p>
        ) : predictionList.length === 0 ? (
          <p className="text-sm text-muted-foreground">No predictions submitted yet.</p>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {predictionList.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition flex-wrap gap-4">
                <div className="min-w-[180px]">
                  <div className="font-bold text-primary">@{p.username}</div>
                  <div className="text-xs text-muted-foreground">
                    predicted {p.predicted_home}–{p.predicted_away}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span>{p.match.home_team.flag_emoji} {p.match.home_team.code}</span>
                  <span className="text-muted-foreground">vs</span>
                  <span>{p.match.away_team.flag_emoji} {p.match.away_team.code}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] uppercase tracking-wider font-semibold ${p.match.status === "finished" ? "text-success" : "text-muted-foreground"}`}>
                    {p.match.status}
                  </span>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => removePrediction(p.id)}
                    className="cursor-pointer h-8 text-xs"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="glass rounded-3xl p-6 pb-16 md:pb-6">
        <h2 className="font-bold text-lg mb-4">Manage Users</h2>
        <div className="space-y-3">
          {profilesQ.data?.map((p) => (
            <div key={p.id} className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition">
              <div>
                <div className="font-bold">{p.display_name || p.username}</div>
                <div className="text-xs text-muted-foreground">@{p.username}</div>
              </div>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDeleteUser(p.id)}
                className="cursor-pointer"
              >
                Delete User
              </Button>
            </div>
          ))}
          {profilesQ.data?.length === 0 && (
            <p className="text-muted-foreground text-sm">No users found.</p>
          )}
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
