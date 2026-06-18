import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/UserAvatar";
import { Smile, Send } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";

export const Route = createFileRoute("/chat")({
  head: () => ({ meta: [{ title: "Live chat · PredictCup" }, { name: "description", content: "Global live chat for World Cup 2026 fans." }] }),
  component: ChatPage,
});

type Msg = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profile?: { username: string; avatar_url: string | null };
};

const EMOJIS = ["⚽", "🏆", "🔥", "🎯", "😂", "😎", "💪", "🤯", "👏", "🇧🇷", "🇦🇷", "🇫🇷", "🇩🇪", "🇪🇸", "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "🇺🇸", "🇲🇽", "🇵🇹", "🇮🇹", "🇯🇵", "💯", "❤️", "🙌", "⚡"];

function ChatPage() {
  const { user, profile } = useAuth();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  
  // Local profile cache to prevent duplicate queries on realtime updates
  const profileCacheRef = useRef<Map<string, { username: string; avatar_url: string | null }>>(new Map());

  const fetchInitial = async () => {
    const { data: rows, error } = await supabase
      .from("chat_messages")
      .select("id,content,created_at,user_id")
      .order("created_at", { ascending: false })
      .limit(80);
    if (error) { toast.error(error.message); setLoading(false); return; }
    const ordered = (rows ?? []).reverse() as Msg[];
    const ids = Array.from(new Set(ordered.map((m) => m.user_id)));
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id,username,avatar_url").in("id", ids);
      if (profs) {
        profs.forEach((p) => {
          profileCacheRef.current.set(p.id, { username: p.username, avatar_url: p.avatar_url });
        });
      }
      const map = new Map((profs ?? []).map((p: { id: string; username: string; avatar_url: string | null }) => [p.id, p]));
      ordered.forEach((m) => { const p = map.get(m.user_id); if (p) m.profile = { username: p.username, avatar_url: p.avatar_url }; });
    }
    setMsgs(ordered);
    setLoading(false);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "instant" as ScrollBehavior }), 50);
  };

  useEffect(() => {
    fetchInitial();
    const ch = supabase
      .channel("chat-feed")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, async (payload) => {
        const m = payload.new as Msg;
        
        let prof = profileCacheRef.current.get(m.user_id);
        if (!prof) {
          const { data } = await supabase.from("profiles").select("username,avatar_url").eq("id", m.user_id).maybeSingle();
          if (data) {
            prof = data as { username: string; avatar_url: string | null };
            profileCacheRef.current.set(m.user_id, prof);
          }
        }
        
        if (prof) {
          m.profile = prof;
        }
        
        setMsgs((prev) => [...prev, m]);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 30);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles" }, (payload) => {
        const updatedProf = payload.new as { id: string; username: string; avatar_url: string | null };
        profileCacheRef.current.set(updatedProf.id, {
          username: updatedProf.username,
          avatar_url: updatedProf.avatar_url,
        });
        setMsgs((prev) =>
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

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !text.trim()) return;
    const content = text.trim().slice(0, 500);
    setText("");
    const { error } = await supabase.from("chat_messages").insert({ user_id: user.id, content });
    if (error) toast.error(error.message);
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      <div className="glass rounded-3xl overflow-hidden flex flex-col h-[calc(100vh-9rem)]">
        <div className="px-5 py-4 border-b border-white/5">
          <h1 className="font-bold text-lg">Global chat</h1>
          <p className="text-xs text-muted-foreground">Be respectful. 500 char max.</p>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {loading && <p className="text-muted-foreground text-sm">Loading…</p>}
          {!loading && msgs.length === 0 && <p className="text-muted-foreground text-sm">No messages yet. Be the first!</p>}
          {msgs.map((m) => (
            <MsgRow key={m.id} m={m} mine={m.user_id === user?.id} />
          ))}
          <div ref={bottomRef} />
        </div>
        <form onSubmit={send} className="p-3 border-t border-white/5 flex items-center gap-2">
          {!user ? (
            <Link to="/auth" className="flex-1 text-center text-sm py-2 rounded-lg bg-white/5 text-muted-foreground hover:text-foreground">Sign in to chat</Link>
          ) : (
            <>
              <UserAvatar avatarUrl={profile?.avatar_url} username={profile?.username ?? "unknown"} className="size-8" />
              <Input value={text} maxLength={500} onChange={(e) => setText(e.target.value)} placeholder="Say something..." className="flex-1" />
              <Popover>
                <PopoverTrigger asChild>
                  <Button type="button" variant="ghost" size="icon"><Smile className="size-5" /></Button>
                </PopoverTrigger>
                <PopoverContent className="w-64">
                  <div className="grid grid-cols-8 gap-1">
                    {EMOJIS.map((e) => (
                      <button key={e} type="button" className="text-xl hover:bg-white/5 rounded p-1" onClick={() => setText((t) => t + e)}>{e}</button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              <Button type="submit" size="icon" className="bg-gradient-primary text-primary-foreground cursor-pointer"><Send className="size-4" /></Button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}

function MsgRow({ m, mine }: { m: Msg; mine: boolean }) {
  return (
    <div className={`flex items-start gap-3 ${mine ? "flex-row-reverse" : ""}`}>
      <Link to="/u/$username" params={{ username: m.profile?.username ?? "" }}>
        <UserAvatar avatarUrl={m.profile?.avatar_url} username={m.profile?.username ?? "unknown"} className="size-8" />
      </Link>
      <div className={`max-w-[75%] ${mine ? "text-right" : ""}`}>
        <div className="text-[11px] text-muted-foreground">
          {m.profile?.username ?? "unknown"} · {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
        <div className={`mt-1 inline-block px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words ${mine ? "bg-gradient-primary text-primary-foreground rounded-tr-sm" : "bg-white/5 rounded-tl-sm"}`}>
          {m.content}
        </div>
      </div>
    </div>
  );
}
