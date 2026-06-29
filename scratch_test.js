import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    env[match[1]] = value;
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  // Let's call the view or use a sql function if we can, or just inspect how predictions are calculated.
  // We can query the profiles and their total_points from the leaderboard view to check values.
  const { data: leaderboard, error } = await supabase
    .from('leaderboard')
    .select('username, total_points, matches_scored');
    
  if (error) {
    console.error("Leaderboard query error:", error.message);
  } else {
    console.log("Current Leaderboard state:");
    console.table(leaderboard);
  }

  // Let's fetch all matches and see if we have knockout matches with winners
  const { data: matches } = await supabase
    .from('matches')
    .select('id, stage, home_score, away_score, winner_id');
  console.log("Matches:", matches);

  // Let's fetch predictions
  const { data: predictions } = await supabase
    .from('predictions')
    .select('user_id, match_id, predicted_home, predicted_away, predicted_winner_id');
  console.log("Predictions:", predictions);
}

run();
