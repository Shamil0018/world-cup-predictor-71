import { Link, useRouter } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, MessageCircle, ListOrdered, Calendar, Shield, LogOut, User as UserIcon } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function Navbar() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const router = useRouter();

  const nav = [
    { to: "/", label: "Matches", icon: Calendar },
    { to: "/leaderboard", label: "Leaderboard", icon: ListOrdered },
    { to: "/chat", label: "Chat", icon: MessageCircle },
  ];

  return (
    <header className="sticky top-0 z-40 glass border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="grid place-items-center size-9 rounded-xl bg-[var(--gradient-gold)] shadow-[var(--shadow-glow)]">
            <Trophy className="size-5 text-[oklch(0.18_0.02_240)]" />
          </div>
          <div className="leading-none">
            <div className="text-sm uppercase tracking-[0.2em] text-muted-foreground">FIFA 2026</div>
            <div className="font-bold text-lg gradient-gold-text">PredictCup</div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition flex items-center gap-2"
              activeProps={{ className: "text-foreground bg-white/5" }}
            >
              <n.icon className="size-4" /> {n.label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              to="/admin"
              className="px-3 py-2 rounded-lg text-sm text-accent hover:bg-accent/10 transition flex items-center gap-2"
              activeProps={{ className: "bg-accent/10" }}
            >
              <Shield className="size-4" /> Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {user && profile ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full pl-1 pr-3 py-1 hover:bg-white/5 transition">
                  <Avatar className="size-8 ring-1 ring-white/10">
                    <AvatarImage src={profile.avatar_url ?? undefined} />
                    <AvatarFallback className="bg-primary/20 text-primary text-xs">
                      {profile.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-sm font-medium">{profile.username}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onClick={() => router.navigate({ to: "/u/$username", params: { username: profile.username } })}>
                  <UserIcon className="size-4 mr-2" /> My profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.navigate({ to: "/settings" })}>
                  Edit profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={async () => { await signOut(); router.navigate({ to: "/" }); }}>
                  <LogOut className="size-4 mr-2" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm" className="bg-[var(--gradient-primary)] text-primary-foreground hover:opacity-90 shadow-[var(--shadow-glow)]">
              <Link to="/auth">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
