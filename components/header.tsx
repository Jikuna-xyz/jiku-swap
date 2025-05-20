"use client"

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { useState, useEffect } from 'react';
import { Menu, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import JikunaXtraPointsV2ABI from '@/abis/JikunaXtraPointsV2_abi.json';

interface HeaderProps {
  title: string
}

// Alamat kontrak JikunaXtraPointsV2
const JIKUNA_XP_ADDRESS = '0x1b869CEaC99F779e881DbD1354a3582F8bca9Af3';

export default function Header({ title }: HeaderProps) {
  // Semua state hooks harus dipanggil di awal, sebelum hooks lain
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [jxp, setJxp] = useState(0);
  const [mounted, setMounted] = useState(false);
  
  // Hook useRouter
  const router = useRouter();
  
  // Menggunakan useEffect untuk mendeteksi apakah komponen sudah di-mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // PENTING: Hooks kondisional harus dihindari - kita gunakan objek default sebagai fallback
  // untuk mencegah hooks missing saat mounted = false
  const { address, isConnected } = useAccount();
  
  // Data JXP - gunakan nilai default untuk menghindari error React Hooks
  const { 
    data: jxpData, 
    isLoading: isJxpLoading
  } = useReadContract({
    address: JIKUNA_XP_ADDRESS as `0x${string}`,
    abi: JikunaXtraPointsV2ABI,
    functionName: 'getUserJXP',
    args: address ? [address] : undefined,
    query: {
      enabled: mounted && !!address && isConnected
    }
  });

  // Update JXP state setelah data diambil
  useEffect(() => {
    if (jxpData) {
      setJxp(Number(formatUnits(jxpData as bigint, 0)));
    }
  }, [jxpData]);

  // Handler untuk membuka halaman JXP Tiers
  const handleJXPClick = () => {
    router.push('/jxp-tiers');
  };

  // Gunakan conditional rendering dalam return, bukan conditional hooks
  // untuk menghindari pelanggaran Rules of Hooks
  return (
    <div className="flex items-center justify-between p-3 sm:p-4 border-b border-[#343b43]">
      <div className="flex items-center gap-1 sm:gap-2">
        <div className="h-5 w-5 sm:h-6 sm:w-6">
          <img src="/images/jiku-logo.png" alt="JIKU Logo" className="h-full w-full object-contain" />
        </div>
        <div className="font-bold text-white text-sm sm:text-base">{title}</div>
        <div className="text-[#707070] text-[10px] sm:text-xs hidden xs:block">by jikuna</div>
      </div>
      
      {/* Desktop View */}
      <div className="hidden sm:flex items-center gap-3">
        <button 
          onClick={handleJXPClick}
          className="flex items-center gap-1 bg-[#343b43] px-2 py-1 rounded-md hover:bg-[#3e4652] transition-colors"
        >
          <div className="w-4 h-4 rounded-full bg-[#fbcc68] flex items-center justify-center">
            <span className="text-black text-xs font-bold">J</span>
          </div>
          <span className="text-white text-xs">{jxp} JXP</span>
          <Sparkles className="h-3 w-3 text-yellow-400 ml-1" />
        </button>
        {!mounted ? (
          <button className="bg-[#343b43] text-white text-xs rounded-md px-3 py-1">
            Loading...
          </button>
        ) : (
          <ConnectButton.Custom>
            {({
              account,
              chain,
              openAccountModal,
              openChainModal,
              openConnectModal,
              mounted: rainbowkitMounted,
            }) => {
              const ready = rainbowkitMounted;
              const connected = ready && account && chain;

              return (
                <div
                  {...(!ready && {
                    'aria-hidden': true,
                    style: {
                      opacity: 0,
                      pointerEvents: 'none',
                      userSelect: 'none',
                    },
                  })}
                >
                  {(() => {
                    if (!connected) {
                      return (
                        <button 
                          onClick={openConnectModal} 
                          className="bg-[#343b43] text-white text-xs rounded-md px-3 py-1"
                        >
                          Connect Wallet
                        </button>
                      );
                    }

                    if (chain.unsupported) {
                      return (
                        <button 
                          onClick={openChainModal}
                          className="bg-red-600 text-white text-xs rounded-md px-3 py-1"
                        >
                          Network Salah
                        </button>
                      );
                    }

                    return (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={openAccountModal}
                          className="flex items-center gap-1 rounded-md bg-[#343b43] px-2 py-1 text-xs font-medium text-white truncate max-w-[120px]"
                        >
                          {account.displayName}
                        </button>
                      </div>
                    );
                  })()}
                </div>
              );
            }}
          </ConnectButton.Custom>
        )}
      </div>
      
      {/* Mobile View */}
      <div className="flex sm:hidden items-center gap-2">
        <button 
          onClick={handleJXPClick}
          className="flex items-center gap-1 bg-[#343b43] px-2 py-1 rounded-md hover:bg-[#3e4652] transition-colors"
        >
          <div className="w-3 h-3 rounded-full bg-[#fbcc68] flex items-center justify-center">
            <span className="text-black text-[8px] font-bold">J</span>
          </div>
          <Sparkles className="h-2.5 w-2.5 text-yellow-400" />
        </button>
        {!mounted ? (
          <button className="bg-[#343b43] text-white text-[10px] rounded-md px-2 py-1">
            Loading...
          </button>
        ) : (
          <ConnectButton.Custom>
            {({
              account,
              chain,
              openAccountModal,
              openChainModal,
              openConnectModal,
              mounted: rainbowkitMounted,
            }) => {
              const ready = rainbowkitMounted;
              const connected = ready && account && chain;

              return (
                <div
                  {...(!ready && {
                    'aria-hidden': true,
                    style: {
                      opacity: 0,
                      pointerEvents: 'none',
                      userSelect: 'none',
                    },
                  })}
                >
                  {(() => {
                    if (!connected) {
                      return (
                        <button 
                          onClick={openConnectModal} 
                          className="bg-[#343b43] text-white text-[10px] rounded-md px-2 py-1"
                        >
                          Connect
                        </button>
                      );
                    }

                    if (chain.unsupported) {
                      return (
                        <button 
                          onClick={openChainModal}
                          className="bg-red-600 text-white text-[10px] rounded-md px-2 py-1"
                        >
                          Wrong Net
                        </button>
                      );
                    }

                    return (
                      <button
                        onClick={openAccountModal}
                        className="flex items-center gap-1 rounded-md bg-[#343b43] px-2 py-1 text-[10px] font-medium text-white truncate max-w-[100px]"
                      >
                        {account.displayName}
                      </button>
                    );
                  })()}
                </div>
              );
            }}
          </ConnectButton.Custom>
        )}
      </div>
    </div>
  );
}
