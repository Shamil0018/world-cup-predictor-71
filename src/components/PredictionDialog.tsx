import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { isLocked } from "@/lib/format";
import { toast } from "sonner";
import { Minus, Plus } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  matchId: string;
  stage: string;
  homeTeamId: string;
  awayTeamId: string;
  homeName: string;
  awayName: string;
  homeFlag: string;
  awayFlag: string;
  homeCode: string;
  awayCode: string;
  kickoffAt: string;
  status: "scheduled" | "live" | "finished" | "postponed";
  existing?: { predicted_home: number; predicted_away: number; predicted_winner_id: string | null } | null;
  onSaved: () => void;
};

export function PredictionDialog(p: Props) {
  const { user } = useAuth();
  const [home, setHome] = useState(p.existing?.predicted_home ?? 1);
  const [away, setAway] = useState(p.existing?.predicted_away ?? 1);
  const [predictedWinnerId, setPredictedWinnerId] = useState<string | null>(p.existing?.predicted_winner_id ?? null);
  const [saving, setSaving] = useState(false);
  const locked = isLocked(p.kickoffAt) || p.status !== "scheduled";

  useEffect(() => {
    setHome(p.existing?.predicted_home ?? 1);
    setAway(p.existing?.predicted_away ?? 1);
    setPredictedWinnerId(p.existing?.predicted_winner_id ?? null);
  }, [p.existing, p.open]);

  const alreadySubmitted = !!p.existing;

  const save = async () => {
    if (!user) return;
    if (alreadySubmitted) {
      toast.error("You already submitted a prediction for this match.");
      return;
    }
    if (p.stage !== "group" && !predictedWinnerId) {
      toast.error("Please choose which team will win/advance first.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("predictions").insert({
      user_id: user.id,
      match_id: p.matchId,
      predicted_home: home,
      predicted_away: away,
      predicted_winner_id: p.stage !== "group" ? predictedWinnerId : null,
    });
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Prediction locked in");
      p.onSaved();
      p.onOpenChange(false);
    }
  };

  return (
    <Dialog open={p.open} onOpenChange={p.onOpenChange}>
      <DialogContent className="glass border-white/10">
        <DialogHeader>
          <DialogTitle>Predict the result</DialogTitle>
        </DialogHeader>
        {!user ? (
          <p className="text-muted-foreground">Please sign in to predict.</p>
        ) : alreadySubmitted ? (
          <div className="py-4 text-center">
            <p className="text-muted-foreground mb-3 font-semibold">Your locked-in prediction:</p>
            <div className="text-4xl font-bold gradient-text tabular-nums mb-3">
              {p.homeFlag} {p.existing!.predicted_home} – {p.existing!.predicted_away} {p.awayFlag}
            </div>
            {p.stage !== "group" && p.existing!.predicted_winner_id && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary font-bold">
                🔮 Winner to advance: {p.existing!.predicted_winner_id === p.homeTeamId ? p.homeName : p.awayName}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-4">Predictions can only be saved once.</p>
          </div>
        ) : locked ? (
          <p className="text-destructive">Predictions are locked (match has already started).</p>
        ) : (
          <div className="py-2">
            {p.stage !== "group" && (
              <div className="text-center mb-6">
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3 font-semibold">Who will advance?</p>
                <div className="flex justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setPredictedWinnerId(p.homeTeamId);
                      if (home < away) {
                        // Align score to favor home team if home < away
                        setHome(1);
                        setAway(1);
                      }
                    }}
                    className={`flex-1 max-w-[160px] p-4 rounded-2xl glass border transition-all cursor-pointer flex flex-col items-center gap-2 ${
                      predictedWinnerId === p.homeTeamId 
                        ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(var(--primary-rgb),0.25)]" 
                        : "border-white/5 hover:border-white/20"
                    }`}
                  >
                    <span className="text-3xl">{p.homeFlag}</span>
                    <span className="font-bold tracking-wider text-xs truncate max-w-full">{p.homeName}</span>
                    <span className="text-[10px] text-muted-foreground uppercase">{p.homeCode}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPredictedWinnerId(p.awayTeamId);
                      if (away < home) {
                        // Align score to favor away team if away < home
                        setHome(1);
                        setAway(1);
                      }
                    }}
                    className={`flex-1 max-w-[160px] p-4 rounded-2xl glass border transition-all cursor-pointer flex flex-col items-center gap-2 ${
                      predictedWinnerId === p.awayTeamId 
                        ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(var(--primary-rgb),0.25)]" 
                        : "border-white/5 hover:border-white/20"
                    }`}
                  >
                    <span className="text-3xl">{p.awayFlag}</span>
                    <span className="font-bold tracking-wider text-xs truncate max-w-full">{p.awayName}</span>
                    <span className="text-[10px] text-muted-foreground uppercase">{p.awayCode}</span>
                  </button>
                </div>
              </div>
            )}

            {(p.stage === "group" || predictedWinnerId !== null) ? (
              <div className="grid grid-cols-2 gap-6 py-2">
                <ScorePicker 
                  label={p.homeName} 
                  flag={p.homeFlag} 
                  value={home} 
                  setValue={(v) => {
                    setHome(v);
                    if (p.stage !== "group") {
                      if (v > away) setPredictedWinnerId(p.homeTeamId);
                      else if (away > v) setPredictedWinnerId(p.awayTeamId);
                    }
                  }} 
                />
                <ScorePicker 
                  label={p.awayName} 
                  flag={p.awayFlag} 
                  value={away} 
                  setValue={(v) => {
                    setAway(v);
                    if (p.stage !== "group") {
                      if (home > v) setPredictedWinnerId(p.homeTeamId);
                      else if (v > home) setPredictedWinnerId(p.awayTeamId);
                    }
                  }} 
                />
              </div>
            ) : (
              <div className="text-center py-6 text-sm text-muted-foreground border border-dashed border-white/5 rounded-2xl">
                👆 Select which team wins the match first.
              </div>
            )}
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={() => p.onOpenChange(false)}>Close</Button>
          {!alreadySubmitted && (
            <Button 
              onClick={save} 
              disabled={saving || locked || !user || (p.stage !== "group" && !predictedWinnerId)} 
              className="bg-gradient-primary text-primary-foreground cursor-pointer"
            >
              Submit prediction
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ScorePicker({ label, flag, value, setValue }: { label: string; flag: string; value: number; setValue: (n: number) => void }) {
  return (
    <div className="text-center">
      <div className="text-3xl mb-1">{flag}</div>
      <div className="text-sm font-medium mb-3 truncate">{label}</div>
      <div className="flex items-center justify-center gap-3">
        <Button size="icon" variant="outline" onClick={() => setValue(Math.max(0, value - 1))} className="cursor-pointer">
          <Minus className="size-4" />
        </Button>
        <input
          type="number"
          min={0}
          max={20}
          value={value}
          onFocus={(e) => e.target.select()}
          onChange={(e) => {
            const v = parseInt(e.target.value);
            if (!isNaN(v)) {
              setValue(Math.max(0, Math.min(20, v)));
            } else {
              setValue(0);
            }
          }}
          className="text-5xl font-bold tabular-nums w-16 text-center bg-transparent focus:outline-none border-b border-dashed border-white/20 focus:border-primary gradient-text [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <Button size="icon" variant="outline" onClick={() => setValue(Math.min(20, value + 1))} className="cursor-pointer">
          <Plus className="size-4" />
        </Button>
      </div>
    </div>
  );
}
