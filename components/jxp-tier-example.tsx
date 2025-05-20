"use client";

import React from "react";
import UserTierCard from "./UserTierCard";
import { useAccount } from "wagmi";

export default function JXPTierExample() {
  const { isConnected } = useAccount();

  return (
    <div className="p-4 sm:p-6 max-w-mobile mx-auto w-full">
      <h2 className="text-xl font-bold text-white mb-4">JXP Tier System</h2>
      
      {/* Tier Component */}
      <UserTierCard />
      
      {/* Penjelasan integrasi */}
      {isConnected && (
        <div className="bg-[#282c34] rounded-lg p-4 mt-4">
          <h3 className="text-lg font-bold text-white mb-2">Cara Integrasi Tier System ke Halaman Wallet</h3>
          
          <div className="bg-blue-900/20 border border-blue-800 rounded-md p-3 text-sm text-[#c0c0c0]">
            <ol className="list-decimal pl-4 space-y-2">
              <li>
                Import komponen <code className="bg-[#343b43] px-1 py-0.5 rounded">UserTierCard</code> 
                ke halaman wallet Anda.
              </li>
              <li>
                Tambahkan komponen ke halaman wallet di posisi yang sesuai,
                misalnya di antara informasi saldo dan riwayat transaksi.
              </li>
              <li>
                Komponen ini akan secara otomatis terhubung ke kontrak
                JikunaXtraPointsV2 untuk mendapatkan data tier pengguna.
              </li>
              <li>
                Komponen juga menangani semua state (loading, error, wallet tidak 
                terhubung, dsb.) secara internal.
              </li>
            </ol>
          </div>
          
          <div className="bg-[#343b43] rounded-md p-3 mt-4">
            <p className="text-sm text-white mb-2">Contoh kode integrasi:</p>
            <pre className="bg-[#1a1d21] p-2 rounded text-xs text-blue-400 overflow-x-auto">
              {`import UserTierCard from '@/components/UserTierCard';

export default function WalletPage() {
  return (
    <div>
      {/* Wallet balance info */}
      <WalletBalances />
      
      {/* JXP Tier System */}
      <UserTierCard />
      
      {/* Transaction history */}
      <TransactionHistory />
    </div>
  );
}`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
} 