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
  homeName: string;
  awayName: string;
  homeFlag: string;
  awayFlag: string;
  kickoffAt: string;
  existing?: { predicted_home: number; predicted_away: number };
  onSaved: () => void;
};

export function PredictionDialog(p: Props) {
  const { user } = useAuth();
  const [home, setHome] = useState(p.existing?.predicted_home ?? 1);
  const [away, setAway] = useState(p.existing?.predicted_away ?? 1);
  const [saving, setSaving] = useState(false);
  const locked = isLocked(p.kickoffAt);

  useEffect(() => {
    setHome(p.existing?.predicted_home ?? 1);
    setAway(p.existing?.predicted_away ?? 1);
  }, [p.existing, p.open]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("predictions").upsert(
      { user_id: user.id, match_id: p.matchId, predicted_home: home, predicted_away: away },
      { onConflict: "user_id,match_id" },
    );
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
        ) : locked ? (
          <p className="text-destructive">Predictions are locked (match has already started).</p>
        ) : (
          <div className="grid grid-cols-2 gap-6 py-4">
            <ScorePicker label={p.homeName} flag={p.homeFlag} value={home} setValue={setHome} />
            <ScorePicker label={p.awayName} flag={p.awayFlag} value={away} setValue={setAway} />
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={() => p.onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving || locked || !user} className="bg-gradient-primary text-primary-foreground cursor-pointer">
            {p.existing ? "Update" : "Submit"} prediction
          </Button>
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
