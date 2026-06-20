import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MatchCard } from "@/components/MatchCard";
import { PredictionDialog } from "@/components/PredictionDialog";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { UserAvatar } from "@/components/UserAvatar";
import { toast } from "sonner";
import { Sparkles, Trophy, Crown, Medal, Send, MessageSquare, ChevronRight } from "lucide-react";

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

type Msg = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profile?: { username: string; avatar_url: string | null };
};

function Index() {
  const { user, profile } = useAuth();
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

  const nextMatch = useMemo(() => {
    const list = matchesQ.data ?? [];
    const upcoming = list.filter((m) => m.status === "scheduled" || m.status === "live");
    if (upcoming.length === 0) return null;
    return upcoming[0];
  }, [matchesQ.data]);

  const nextMatchPredsQ = useQuery({
    queryKey: ["next-match-preds", nextMatch?.id],
    enabled: !!nextMatch,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("predictions")
        .select("predicted_home,predicted_away")
        .eq("match_id", nextMatch!.id);
      if (error) throw error;

      const list = data || [];
      const total = list.length;
      let home_wins = 0;
      let draws = 0;
      let away_wins = 0;

      list.forEach((p) => {
        if (p.predicted_home > p.predicted_away) home_wins++;
        else if (p.predicted_home === p.predicted_away) draws++;
        else away_wins++;
      });

      return { total, home_wins, draws, away_wins };
    },
  });

  const nextMatchStats = useMemo(() => {
    const stats = nextMatchPredsQ.data;
    if (!stats || stats.total === 0) {
      return { total: 0, homeWinPct: 0, drawPct: 0, awayWinPct: 0 };
    }

    const total = stats.total;
    return {
      total,
      homeWinPct: Math.round((stats.home_wins / total) * 100),
      drawPct: Math.round((stats.draws / total) * 100),
      awayWinPct: Math.round((stats.away_wins / total) * 100),
    };
  }, [nextMatchPredsQ.data]);

  useEffect(() => {
    const checkAndSeed = async () => {
      try {
        const { count } = await supabase.from("teams").select("*", { count: "exact", head: true });
        if (count !== null && count < 48) {
          const { seedTeamsFn } = await import("@/lib/seed.server");
          await seedTeamsFn();
        }
      } catch (err) {
        console.error("Auto seed failed:", err);
      }
    };
    checkAndSeed();
  }, []);

  useEffect(() => {
    const ch = supabase
      .channel("matches-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "matches" }, () => matchesQ.refetch())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [matchesQ]);

  useEffect(() => {
    if (!nextMatch) return;
    const ch = supabase
      .channel("next-match-preds-feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "predictions" },
        () => {
          nextMatchPredsQ.refetch();
          predsQ.refetch();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [nextMatch, nextMatchPredsQ, predsQ]);

  const [filter, setFilter] = useState<"all" | "upcoming" | "finished">("all");
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(10);

  useEffect(() => {
    setVisibleCount(10);
  }, [filter, search]);

  const predMap = useMemo(() => {
    const m = new Map<string, { predicted_home: number; predicted_away: number }>();
    predsQ.data?.forEach((p) => m.set(p.match_id, p));
    return m;
  }, [predsQ.data]);

  const filteredMatches = useMemo(() => {
    let list = matchesQ.data ?? [];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (m) =>
          m.home_team.name.toLowerCase().includes(q) ||
          m.home_team.code.toLowerCase().includes(q) ||
          m.away_team.name.toLowerCase().includes(q) ||
          m.away_team.code.toLowerCase().includes(q) ||
          (m.venue && m.venue.toLowerCase().includes(q))
      );
    }

    if (filter === "upcoming") {
      list = list.filter((m) => m.status !== "finished");
    } else if (filter === "finished") {
      list = list.filter((m) => m.status === "finished");
    }

    return list;
  }, [matchesQ.data, search, filter]);

  const slicedMatches = useMemo(() => {
    return filteredMatches.slice(0, visibleCount);
  }, [filteredMatches, visibleCount]);

  // 1. Leaderboard Snapshot (Top 5 players)
  const lbSnapshotQ = useQuery({
    queryKey: ["leaderboard-snapshot"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leaderboard")
        .select("*")
        .order("total_points", { ascending: false })
        .order("matches_scored", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    }
  });



  // 2. Mini Chat Feed
  const [homeMsgs, setHomeMsgs] = useState<Msg[]>([]);
  const [chatText, setChatText] = useState("");
  const [chatLoading, setChatLoading] = useState(true);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const homeProfileCacheRef = useRef<Map<string, { username: string; avatar_url: string | null }>>(new Map());

  const fetchHomeChat = async () => {
    const { data: rows, error } = await supabase
      .from("chat_messages")
      .select("id,content,created_at,user_id")
      .order("created_at", { ascending: false })
      .limit(15);
    if (error) { setChatLoading(false); return; }
    const ordered = (rows ?? []).reverse() as Msg[];
    const ids = Array.from(new Set(ordered.map((m) => m.user_id)));
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id,username,avatar_url").in("id", ids);
      if (profs) {
        profs.forEach((p) => homeProfileCacheRef.current.set(p.id, { username: p.username, avatar_url: p.avatar_url }));
      }
      const map = new Map((profs ?? []).map((p: any) => [p.id, p]));
      ordered.forEach((m) => { const p = map.get(m.user_id); if (p) m.profile = { username: p.username, avatar_url: p.avatar_url }; });
    }
    setHomeMsgs(ordered);
    setChatLoading(false);
    setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: "instant" }), 50);
  };

  useEffect(() => {
    fetchHomeChat();
    const ch = supabase
      .channel("home-chat-feed")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, async (payload) => {
        const m = payload.new as Msg;
        let prof = homeProfileCacheRef.current.get(m.user_id);
        if (!prof) {
          const { data } = await supabase.from("profiles").select("username,avatar_url").eq("id", m.user_id).maybeSingle();
          if (data) {
            prof = data as { username: string; avatar_url: string | null };
            homeProfileCacheRef.current.set(m.user_id, prof);
          }
        }
        if (prof) m.profile = prof;
        setHomeMsgs((prev) => [...prev, m].slice(-20));
        setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 30);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles" }, (payload) => {
        const updatedProf = payload.new as { id: string; username: string; avatar_url: string | null };
        homeProfileCacheRef.current.set(updatedProf.id, {
          username: updatedProf.username,
          avatar_url: updatedProf.avatar_url,
        });
        setHomeMsgs((prev) =>
          prev.map((msg) => {
            if (msg.user_id === updatedProf.id) {
              return {
                ...msg,
                profile: {
                  username: updatedProf.username,
                  avatar_url: updatedProf.avatar_url,
                },
              };
            }
            return msg;
          })
        );
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const sendHomeChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !chatText.trim()) return;
    const content = chatText.trim().slice(0, 500);
    setChatText("");
    const { error } = await supabase.from("chat_messages").insert({ user_id: user.id, content });
    if (error) toast.error(error.message);
  };

  return (
    <div className="flex flex-col min-h-full">
      {/* Low-profile Welcome / Info Header */}
      <div className="container mx-auto px-4 pt-6 pb-2">
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-gradient-gold flex items-center justify-center shadow-[var(--shadow-glow)] shrink-0">
              <Trophy className="size-5 text-[oklch(0.18_0.02_240)]" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold uppercase tracking-widest gradient-gold-text">PREDICTCUP PORTAL</h1>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Predict. Compete. Conquer.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user && (
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Welcome back, <span className="font-semibold text-primary">@{profile?.username}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="container mx-auto px-4 py-4 grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        
        {/* Left Column: Sidebar (col-span-1) - order-2 on mobile, order-1 on desktop */}
        <div className="lg:col-span-1 order-2 lg:order-1 space-y-6">
          
          {/* 1. Leaderboard Snapshot */}
          <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-5 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-xs uppercase tracking-widest flex items-center gap-1.5 text-[var(--gold)]">
                <Crown className="size-4 text-accent" /> CHAMPIONS LADDER
              </h3>
              <Link to="/leaderboard" className="text-xs text-primary hover:underline flex items-center gap-0.5 font-semibold tracking-wider">
                VIEW ALL <ChevronRight className="size-3" />
              </Link>
            </div>
            
            {lbSnapshotQ.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-10 rounded-lg bg-white/5 animate-pulse" />
                ))}
              </div>
            ) : lbSnapshotQ.data?.length === 0 ? (
              <p className="text-xs text-muted-foreground">No rankings yet.</p>
            ) : (
              <div className="space-y-1">
                {lbSnapshotQ.data?.map((r: any, i: number) => (
                  <Link
                    key={r.user_id}
                    to="/u/$username"
                    params={{ username: r.username }}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition"
                  >
                    <div className="w-6 text-center text-xs shrink-0 font-medium">
                      {i === 0 ? <Crown className="size-4 text-[var(--gold)] mx-auto" /> :
                       i === 1 ? <Medal className="size-4 text-[oklch(0.85_0.02_60)] mx-auto" /> :
                       i === 2 ? <Medal className="size-4 text-[oklch(0.65_0.10_50)] mx-auto" /> :
                       <span className="text-muted-foreground font-mono">#{i + 1}</span>}
                    </div>
                    <UserAvatar avatarUrl={r.avatar_url} username={r.username} className="size-7" />
                    <div className="flex-1 min-w-0 text-xs">
                      <div className="font-semibold truncate">{r.username}</div>
                      <div className="text-[10px] text-muted-foreground">{(r as any).games_predicted || 0} pred · {r.matches_scored || 0} scored</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold font-mono text-primary text-sm">{(r as any).total_points || 0}</div>
                      <div className="text-[8px] uppercase text-muted-foreground">pts</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* 2. Mini Live Chat */}
          <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-5 flex flex-col h-[380px]">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <h3 className="font-extrabold text-xs uppercase tracking-widest flex items-center gap-1.5 text-primary">
                <MessageSquare className="size-4 text-primary" /> FAN ZONE
              </h3>
              <Link to="/chat" className="text-xs text-primary hover:underline flex items-center gap-0.5 font-semibold tracking-wider">
                FULL CHAT <ChevronRight className="size-3" />
              </Link>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 mb-3 text-xs scrollbar-thin">
              {chatLoading ? (
                <p className="text-muted-foreground text-xs">Loading chat messages...</p>
              ) : homeMsgs.length === 0 ? (
                <p className="text-muted-foreground text-xs">No chat messages yet.</p>
              ) : (
                homeMsgs.map((m) => (
                  <div key={m.id} className="flex items-start gap-2 max-w-full">
                    <UserAvatar avatarUrl={m.profile?.avatar_url} username={m.profile?.username ?? "unknown"} className="size-6 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-bold text-[10px] text-primary truncate max-w-[90px]">
                          {m.profile?.username ?? "unknown"}
                        </span>
                        <span className="text-[8px] text-muted-foreground font-mono">
                          {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-muted-foreground bg-white/5 px-2.5 py-1 rounded-xl rounded-tl-sm mt-0.5 break-words max-w-full">
                        {m.content}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={chatBottomRef} />
            </div>

            <form onSubmit={sendHomeChat} className="flex items-center gap-1.5 shrink-0 border-t border-white/5 pt-2">
              {!user ? (
                <Link to="/auth" className="flex-1 text-center text-xs py-1.5 rounded-lg bg-white/5 text-muted-foreground hover:text-foreground font-medium">
                  Sign in to chat
                </Link>
              ) : (
                <>
                  <Input
                    value={chatText}
                    maxLength={500}
                    onChange={(e) => setChatText(e.target.value)}
                    placeholder="Say something..."
                    className="flex-1 h-8 text-xs bg-white/5 border-white/10 rounded-lg"
                  />
                  <Button type="submit" size="icon" className="h-8 w-8 bg-gradient-primary text-primary-foreground rounded-lg cursor-pointer">
                    <Send className="size-3" />
                  </Button>
                </>
              )}
            </form>
          </div>
        </div>

        {/* Right Column: Matches list (col-span-2) - order-1 on mobile, order-2 on desktop */}
        <div className="lg:col-span-2 order-1 lg:order-2 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-extrabold uppercase tracking-widest flex items-center gap-2">
                <span className="size-2 rounded-full bg-primary animate-pulse" /> THE MATCH ARENA
              </h2>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mt-0.5">LOCK IN YOUR SCORES BEFORE THE KICKOFF LOCK</p>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Search Input */}
              <div className="relative flex-1 md:flex-none md:w-64">
                <Input
                  placeholder="Search teams or venues..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-white/5 border-white/10 rounded-xl pr-8 text-sm h-10"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-3 text-muted-foreground hover:text-foreground text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex overflow-x-auto gap-2 mb-2 pb-1 scrollbar-none">
            <TabButton active={filter === "all"} onClick={() => setFilter("all")}>
              All ({matchesQ.data?.length ?? 0})
            </TabButton>
            <TabButton active={filter === "upcoming"} onClick={() => setFilter("upcoming")}>
              Upcoming ({matchesQ.data?.filter(m => m.status !== "finished").length ?? 0})
            </TabButton>
            <TabButton active={filter === "finished"} onClick={() => setFilter("finished")}>
              Results ({matchesQ.data?.filter(m => m.status === "finished").length ?? 0})
            </TabButton>
          </div>

          {nextMatch && (
            <div className="glass rounded-3xl p-5 mb-6 border border-white/10 relative overflow-hidden">
              {/* Decorative background glow */}
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
              
              {/* Header */}
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-[var(--gold)] animate-pulse shrink-0" />
                  <h3 className="font-extrabold text-xs uppercase tracking-widest text-[var(--gold)]">
                    Next Upcoming Match Predictor
                  </h3>
                </div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
                  {nextMatchPredsQ.isLoading ? (
                    <span className="animate-pulse">🔮 Loading predictions...</span>
                  ) : (
                    <>🔮 {nextMatchStats.total > 0 ? `${nextMatchStats.total} ${nextMatchStats.total === 1 ? "person" : "people"}` : "* people"} predicted</>
                  )}
                </div>
              </div>

              {/* Match Display & Predict Action */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex-1 flex items-center gap-4 min-w-0">
                  {/* Home Team */}
                  <div className="flex items-center gap-2">
                    <span className="text-3xl shrink-0">{nextMatch.home_team.flag_emoji}</span>
                    <span className="font-bold text-sm md:text-base tracking-wider">{nextMatch.home_team.code}</span>
                  </div>
                  
                  <span className="text-xs uppercase font-extrabold text-muted-foreground bg-white/5 px-2 py-0.5 rounded-md font-mono shrink-0">VS</span>

                  {/* Away Team */}
                  <div className="flex items-center gap-2">
                    <span className="text-3xl shrink-0">{nextMatch.away_team.flag_emoji}</span>
                    <span className="font-bold text-sm md:text-base tracking-wider">{nextMatch.away_team.code}</span>
                  </div>

                  {/* Stage / Kickoff */}
                  <div className="text-[10px] text-muted-foreground ml-2 border-l border-white/10 pl-3 hidden sm:block truncate">
                    <span className="uppercase font-semibold text-foreground/80">{nextMatch.stage}</span>
                    <span className="mx-1.5">•</span>
                    <span>{new Date(nextMatch.kickoff_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                </div>

                {/* Quick Prediction Action */}
                <div className="shrink-0 flex items-center gap-3">
                  {predMap.has(nextMatch.id) ? (
                    <div className="text-xs font-semibold px-4 py-2 bg-white/5 border border-white/5 rounded-xl text-primary flex items-center gap-2">
                      <span>Your prediction:</span>
                      <span className="font-mono text-sm font-bold bg-white/5 px-2 py-0.5 rounded-lg border border-white/5 text-foreground">
                        {predMap.get(nextMatch.id)!.predicted_home} – {predMap.get(nextMatch.id)!.predicted_away}
                      </span>
                    </div>
                  ) : (
                    <Button
                      onClick={() => setOpenMatch(nextMatch)}
                      size="sm"
                      className="bg-gradient-primary text-primary-foreground font-semibold text-xs tracking-wider uppercase px-4 py-2.5 rounded-xl cursor-pointer"
                    >
                      Predict Now
                    </Button>
                  )}
                </div>
              </div>

              {/* Predictor Percentage Bars */}
              <div className="mt-5 space-y-2">
                {nextMatchPredsQ.isLoading ? (
                  <div className="text-center py-3.5 text-xs font-bold text-muted-foreground bg-white/[0.01] rounded-2xl border border-dashed border-white/10 uppercase tracking-widest font-mono animate-pulse">
                    ⚡ Live probability loading...
                  </div>
                ) : !user ? (
                  <div className="text-center py-3.5 text-xs font-bold text-muted-foreground bg-white/[0.01] rounded-2xl border border-dashed border-white/10 uppercase tracking-widest">
                    🔒 Sign in & add prediction to see live predictor
                  </div>
                ) : !predMap.has(nextMatch.id) ? (
                  <div className="text-center py-3.5 text-xs font-bold text-muted-foreground bg-white/[0.01] rounded-2xl border border-dashed border-white/10 uppercase tracking-widest">
                    🔒 Add prediction to see live predictor
                  </div>
                ) : nextMatchStats.total === 0 ? (
                  <div className="text-center py-3.5 text-xs font-bold text-muted-foreground bg-white/[0.01] rounded-2xl border border-dashed border-white/10 uppercase tracking-widest font-mono animate-pulse">
                    ⚡ Live probability loading...
                  </div>
                ) : (
                  <div>
                    {/* Visual Bar */}
                    <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden flex">
                      <div 
                        style={{ width: `${nextMatchStats.homeWinPct}%` }} 
                        className="bg-gradient-primary h-full transition-all duration-500" 
                        title={`Home Win: ${nextMatchStats.homeWinPct}%`}
                      />
                      <div 
                        style={{ width: `${nextMatchStats.drawPct}%` }} 
                        className="bg-white/20 h-full transition-all duration-500" 
                        title={`Draw: ${nextMatchStats.drawPct}%`}
                      />
                      <div 
                        style={{ width: `${nextMatchStats.awayWinPct}%` }} 
                        className="bg-gradient-gold h-full transition-all duration-500" 
                        title={`Away Win: ${nextMatchStats.awayWinPct}%`}
                      />
                    </div>
                    
                    {/* Legend & Percentages */}
                    <div className="flex items-center justify-between text-[10px] font-bold mt-2 text-muted-foreground font-mono">
                      <div className="flex items-center gap-1.5 text-foreground">
                        <span className="size-2 rounded-full bg-gradient-primary" />
                        <span>{nextMatch.home_team.code} Win ({nextMatchStats.homeWinPct}%)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="size-2 rounded-full bg-white/20" />
                        <span>Draw ({nextMatchStats.drawPct}%)</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[var(--gold)]">
                        <span className="size-2 rounded-full bg-gradient-gold" />
                        <span>{nextMatch.away_team.code} Win ({nextMatchStats.awayWinPct}%)</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {matchesQ.isLoading ? (
            <div className="grid md:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="glass h-44 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : slicedMatches.length === 0 ? (
            <div className="text-center py-12 glass rounded-2xl border-white/5">
              <p className="text-muted-foreground text-sm">No matches found.</p>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 gap-4">
                {slicedMatches.map((m) => (
                  <MatchCard
                    key={m.id}
                    match={m}
                    prediction={predMap.get(m.id)}
                    onClick={() => setOpenMatch(m)}
                  />
                ))}
              </div>

              {filteredMatches.length > visibleCount && (
                <div className="flex justify-center mt-6">
                  <Button
                    onClick={() => setVisibleCount((prev) => prev + 10)}
                    variant="outline"
                    className="border-white/5 bg-white/[0.02] hover:bg-white/[0.05] text-xs font-semibold uppercase tracking-widest px-6 py-2 h-10 rounded-xl cursor-pointer"
                  >
                    Show More Matches
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

      </div>

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
          status={openMatch.status}
          existing={predMap.get(openMatch.id)}
          onSaved={() => predsQ.refetch()}
        />
      )}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
        active
          ? "bg-gradient-primary text-primary-foreground border-transparent shadow-[var(--shadow-glow)]"
          : "bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground border-white/5"
      }`}
    >
      {children}
    </button>
  );
}
