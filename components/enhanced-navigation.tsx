"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { Home, BarChart3, Repeat, Wallet } from "lucide-react"

export default function EnhancedNavigation() {
  const pathname = usePathname()
  const [isMounted, setIsMounted] = useState(false)
  
  // Set mounted state for client-side rendering
  useEffect(() => {
    setIsMounted(true)
  }, [])
  
  // Only render on client
  if (!isMounted) {
    return null
  }
  
  return (
    <div className="fixed bottom-0 left-0 right-0 flex justify-center p-2 z-50">
      <nav className="bg-black/30 backdrop-blur-lg border border-gray-800 rounded-2xl px-2 py-1 flex gap-1 w-full max-w-xs mx-auto">
        <NavItem 
          icon={<Home className="w-5 h-5" />} 
          label="Home" 
          href="/"
          currentPathname={pathname}
        />
        <NavItem 
          icon={<Repeat className="w-5 h-5" />} 
          label="Swap" 
          href="/swap"
          currentPathname={pathname}
        />
        <NavItem 
          icon={<BarChart3 className="w-5 h-5" />} 
          label="Stats" 
          href="/leaderboard"
          currentPathname={pathname}
        />
        <NavItem 
          icon={<Wallet className="w-5 h-5" />} 
          label="Wallet" 
          href="/wallet"
          currentPathname={pathname}
        />
      </nav>
    </div>
  )
}

interface NavItemProps {
  icon: React.ReactNode
  label: string
  href: string
  currentPathname: string
}

function NavItem({ icon, label, href, currentPathname }: NavItemProps) {
  const isActive = currentPathname === href
  return (
    <Link 
      href={href}
      className="relative flex flex-col items-center justify-center flex-1 py-2 rounded-xl"
    >
      {isActive && (
        <motion.div
          layoutId="activeTab"
          className="absolute inset-0 bg-white/10 rounded-xl"
          initial={false}
          transition={{ type: "spring", duration: 0.5 }}
        />
      )}
      <span className={`relative z-10 ${isActive ? 'text-white' : 'text-gray-400'}`}>
        {icon}
      </span>
      <span className={`text-xs mt-1 relative z-10 ${isActive ? 'text-white' : 'text-gray-400'}`}>
        {label}
      </span>
    </Link>
  )
} 