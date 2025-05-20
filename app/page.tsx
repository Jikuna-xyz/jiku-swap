"use client"

// import { useState } from "react" // useState tidak lagi digunakan
// import EnhancedSwapScreen from "@/components/enhanced-swap-screen" // Tidak dirender di sini
// import LeaderboardScreen from "@/components/leaderboard-screen" // Tidak dirender di sini
// import EnhancedWalletScreen from "@/components/enhanced-wallet-screen" // Tidak dirender di sini
import HomeScreen from "@/components/home-screen"
import EnhancedNavigation from "@/components/enhanced-navigation"
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { APP_URL } from "@/lib/constants"; // Import APP_URL

// Frame definition for Farcaster
// const frame = {
//   version: "next",
//   imageUrl: `${APP_URL}/images/feed.png`, // Embed image URL (3:2 image ratio)
//   button: {
//     title: "Jikuna App", // Text on the embed button
//     action: {
//       type: "launch_frame",
//       name: "Jikuna Farcaster MiniApp", // Frame name
//       url: APP_URL, // URL opened when embed button is pressed
//       splashImageUrl: `${APP_URL}/images/splash.png`,
//       splashBackgroundColor: "#f7f7f7",
//     },
//   },
// };

export default function Home() {
  // Ensure Frame SDK runs
  const searchParams = useSearchParams()
  const [isFrameContext, setIsFrameContext] = useState(false)
  
  useEffect(() => {
    // Detect if from Farcaster Frame
    const fromFrame = searchParams?.get('fromFrame')
    const fid = searchParams?.get('fid')
    
    // Log parameters for analysis
    console.log(`Home - Frame Params check: fromFrame=${fromFrame}, fid=${fid}`);
    
    if (fromFrame === 'true' || fid) {
      console.log('Home - Detected Frame context')
      setIsFrameContext(true)
      
      // Log chain ID if available and add flag to mark as ready
      if (typeof window !== 'undefined') {
        if (window.ethereum && window.ethereum.chainId) {
          console.log(`Current chain ID: ${window.ethereum.chainId}`)
        }
        
        // Mark that component is ready
        window.homeComponentReady = true;
        console.log('Home component ready for Farcaster interaction');
        
        // Try logging SDK
        try {
          const sdkLoaded = window.fcFrameSDK ? 'Yes' : 'No';
          console.log(`SDK loaded status in Home: ${sdkLoaded}`);
        } catch (e) {
          console.warn('Error checking SDK in Home:', e);
        }
      }
    }
  }, [searchParams])

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f172a] to-[#1e293b]">
      {/* Only render HomeScreen on main page */}
      {/* {activeScreen === "swap" && <EnhancedSwapScreen />} */}
      {/* {activeScreen === "leaderboard" && <LeaderboardScreen />} */}
      {/* {activeScreen === "wallet" && <EnhancedWalletScreen />} */}
      {/* {activeScreen === "home" && <HomeScreen />} */}
      <HomeScreen />
      
      {/* EnhancedNavigation no longer requires activeScreen and setActiveScreen props */}
      <EnhancedNavigation />
      
      {/* Hidden debugging information */}
      {isFrameContext && (
        <div id="frame-context-debug" style={{ display: 'none' }}>
          <p>Frame context detected in Home</p>
          <p>Using new frame handling approach with FarcasterFrameHandler</p>
        </div>
      )}
    </div>
  )
}

// Add global declaration for TypeScript
declare global {
  interface Window {
    ethereum?: any;
    fcFrameSDK?: any;
    homeComponentReady?: boolean;
  }
}
