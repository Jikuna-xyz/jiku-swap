"use client"

import { Home, Repeat, Trophy, Wallet } from "lucide-react"

interface NavigationProps {
  activeScreen: "home" | "swap" | "leaderboard" | "wallet"
  setActiveScreen: (screen: "home" | "swap" | "leaderboard" | "wallet") => void
}

export default function Navigation({ activeScreen, setActiveScreen }: NavigationProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 flex justify-around items-center bg-[#111111] py-3 border-t border-[#343b43]">
      <button
        onClick={() => setActiveScreen("home")}
        className={`flex flex-col items-center ${activeScreen === "home" ? "text-white" : "text-[#707070]"}`}
      >
        <Home size={20} />
        <span className="text-xs mt-1">Home</span>
      </button>
      <button
        onClick={() => setActiveScreen("swap")}
        className={`flex flex-col items-center ${activeScreen === "swap" ? "text-white" : "text-[#707070]"}`}
      >
        <Repeat size={20} />
        <span className="text-xs mt-1">Swap</span>
      </button>
      <button
        onClick={() => setActiveScreen("leaderboard")}
        className={`flex flex-col items-center ${activeScreen === "leaderboard" ? "text-white" : "text-[#707070]"}`}
      >
        <Trophy size={20} />
        <span className="text-xs mt-1">Leaderboard</span>
      </button>
      <button
        onClick={() => setActiveScreen("wallet")}
        className={`flex flex-col items-center ${activeScreen === "wallet" ? "text-white" : "text-[#707070]"}`}
      >
        <Wallet size={20} />
        <span className="text-xs mt-1">Wallet</span>
      </button>
    </div>
  )
}
