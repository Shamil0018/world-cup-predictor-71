import { Link, useRouter } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/UserAvatar";
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
    <>
      <header className="sticky top-0 z-40 glass border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="grid place-items-center size-9 rounded-xl bg-gradient-gold shadow-[var(--shadow-glow)]">
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
                    <UserAvatar avatarUrl={profile.avatar_url} username={profile.username} className="size-8" />
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
              <Button asChild size="sm" className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-[var(--shadow-glow)]">
                <Link to="/auth">Sign in</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/90 backdrop-blur-lg border-t border-white/5 px-4 py-2 flex items-center justify-around pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
        {nav.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            className="flex flex-col items-center justify-center py-1 text-muted-foreground hover:text-foreground transition flex-1"
            activeProps={{ className: "text-primary font-medium" }}
          >
            <n.icon className="size-5 mb-1" />
            <span className="text-[10px] tracking-wide">{n.label}</span>
          </Link>
        ))}
        {isAdmin && (
          <Link
            to="/admin"
            className="flex flex-col items-center justify-center py-1 text-accent hover:text-accent/80 transition flex-1"
            activeProps={{ className: "text-accent font-medium" }}
          >
            <Shield className="size-5 mb-1" />
            <span className="text-[10px] tracking-wide">Admin</span>
          </Link>
        )}
      </nav>
    </>
  );
}
