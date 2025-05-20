"use client"

import LeaderboardScreen from "@/components/leaderboard-screen";
import EnhancedNavigation from "@/components/enhanced-navigation";

// export const metadata = {
//   title: "Leaderboard | Jikuna Swap",
//   description: "Check the JXP leaderboard and see who is on top."
// };

export default function LeaderboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f172a] to-[#1e293b] pb-20">
      <LeaderboardScreen />
      <EnhancedNavigation />
    </div>
  );
} 