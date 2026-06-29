import { useEffect, useState, useRef } from "react";
import mbappeDictatorImg from "@/assets/mbappe_dictator.jpeg";
import anaMaraduAudio from "@/assets/ana_maradu.m4a";
import { Volume2, VolumeX, ShieldAlert } from "lucide-react";

interface MbappePopupProps {
  onClose: () => void;
}

export function MbappePopup({ onClose }: MbappePopupProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize audio
    const audio = new Audio(anaMaraduAudio);
    audio.loop = true;
    audioRef.current = audio;

    // Try to play audio immediately
    const playAudio = () => {
      audio.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err) => {
          console.log("Autoplay blocked. Waiting for user interaction...", err);
        });
    };

    playAudio();

    // In case of browser autoplay blocking, play audio on the first user interaction
    const handleInteraction = () => {
      if (audioRef.current && !isPlaying) {
        audioRef.current.play()
          .then(() => {
            setIsPlaying(true);
            window.removeEventListener("click", handleInteraction);
          });
      }
    };
    window.addEventListener("click", handleInteraction);

    return () => {
      window.removeEventListener("click", handleInteraction);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Sync mute state
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const handleEnter = () => {
    // Save to sessionStorage so it only shows once per session
    sessionStorage.setItem("seen_mbappe_popup", "true");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
      <div className="relative glass border border-red-500/20 max-w-sm w-full rounded-3xl p-6 text-center shadow-[0_0_50px_rgba(239,68,68,0.15)] flex flex-col items-center">
        {/* Floating sound toggle */}
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4 animate-pulse" />}
        </button>

        {/* Top Header Label */}
        <div className="flex items-center gap-1.5 text-red-500 bg-red-500/10 px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest mb-4 font-mono border border-red-500/20">
          <ShieldAlert className="size-3.5" />
          <span>General Decree</span>
        </div>

        {/* Welcome Text */}
        <h2 className="text-2xl font-extrabold uppercase tracking-wider bg-gradient-to-r from-red-500 via-amber-500 to-red-500 bg-clip-text text-transparent mb-4 font-sans drop-shadow">
          Welcome to Knockout
        </h2>

        {/* Dictator Image */}
        <div className="relative group size-56 rounded-2xl overflow-hidden border-2 border-red-500/30 mb-6 shadow-2xl transition-all duration-500 hover:border-red-500/60 hover:scale-[1.02]">
          <img
            src={mbappeDictatorImg}
            alt="Kylian Mbappe Dictator"
            className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
        </div>

        {/* Dictum Text */}
        <p className="text-sm font-semibold tracking-wide text-foreground/90 uppercase font-mono bg-white/5 px-4 py-2.5 rounded-xl border border-white/5 mb-6 text-center italic">
          "play carefully, foyzaah!"
        </p>

        {/* Enter CTA */}
        <button
          onClick={handleEnter}
          className="w-full bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold uppercase tracking-widest text-xs py-3.5 px-6 rounded-xl border border-white/10 shadow-[0_0_20px_rgba(239,68,68,0.25)] hover:shadow-[0_0_30px_rgba(239,68,68,0.4)] cursor-pointer active:scale-[0.98] transition-all font-mono"
        >
          Enter the Arena
        </button>
      </div>
    </div>
  );
}
