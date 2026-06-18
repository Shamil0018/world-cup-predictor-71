import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { UserAvatar } from "@/components/UserAvatar";
import { CustomAvatar, CUSTOM_AVATARS } from "@/components/CustomAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload } from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings · PredictCup" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [avatarBlob, setAvatarBlob] = useState<Blob | null>(null);
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? "");
      setBio(profile.bio ?? "");
      setAvatar(profile.avatar_url ?? null);
    }
  }, [profile]);

  const onPickFile = (f: File) => {
    if (f.size > 1024 * 1024) return toast.error("Image must be < 1 MB");
    setProcessing(true);
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const size = 256;
        canvas.width = size; canvas.height = size;
        const scale = Math.max(size / img.width, size / img.height);
        const w = img.width * scale, h = img.height * scale;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
        
        const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
        setAvatar(dataUrl);

        canvas.toBlob((blob) => {
          if (blob) setAvatarBlob(blob);
          setProcessing(false);
        }, "image/jpeg", 0.82);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(f);
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);

    let avatarUrlToSave = avatar;

    if (avatarBlob) {
      try {
        const fileExt = "jpg";
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        const { data, error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(fileName, avatarBlob, {
            upsert: true,
            contentType: "image/jpeg"
          });

        if (uploadError) {
          console.error("Storage upload failed:", uploadError);
          toast.error("Avatar upload failed: " + uploadError.message);
          setSaving(false);
          return;
        } else if (data) {
          const { data: { publicUrl } } = supabase.storage
            .from("avatars")
            .getPublicUrl(fileName);
          avatarUrlToSave = publicUrl;
        }
      } catch (err: any) {
        console.error("Error uploading avatar:", err);
        toast.error("Error uploading avatar: " + (err?.message || err));
        setSaving(false);
        return;
      }
    }

    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName || null, bio: bio || null, avatar_url: avatarUrlToSave })
      .eq("id", user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    await refreshProfile();
  };

  if (!profile) return <div className="container mx-auto px-4 py-10">Loading…</div>;

  return (
    <div className="container mx-auto px-4 py-10 max-w-xl">
      <h1 className="text-3xl font-bold mb-6">Edit profile</h1>
      <div className="glass rounded-3xl p-6 space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-5">
            <UserAvatar avatarUrl={avatar} username={profile.username} className="size-20" />
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && onPickFile(e.target.files[0])}
              />
              <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm">
                <Upload className="size-4" /> Upload Custom Photo
              </span>
            </label>
          </div>

          <div>
            <Label className="text-xs uppercase tracking-widest text-muted-foreground mb-3 block">Or select a legend avatar</Label>
            <div className="grid grid-cols-5 gap-3">
              {CUSTOM_AVATARS.map((av) => {
                const isSelected = avatar === `custom://${av.id}`;
                return (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => {
                      setAvatar(`custom://${av.id}`);
                      setAvatarBlob(null); // Clear file upload
                    }}
                    className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition hover:scale-105 cursor-pointer ${
                      isSelected ? "border-primary shadow-[var(--shadow-glow)]" : "border-white/5 hover:border-white/20"
                    }`}
                    title={`${av.name} (${av.team})`}
                  >
                    <CustomAvatar id={av.id} className="w-full h-full" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div>
          <Label className="text-xs uppercase tracking-widest text-muted-foreground">Username</Label>
          <Input value={profile.username} disabled className="mt-1 opacity-60" />
        </div>
        <div>
          <Label className="text-xs uppercase tracking-widest text-muted-foreground">Display name</Label>
          <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label className="text-xs uppercase tracking-widest text-muted-foreground">Bio</Label>
          <Textarea value={bio} maxLength={240} onChange={(e) => setBio(e.target.value)} className="mt-1" rows={3} />
        </div>
        <Button onClick={save} disabled={saving || processing} className="bg-gradient-primary text-primary-foreground cursor-pointer">
          {saving ? "Saving…" : processing ? "Processing image…" : "Save"}
        </Button>
      </div>
    </div>
  );
}
