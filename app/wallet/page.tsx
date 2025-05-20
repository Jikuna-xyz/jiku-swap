"use client"

import EnhancedWalletScreen from "@/components/enhanced-wallet-screen";
import EnhancedNavigation from "@/components/enhanced-navigation";

// export const metadata = {
//   title: "Wallet | Jikuna Swap",
//   description: "Manage your assets and view your transaction history on Jikuna Swap."
// };

export default function WalletPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f172a] to-[#1e293b] pb-20">
      <EnhancedWalletScreen />
      <EnhancedNavigation />
    </div>
  );
} 