import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const seedTeamsFn = createServerFn({ method: "POST" })
  .handler(async () => {
    const teams = [
      { code: 'ALG', name: 'Algeria', flag_emoji: '🇩🇿', group_letter: 'Group A' },
      { code: 'ARG', name: 'Argentina', flag_emoji: '🇦🇷', group_letter: 'Group B' },
      { code: 'AUS', name: 'Australia', flag_emoji: '🇦🇺', group_letter: 'Group C' },
      { code: 'AUT', name: 'Austria', flag_emoji: '🇦🇹', group_letter: 'Group D' },
      { code: 'BEL', name: 'Belgium', flag_emoji: '🇧🇪', group_letter: 'Group E' },
      { code: 'BIH', name: 'Bosnia and Herzegovina', flag_emoji: '🇧🇦', group_letter: 'Group F' },
      { code: 'BRA', name: 'Brazil', flag_emoji: '🇧🇷', group_letter: 'Group A' },
      { code: 'CAN', name: 'Canada', flag_emoji: '🇨🇦', group_letter: 'Group B' },
      { code: 'CPV', name: 'Cape Verde', flag_emoji: '🇨🇻', group_letter: 'Group C' },
      { code: 'COL', name: 'Colombia', flag_emoji: '🇨🇴', group_letter: 'Group D' },
      { code: 'CRO', name: 'Croatia', flag_emoji: '🇭🇷', group_letter: 'Group E' },
      { code: 'CUW', name: 'Curacao', flag_emoji: '🇨🇼', group_letter: 'Group F' },
      { code: 'CZE', name: 'Czechia', flag_emoji: '🇨🇿', group_letter: 'Group A' },
      { code: 'COD', name: 'DR Congo', flag_emoji: '🇨🇩', group_letter: 'Group B' },
      { code: 'ECU', name: 'Ecuador', flag_emoji: '🇪🇨', group_letter: 'Group C' },
      { code: 'EGY', name: 'Egypt', flag_emoji: '🇪🇬', group_letter: 'Group D' },
      { code: 'ENG', name: 'England', flag_emoji: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', group_letter: 'Group E' },
      { code: 'FRA', name: 'France', flag_emoji: '🇫🇷', group_letter: 'Group F' },
      { code: 'GER', name: 'Germany', flag_emoji: '🇩🇪', group_letter: 'Group A' },
      { code: 'GHA', name: 'Ghana', flag_emoji: '🇬🇭', group_letter: 'Group B' },
      { code: 'HAI', name: 'Haiti', flag_emoji: '🇭🇹', group_letter: 'Group C' },
      { code: 'IRN', name: 'Iran', flag_emoji: '🇮🇷', group_letter: 'Group D' },
      { code: 'IRQ', name: 'Iraq', flag_emoji: '🇮🇶', group_letter: 'Group E' },
      { code: 'CIV', name: 'Ivory Coast', flag_emoji: '🇨🇮', group_letter: 'Group F' },
      { code: 'JPN', name: 'Japan', flag_emoji: '🇯🇵', group_letter: 'Group A' },
      { code: 'JOR', name: 'Jordan', flag_emoji: '🇯🇴', group_letter: 'Group B' },
      { code: 'MEX', name: 'Mexico', flag_emoji: '🇲🇽', group_letter: 'Group C' },
      { code: 'MAR', name: 'Morocco', flag_emoji: '🇲🇦', group_letter: 'Group D' },
      { code: 'NED', name: 'Netherlands', flag_emoji: '🇳🇱', group_letter: 'Group E' },
      { code: 'NZL', name: 'New Zealand', flag_emoji: '🇳🇿', group_letter: 'Group F' },
      { code: 'NOR', name: 'Norway', flag_emoji: '🇳🇴', group_letter: 'Group A' },
      { code: 'PAN', name: 'Panama', flag_emoji: '🇵🇦', group_letter: 'Group B' },
      { code: 'PAR', name: 'Paraguay', flag_emoji: '🇵🇾', group_letter: 'Group C' },
      { code: 'POR', name: 'Portugal', flag_emoji: '🇵🇹', group_letter: 'Group D' },
      { code: 'QAT', name: 'Qatar', flag_emoji: '🇶🇦', group_letter: 'Group E' },
      { code: 'KSA', name: 'Saudi Arabia', flag_emoji: '🇸🇦', group_letter: 'Group F' },
      { code: 'SCO', name: 'Scotland', flag_emoji: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', group_letter: 'Group A' },
      { code: 'SEN', name: 'Senegal', flag_emoji: '🇸🇳', group_letter: 'Group B' },
      { code: 'RSA', name: 'South Africa', flag_emoji: '🇿🇦', group_letter: 'Group C' },
      { code: 'KOR', name: 'South Korea', flag_emoji: '🇰🇷', group_letter: 'Group D' },
      { code: 'ESP', name: 'Spain', flag_emoji: '🇪🇸', group_letter: 'Group E' },
      { code: 'SWE', name: 'Sweden', flag_emoji: '🇸🇪', group_letter: 'Group F' },
      { code: 'SUI', name: 'Switzerland', flag_emoji: '🇨🇭', group_letter: 'Group A' },
      { code: 'TUN', name: 'Tunisia', flag_emoji: '🇹🇳', group_letter: 'Group B' },
      { code: 'TUR', name: 'Turkey', flag_emoji: '🇹🇷', group_letter: 'Group C' },
      { code: 'USA', name: 'United States', flag_emoji: '🇺🇸', group_letter: 'Group D' },
      { code: 'URU', name: 'Uruguay', flag_emoji: '🇺🇾', group_letter: 'Group E' },
      { code: 'UZB', name: 'Uzbekistan', flag_emoji: '🇺🇿', group_letter: 'Group F' }
    ];

    const { error } = await supabaseAdmin.from("teams").upsert(teams, { onConflict: "code" });
    if (error) {
      console.error("Error seeding teams:", error);
      throw error;
    }

    try {
      const { data: profs } = await supabaseAdmin.from("profiles").select("id, username");
      if (profs) {
        for (const p of profs) {
          if (p.username.toLowerCase().includes("admin")) {
            await supabaseAdmin.from("user_roles").upsert({
              user_id: p.id,
              role: "admin"
            }, { onConflict: "user_id,role" });
          }
        }
      }
    } catch (e) {
      console.error("Error assigning admin role in seed function:", e);
    }

    return { success: true };
  });
