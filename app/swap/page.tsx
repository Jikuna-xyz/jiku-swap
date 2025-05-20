"use client"

import { useState, useEffect } from "react";
import EnhancedSwapScreen from "@/components/enhanced-swap-screen";
import EnhancedNavigation from "@/components/enhanced-navigation";
import { Loader2 } from "lucide-react";

// export const metadata = {
//   title: 'Swap | Jikuna Swap',
//   description: 'Swap tokens on Jikuna Swap with low fees and high liquidity',
// };

export default function SwapPage() {
  const [isLoading, setIsLoading] = useState(true);
  
  // Tambahkan efek untuk mengubah loading state setelah komponen dimount
  useEffect(() => {
    // Delay singkat untuk menghindari flash loading indicator
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f172a] to-[#1e293b] pb-20">
      {isLoading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-purple-600 animate-spin" />
            <p className="text-white font-medium">Memuat Jikuna Swap...</p>
          </div>
        </div>
      ) : (
        <>
          <EnhancedSwapScreen />
          <EnhancedNavigation />
        </>
      )}
    </div>
  );
} 