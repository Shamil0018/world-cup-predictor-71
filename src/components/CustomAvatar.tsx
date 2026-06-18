import React from "react";

export interface CustomAvatarConfig {
  id: string;
  name: string;
  player: string;
  team: string;
}

export const CUSTOM_AVATARS: CustomAvatarConfig[] = [
  { id: "messi", name: "Lionel Messi", player: "L. Messi (#10)", team: "Argentina" },
  { id: "mbappe", name: "Kylian Mbappé", player: "K. Mbappé (#10)", team: "France" },
  { id: "bellingham", name: "Jude Bellingham", player: "J. Bellingham (#10)", team: "England" },
  { id: "debruyne", name: "Kevin De Bruyne", player: "K. De Bruyne (#7)", team: "Belgium" },
  { id: "vinicius", name: "Vinícius Júnior", player: "Vinícius Jr. (#7)", team: "Brazil" },
  { id: "vandijk", name: "Virgil van Dijk", player: "V. van Dijk (#4)", team: "Netherlands" },
  { id: "ronaldo", name: "Cristiano Ronaldo", player: "C. Ronaldo (#7)", team: "Portugal" },
  { id: "yamal", name: "Lamine Yamal", player: "L. Yamal (#19)", team: "Spain" },
  { id: "chiesa", name: "Federico Chiesa", player: "F. Chiesa (#14)", team: "Italy" },
  { id: "modric", name: "Luka Modrić", player: "L. Modrić (#10)", team: "Croatia" },
];

export function CustomAvatar({ id, className = "size-8" }: { id: string; className?: string }) {
  // Common colors
  const skinLight = "#FAD0C4";
  const skinFair = "#FCDFD7";
  const skinTan = "#E0A96D";
  const skinDark = "#8D5B4C";
  const skinDarker = "#5C382E";

  const renderDetails = () => {
    switch (id) {
      case "messi": // Argentina #10
        return (
          <>
            {/* Background Gradient */}
            <defs>
              <linearGradient id="grad-messi" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#75C5F0" />
                <stop offset="50%" stopColor="#FFFFFF" />
                <stop offset="100%" stopColor="#75C5F0" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="50" fill="url(#grad-messi)" />
            {/* Torso/Shirt */}
            <path d="M 15 100 Q 15 75 35 73 L 65 73 Q 85 75 85 100 Z" fill="#75C5F0" />
            <rect x="31" y="73" width="7" height="27" fill="#FFFFFF" />
            <rect x="47" y="73" width="6" height="27" fill="#FFFFFF" />
            <rect x="62" y="73" width="7" height="27" fill="#FFFFFF" />
            {/* Collar */}
            <path d="M 40 73 Q 50 81 60 73 Z" fill="#FFD700" />
            {/* Neck */}
            <rect x="43" y="58" width="14" height="16" fill={skinFair} />
            {/* Face */}
            <circle cx="50" cy="46" r="16" fill={skinFair} />
            {/* Eyes */}
            <circle cx="44" cy="45" r="1.5" fill="#333333" />
            <circle cx="56" cy="45" r="1.5" fill="#333333" />
            {/* Eyebrows */}
            <path d="M 40 41 Q 44 39 48 42" stroke="#5C4033" strokeWidth="1.5" fill="none" />
            <path d="M 52 42 Q 56 39 60 41" stroke="#5C4033" strokeWidth="1.5" fill="none" />
            {/* Hair */}
            <path d="M 33 42 Q 43 25 64 30 Q 67 36 67 42 Q 62 33 45 36 Z" fill="#5C4033" />
            {/* Beard */}
            <path d="M 34 46 Q 34 62 50 64 Q 66 62 66 46 Q 66 58 50 60 Q 34 58 34 46 Z" fill="#8B5A2B" />
            <path d="M 44 55 Q 50 58 56 55 Q 50 56 44 55 Z" fill="#5C4033" /> {/* Mustache */}
            {/* Number 10 */}
            <text x="50" y="93" fontSize="12" fontWeight="900" textAnchor="middle" fill="#000000" fontFamily="sans-serif">10</text>
          </>
        );

      case "mbappe": // France #10
        return (
          <>
            <defs>
              <linearGradient id="grad-mbappe" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0F2027" />
                <stop offset="50%" stopColor="#203A43" />
                <stop offset="100%" stopColor="#2C5364" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="50" fill="url(#grad-mbappe)" />
            {/* Torso/Shirt */}
            <path d="M 15 100 Q 15 75 35 73 L 65 73 Q 85 75 85 100 Z" fill="#002060" />
            {/* Collar */}
            <path d="M 40 73 Q 50 81 60 73 Z" fill="#E41B17" />
            {/* Neck */}
            <rect x="43" y="58" width="14" height="16" fill={skinDark} />
            {/* Face */}
            <circle cx="50" cy="46" r="16" fill={skinDark} />
            {/* Eyes */}
            <circle cx="44" cy="46" r="1.5" fill="#111" />
            <circle cx="56" cy="46" r="1.5" fill="#111" />
            {/* Hair - Buzzcut */}
            <path d="M 33 42 Q 50 26 67 42 C 67 36 65 30 50 29 C 35 30 33 36 33 42 Z" fill="#111111" />
            {/* Number 10 */}
            <text x="50" y="93" fontSize="12" fontWeight="900" textAnchor="middle" fill="#FFFFFF" fontFamily="sans-serif">10</text>
          </>
        );

      case "bellingham": // England #10
        return (
          <>
            <defs>
              <linearGradient id="grad-bellingham" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#002060" />
                <stop offset="50%" stopColor="#FFFFFF" />
                <stop offset="100%" stopColor="#E41B17" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="50" fill="url(#grad-bellingham)" />
            {/* Torso/Shirt */}
            <path d="M 15 100 Q 15 75 35 73 L 65 73 Q 85 75 85 100 Z" fill="#FFFFFF" />
            <path d="M 15 88 L 22 84 L 25 100 Z" fill="#002060" /> {/* Sleeve details */}
            <path d="M 85 88 L 78 84 L 75 100 Z" fill="#002060" />
            {/* Collar */}
            <path d="M 40 73 Q 50 82 60 73 Z" fill="#002060" />
            {/* Neck */}
            <rect x="43" y="58" width="14" height="16" fill={skinTan} />
            {/* Face */}
            <circle cx="50" cy="46" r="16" fill={skinTan} />
            {/* Eyes */}
            <circle cx="44" cy="46" r="1.5" fill="#111" />
            <circle cx="56" cy="46" r="1.5" fill="#111" />
            {/* Hair - Curly high top fade */}
            <path d="M 33 40 C 31 34 35 27 44 26 C 47 23 53 23 56 26 C 65 27 69 34 67 40 C 65 41 62 38 50 38 C 38 38 35 41 33 40 Z" fill="#1a1a1a" />
            {/* Number 10 */}
            <text x="50" y="93" fontSize="12" fontWeight="900" textAnchor="middle" fill="#002060" fontFamily="sans-serif">10</text>
          </>
        );

      case "debruyne": // Belgium #7
        return (
          <>
            <defs>
              <linearGradient id="grad-debruyne" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#000000" />
                <stop offset="50%" stopColor="#E41B17" />
                <stop offset="100%" stopColor="#FFD700" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="50" fill="url(#grad-debruyne)" />
            {/* Torso/Shirt */}
            <path d="M 15 100 Q 15 75 35 73 L 65 73 Q 85 75 85 100 Z" fill="#B22222" />
            <path d="M 30 73 L 35 100 L 40 100 L 35 73 Z" fill="#000000" /> {/* Design lines */}
            <path d="M 70 73 L 65 100 L 60 100 L 65 73 Z" fill="#000000" />
            {/* Collar */}
            <path d="M 40 73 Q 50 80 60 73 Z" fill="#FFD700" />
            {/* Neck */}
            <rect x="43" y="58" width="14" height="16" fill={skinLight} />
            {/* Face */}
            <circle cx="50" cy="46" r="16" fill={skinLight} />
            {/* Eyes */}
            <circle cx="44" cy="45" r="1.5" fill="#4682B4" />
            <circle cx="56" cy="45" r="1.5" fill="#4682B4" />
            {/* Hair - Blond side sweep */}
            <path d="M 33 42 C 32 30 45 23 55 24 C 62 25 67 31 67 38 C 62 32 52 32 45 35 C 38 38 35 41 33 42 Z" fill="#FFD39B" />
            {/* Number 7 */}
            <text x="50" y="93" fontSize="12" fontWeight="900" textAnchor="middle" fill="#FFD700" fontFamily="sans-serif">7</text>
          </>
        );

      case "vinicius": // Brazil #7
        return (
          <>
            <defs>
              <linearGradient id="grad-vinicius" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#009C3B" />
                <stop offset="50%" stopColor="#FFDF00" />
                <stop offset="100%" stopColor="#002776" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="50" fill="url(#grad-vinicius)" />
            {/* Torso/Shirt */}
            <path d="M 15 100 Q 15 75 35 73 L 65 73 Q 85 75 85 100 Z" fill="#FFDF00" />
            {/* Collar */}
            <path d="M 40 73 Q 50 82 60 73 Z" fill="#009C3B" />
            {/* Neck */}
            <rect x="43" y="58" width="14" height="16" fill={skinDarker} />
            {/* Face */}
            <circle cx="50" cy="46" r="16" fill={skinDarker} />
            {/* Eyes */}
            <circle cx="44" cy="46" r="1.5" fill="#111" />
            <circle cx="56" cy="46" r="1.5" fill="#111" />
            {/* Hair - Curly high mohawk fade */}
            <path d="M 35 38 C 36 29 40 23 50 23 C 60 23 64 29 65 38 C 62 39 58 35 50 35 C 42 35 38 39 35 38 Z" fill="#0a0a0a" />
            {/* Number 7 */}
            <text x="50" y="93" fontSize="12" fontWeight="900" textAnchor="middle" fill="#002776" fontFamily="sans-serif">7</text>
          </>
        );

      case "vandijk": // Netherlands #4
        return (
          <>
            <defs>
              <linearGradient id="grad-vandijk" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF4F00" />
                <stop offset="50%" stopColor="#FFFFFF" />
                <stop offset="100%" stopColor="#21468B" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="50" fill="url(#grad-vandijk)" />
            {/* Torso/Shirt */}
            <path d="M 15 100 Q 15 75 35 73 L 65 73 Q 85 75 85 100 Z" fill="#FF4F00" />
            {/* Collar */}
            <path d="M 40 73 Q 50 81 60 73 Z" fill="#21468B" />
            {/* Neck */}
            <rect x="43" y="58" width="14" height="16" fill={skinTan} />
            {/* Face */}
            <circle cx="50" cy="46" r="16" fill={skinTan} />
            {/* Eyes */}
            <circle cx="44" cy="46" r="1.5" fill="#333" />
            <circle cx="56" cy="46" r="1.5" fill="#333" />
            {/* Beard stubble */}
            <path d="M 34 47 Q 34 62 50 63 Q 66 62 66 47 Q 66 59 50 60 Q 34 59 34 47 Z" fill="#4B3621" opacity="0.4" />
            {/* Hair - Slicked back into a high bun */}
            <path d="M 34 44 Q 38 28 50 28 Q 62 28 66 44 C 64 36 58 31 50 31 C 42 31 36 36 34 44 Z" fill="#1f140e" />
            <circle cx="50" cy="24" r="5" fill="#1f140e" /> {/* Bun */}
            {/* Number 4 */}
            <text x="50" y="93" fontSize="12" fontWeight="900" textAnchor="middle" fill="#FFFFFF" fontFamily="sans-serif">4</text>
          </>
        );

      case "ronaldo": // Portugal #7
        return (
          <>
            <defs>
              <linearGradient id="grad-ronaldo" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#046A38" />
                <stop offset="50%" stopColor="#DA291C" />
                <stop offset="100%" stopColor="#FFC72C" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="50" fill="url(#grad-ronaldo)" />
            {/* Torso/Shirt */}
            <path d="M 15 100 Q 15 75 35 73 L 65 73 Q 85 75 85 100 Z" fill="#C21807" />
            <path d="M 15 78 L 30 73 L 30 100 Z" fill="#046A38" /> {/* Green sleeves details */}
            <path d="M 85 78 L 70 73 L 70 100 Z" fill="#046A38" />
            {/* Collar */}
            <path d="M 40 73 Q 50 81 60 73 Z" fill="#FFC72C" />
            {/* Neck */}
            <rect x="43" y="58" width="14" height="16" fill={skinTan} />
            {/* Face */}
            <circle cx="50" cy="46" r="16" fill={skinTan} />
            {/* Eyes */}
            <circle cx="44" cy="45" r="1.5" fill="#222" />
            <circle cx="56" cy="45" r="1.5" fill="#222" />
            {/* Eyebrows */}
            <path d="M 41 40 Q 45 38 48 41" stroke="#111" strokeWidth="1.5" fill="none" />
            <path d="M 52 41 Q 55 38 59 40" stroke="#111" strokeWidth="1.5" fill="none" />
            {/* Hair - Spikey neat haircut */}
            <path d="M 33 42 Q 35 25 50 22 Q 65 25 67 42 C 67 36 63 29 50 28 C 37 29 33 36 33 42 Z" fill="#000000" />
            <path d="M 46 22 L 50 16 L 54 22 Z" fill="#000000" /> {/* Little spikes */}
            {/* Number 7 */}
            <text x="50" y="93" fontSize="12" fontWeight="900" textAnchor="middle" fill="#FFC72C" fontFamily="sans-serif">7</text>
          </>
        );

      case "yamal": // Spain #19
        return (
          <>
            <defs>
              <linearGradient id="grad-yamal" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#AA151B" />
                <stop offset="50%" stopColor="#F1BF00" />
                <stop offset="100%" stopColor="#AA151B" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="50" fill="url(#grad-yamal)" />
            {/* Torso/Shirt */}
            <path d="M 15 100 Q 15 75 35 73 L 65 73 Q 85 75 85 100 Z" fill="#E41B17" />
            {/* Collar */}
            <path d="M 40 73 Q 50 81 60 73 Z" fill="#F1BF00" />
            {/* Neck */}
            <rect x="43" y="58" width="14" height="16" fill={skinDark} />
            {/* Face */}
            <circle cx="50" cy="46" r="16" fill={skinDark} />
            {/* Eyes */}
            <circle cx="44" cy="46" r="1.5" fill="#111" />
            <circle cx="56" cy="46" r="1.5" fill="#111" />
            {/* Hair - Curly youthful haircut */}
            <path d="M 33 41 C 32 32 37 25 50 25 C 63 25 68 32 67 41 C 64 42 60 37 50 37 C 40 37 36 42 33 41 Z" fill="#1a1a1a" />
            {/* Number 19 */}
            <text x="50" y="93" fontSize="11" fontWeight="900" textAnchor="middle" fill="#F1BF00" fontFamily="sans-serif">19</text>
          </>
        );

      case "chiesa": // Italy #14
        return (
          <>
            <defs>
              <linearGradient id="grad-chiesa" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0066BC" />
                <stop offset="50%" stopColor="#FFFFFF" />
                <stop offset="100%" stopColor="#008C45" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="50" fill="url(#grad-chiesa)" />
            {/* Torso/Shirt */}
            <path d="M 15 100 Q 15 75 35 73 L 65 73 Q 85 75 85 100 Z" fill="#0066BC" />
            {/* Collar */}
            <path d="M 40 73 Q 50 81 60 73 Z" fill="#FFFFFF" />
            {/* Neck */}
            <rect x="43" y="58" width="14" height="16" fill={skinFair} />
            {/* Face */}
            <circle cx="50" cy="46" r="16" fill={skinFair} />
            {/* Eyes */}
            <circle cx="44" cy="45" r="1.5" fill="#222" />
            <circle cx="56" cy="45" r="1.5" fill="#222" />
            {/* Hair - Spikey brown crop */}
            <path d="M 33 43 C 33 32 40 27 50 26 C 60 27 67 32 67 43 C 63 36 58 32 50 32 C 42 32 37 36 33 43 Z" fill="#8B4513" />
            {/* Number 14 */}
            <text x="50" y="93" fontSize="11" fontWeight="900" textAnchor="middle" fill="#FFFFFF" fontFamily="sans-serif">14</text>
          </>
        );

      case "modric": // Croatia #10
        return (
          <>
            <defs>
              <linearGradient id="grad-modric" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF0000" />
                <stop offset="50%" stopColor="#FFFFFF" />
                <stop offset="100%" stopColor="#0000FF" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="50" fill="url(#grad-modric)" />
            {/* Torso/Shirt - Checkerboard */}
            <path d="M 15 100 Q 15 75 35 73 L 65 73 Q 85 75 85 100 Z" fill="#FFFFFF" />
            <rect x="23" y="73" width="10" height="10" fill="#FF0000" />
            <rect x="43" y="73" width="10" height="10" fill="#FF0000" />
            <rect x="63" y="73" width="10" height="10" fill="#FF0000" />
            <rect x="33" y="83" width="10" height="10" fill="#FF0000" />
            <rect x="53" y="83" width="10" height="10" fill="#FF0000" />
            <rect x="23" y="93" width="10" height="10" fill="#FF0000" />
            <rect x="43" y="93" width="10" height="10" fill="#FF0000" />
            <rect x="63" y="93" width="10" height="10" fill="#FF0000" />
            {/* Collar */}
            <path d="M 40 73 Q 50 81 60 73 Z" fill="#0000FF" />
            {/* Neck */}
            <rect x="43" y="58" width="14" height="16" fill={skinFair} />
            {/* Face */}
            <circle cx="50" cy="46" r="16" fill={skinFair} />
            {/* Eyes */}
            <circle cx="44" cy="45" r="1.5" fill="#333" />
            <circle cx="56" cy="45" r="1.5" fill="#333" />
            {/* Hair - Blonde longish locks */}
            <path d="M 33 44 Q 31 23 50 23 Q 69 23 67 44 Q 65 30 50 31 Q 35 30 33 44 Z" fill="#E6C280" />
            {/* Hairband */}
            <path d="M 34 38 Q 50 36 66 38" stroke="#111111" strokeWidth="2" fill="none" />
            {/* Number 10 */}
            <text x="50" y="93" fontSize="12" fontWeight="900" textAnchor="middle" fill="#0000FF" fontFamily="sans-serif">10</text>
          </>
        );

      default:
        return <circle cx="50" cy="50" r="48" fill="#333" stroke="#666" strokeWidth="2" />;
    }
  };

  return (
    <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
      {renderDetails()}
    </svg>
  );
}
