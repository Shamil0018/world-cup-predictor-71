import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CustomAvatar } from "@/components/CustomAvatar";

interface UserAvatarProps {
  avatarUrl: string | null | undefined;
  username: string;
  className?: string;
}

export function UserAvatar({ avatarUrl, username, className = "size-8" }: UserAvatarProps) {
  const isCustom = avatarUrl?.startsWith("custom://");

  if (isCustom) {
    const avatarId = avatarUrl!.replace("custom://", "");
    return (
      <div className={`rounded-full overflow-hidden shrink-0 aspect-square ${className}`}>
        <CustomAvatar id={avatarId} className="w-full h-full" />
      </div>
    );
  }

  return (
    <Avatar className={`${className} ring-1 ring-white/10 shrink-0`}>
      <AvatarImage src={avatarUrl ?? undefined} />
      <AvatarFallback className="bg-primary/20 text-primary text-[10px]">
        {username.slice(0, 2).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}
