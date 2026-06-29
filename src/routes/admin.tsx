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
  id: string;
  kickoff_at: string;
  status: string;
  stage: string;
  winner_id: string | null;
  home_score: number | null;
  away_score: number | null;
  home_team: Team;
  away_team: Team;
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
        .select("id,kickoff_at,status,stage,winner_id,home_score,away_score,home_team:home_team_id(id,code,name,flag_emoji),away_team:away_team_id(id,code,name,flag_emoji)")
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
    const confirmRemove = window.confirm("Are you sure you want to remove this prediction from the leaderboard? The points for this match will not be counted.");
    if (!confirmRemove) return;
    
    const { error } = await supabase.from("predictions").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Prediction removed from leaderboard");
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
  const [kickoff, setKickoff] = useState(""); const [venue, setVenue] = useState(""); const [stage, setStage] = useState("knockout");

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

  const saveResult = async (m: Match, hs: number | null, as_: number | null, status: string, winnerId: string | null) => {
    const { error } = await supabase.from("matches").update({
      home_score: hs,
      away_score: as_,
      status: status as any,
      winner_id: winnerId,
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
          className="bg-accent text-accent-foreground cursor-pointer text-xs font-semibold uppercase tracking-wider h-9"
        >
          {seeding ? "Seeding 48 Teams..." : "Seed 48 Teams List"}
        </Button>
      </div>

      {/* MATCH FIXTURES & RESULTS */}
      <section className="glass rounded-3xl p-6 mb-8 border border-white/5">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">Fixtures & Results</h2>
        
        {/* ADD MATCH FIXTURE */}
        <div className="grid md:grid-cols-4 gap-3 p-4 bg-white/[0.02] rounded-2xl border border-white/5 mb-6">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Home Team</Label>
            <Select value={home} onValueChange={setHome}>
              <SelectTrigger className="bg-white/5 border-white/10 text-xs h-9">
                <SelectValue placeholder="Home Team" />
              </SelectTrigger>
              <SelectContent>
                {teamsQ.data?.map(t => <SelectItem key={t.id} value={t.id}>{t.name} ({t.code})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Away Team</Label>
            <Select value={away} onValueChange={setAway}>
              <SelectTrigger className="bg-white/5 border-white/10 text-xs h-9">
                <SelectValue placeholder="Away Team" />
              </SelectTrigger>
              <SelectContent>
                {teamsQ.data?.map(t => <SelectItem key={t.id} value={t.id}>{t.name} ({t.code})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Kickoff At</Label>
            <Input type="datetime-local" value={kickoff} onChange={(e) => setKickoff(e.target.value)} className="bg-white/5 border-white/10 text-xs h-9" />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Venue</Label>
            <div className="flex gap-2">
              <Input placeholder="Stadium Name" value={venue} onChange={(e) => setVenue(e.target.value)} className="bg-white/5 border-white/10 text-xs h-9" />
              <Button onClick={addMatch} size="icon" className="h-9 w-9 shrink-0 cursor-pointer" title="Add Match">
                <Plus className="size-4" />
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 md:col-span-4 mt-2">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Stage</Label>
            <Input value={stage} onChange={(e) => setStage(e.target.value)} className="mt-1 bg-white/5 border-white/10 text-xs h-9" />
          </div>
        </div>

        {/* LIST FIXTURES */}
        <div className="space-y-3">
          {matchesQ.isLoading ? <p>Loading fixtures…</p> : matchesQ.data?.length === 0 ? <p className="text-muted-foreground text-sm">No fixtures scheduled.</p> :
            matchesQ.data?.map(m => (
              <ResultRow key={m.id} m={m} onSave={saveResult} onDelete={deleteMatch} />
            ))}
        </div>
      </section>

      {/* USER MANAGEMENT */}
      <section className="glass rounded-3xl p-6 border border-white/5 mb-8">
        <h2 className="text-xl font-bold mb-4">User Leaderboard Predictions</h2>
        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
          {predictionList.map(p => (
            <div key={p.id} className="flex items-center justify-between p-3 bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 rounded-xl text-xs gap-3">
              <div className="flex-1 min-w-0">
                <span className="font-bold text-primary mr-2">@{p.username}</span>
                <span className="text-muted-foreground">predicted</span>
                <span className="font-semibold text-foreground mx-1.5">{p.predicted_home}–{p.predicted_away}</span>
                <span className="text-muted-foreground">for</span>
                <span className="font-medium text-foreground ml-1.5">
                  {p.match.home_team.code} vs {p.match.away_team.code} ({p.match.stage})
                </span>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => removePrediction(p.id)}
                className="border-white/5 bg-white/[0.02] hover:bg-white/[0.05] h-8 text-[10px] cursor-pointer"
              >
                Remove from leaderboard
              </Button>
            </div>
          ))}
          {predictionList.length === 0 && (
            <p className="text-muted-foreground text-sm">No user predictions found.</p>
          )}
        </div>
      </section>

      {/* ALL USERS LIST */}
      <section className="glass rounded-3xl p-6 border border-white/5">
        <h2 className="text-xl font-bold mb-4">Registered Users</h2>
        <div className="space-y-3">
          {profilesQ.isLoading ? <p>Loading users…</p> : profilesQ.data?.map(p => (
            <div key={p.id} className="flex items-center justify-between p-3 bg-white/[0.01] border border-white/5 rounded-xl text-xs">
              <div>
                <span className="font-semibold">@{p.username}</span>
                {p.display_name && <span className="text-muted-foreground ml-2">({p.display_name})</span>}
                <span className="text-muted-foreground block text-[10px] mt-1">Joined: {new Date(p.created_at).toLocaleDateString()}</span>
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

function ResultRow({ m, onSave, onDelete }: { m: Match; onSave: (m: Match, hs: number | null, as_: number | null, status: string, winnerId: string | null) => void; onDelete: (id: string) => void }) {
  const [hs, setHs] = useState<string>(m.home_score !== null ? m.home_score.toString() : "");
  const [as_, setAs] = useState<string>(m.away_score !== null ? m.away_score.toString() : "");
  const [status, setStatus] = useState<string>(m.status);
  const [winnerId, setWinnerId] = useState<string | null>(m.winner_id);

  useEffect(() => {
    setWinnerId(m.winner_id);
  }, [m.winner_id]);

  const handleSave = () => {
    const homeScore = hs === "" ? null : parseInt(hs);
    const awayScore = as_ === "" ? null : parseInt(as_);
    onSave(m, homeScore, awayScore, status, winnerId);
  };

  const handleHomeScoreChange = (val: string) => {
    setHs(val);
    if (m.stage !== "group" && val !== "" && as_ !== "") {
      const h = parseInt(val);
      const a = parseInt(as_);
      if (h > a) setWinnerId(m.home_team.id);
      else if (a > h) setWinnerId(m.away_team.id);
    }
  };

  const handleAwayScoreChange = (val: string) => {
    setAs(val);
    if (m.stage !== "group" && hs !== "" && val !== "") {
      const h = parseInt(hs);
      const a = parseInt(val);
      if (h > a) setWinnerId(m.home_team.id);
      else if (a > h) setWinnerId(m.away_team.id);
    }
  };

  return (
    <div className="glass rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-white/5">
      <div className="flex items-center gap-3 min-w-[220px]">
        <span className="text-2xl">{m.home_team.flag_emoji}</span>
        <span className="font-bold tracking-wider">{m.home_team.code}</span>
        <span className="text-muted-foreground text-xs">vs</span>
        <span className="font-bold tracking-wider">{m.away_team.code}</span>
        <span className="text-2xl">{m.away_team.flag_emoji}</span>
        <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded uppercase font-semibold text-muted-foreground ml-2">{m.stage}</span>
      </div>

      <div className="text-xs text-muted-foreground">
        {new Date(m.kickoff_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
      </div>

      <div className="flex items-center gap-2">
        <Input
          type="number"
          placeholder="—"
          value={hs}
          onChange={(e) => handleHomeScoreChange(e.target.value)}
          className="w-14 text-center h-9 bg-white/5 border-white/10"
        />
        <span className="text-muted-foreground">–</span>
        <Input
          type="number"
          placeholder="—"
          value={as_}
          onChange={(e) => handleAwayScoreChange(e.target.value)}
          className="w-14 text-center h-9 bg-white/5 border-white/10"
        />
      </div>

      {m.stage !== "group" && (
        <div className="flex items-center gap-1.5">
          <Select value={winnerId || ""} onValueChange={setWinnerId}>
            <SelectTrigger className="w-32 h-9 bg-white/5 border-white/10 text-xs">
              <SelectValue placeholder="Pick Winner" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={m.home_team.id}>{m.home_team.code} wins</SelectItem>
              <SelectItem value={m.away_team.id}>{m.away_team.code} wins</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

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
