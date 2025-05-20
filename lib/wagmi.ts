"use client";

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http, createConfig, fallback } from 'wagmi';
import { defineChain } from 'viem';
import { QueryClient } from '@tanstack/react-query';
import farcasterFrame from '@farcaster/frame-wagmi-connector';

// Pastikan definisi Monad Testnet yang konsisten
export const monadTestnet = defineChain({
  id: 10143,
  name: 'Monad Testnet',
  network: 'monad-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Monad',
    symbol: 'MON',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet-rpc.monad.xyz'],
    },
    public: {
      http: ['https://testnet-rpc.monad.xyz'],
    },
  },
  blockExplorers: {
    default: { 
      name: 'Monad Explorer', 
      url: 'https://blockscout.monad.xyz'
    },
  },
  testnet: true,
});

// Buat default config yang bisa digunakan di server
const createDefaultConfig = () => {
  // Cek dulu apakah ini di iFrame Farcaster
  const isFarcasterFrame = 
    typeof window !== 'undefined' && 
    (window.location.href.includes('fromFrame=true') || 
     window.location.href.includes('fid='));
  
  return getDefaultConfig({
    appName: 'Jikuna Swap',
    projectId: '618355b35e595fd4d67c0f45f456cbc9',
    chains: [monadTestnet],
    transports: {
      [monadTestnet.id]: fallback([
        http('https://testnet-rpc.monad.xyz'),
        http('https://testnet-rpc.monad.xyz'), // Gunakan ulang sebagai fallback
      ]),
    },
    ssr: false, // Matikan SSR untuk menghindari masalah inisialisasi ganda
    ...(isFarcasterFrame
      ? {
          connectors: [farcasterFrame()],
          wallets: [],
        }
      : {})
  });
};

// Buat singleton instance untuk wagmiConfig
let _wagmiConfig: ReturnType<typeof getDefaultConfig> | null = null;

// Fungsi untuk mendapatkan atau membuat wagmiConfig
export function getWagmiConfig() {
  // Cek dulu apakah ini di iFrame Farcaster
  const isFarcasterFrame = 
    typeof window !== 'undefined' && 
    (window.location.href.includes('fromFrame=true') || 
     window.location.href.includes('fid='));
  
  // Jika di Farcaster Frame, berikan config dummy yang tidak menginisialisasi provider
  if (isFarcasterFrame) {
    console.log("Detected Farcaster Frame: Using minimal wallet config");
    try {
      // Jalankan dalam try-catch untuk menghindari error
      return createDefaultConfig();
    } catch (e) {
      console.error("Error creating config for Farcaster Frame:", e);
      return null;
    }
  }
  
  // Jika di server, berikan config tanpa state yang persisten
  if (typeof window === 'undefined') {
    return createDefaultConfig();
  }

  // Cek apakah window.ethereum sudah ada atau didefinisikan oleh extension
  const hasEthereumExtension = 
    typeof window !== 'undefined' && 
    (window.ethereum !== undefined || 
     Object.getOwnPropertyDescriptor(window, 'ethereum')?.get);
  
  if (hasEthereumExtension) {
    console.log("Detected existing ethereum provider, handling carefully");
  }

  if (_wagmiConfig) {
    return _wagmiConfig;
  }

  try {
    // Buat config baru jika belum ada dan kita di browser
    _wagmiConfig = createDefaultConfig();
    return _wagmiConfig;
  } catch (error) {
    console.error("Error creating Wagmi config:", error);
    // Tetap berikan config baru jika terjadi error
    return createDefaultConfig();
  }
}

// Export wagmiConfig - inisialisasi singleton
export const wagmiConfig = getWagmiConfig();

// Export function untuk mendapatkan config - simpan untuk kompatibilitas komponen lama
export function getConfig() {
  return wagmiConfig;
}

// Function untuk mendapatkan query client untuk tanstack/react-query
// Variabel untuk menyimpan instance QueryClient
let _queryClient: QueryClient | null = null;

export function getQueryClient() {
  // Default options
  const defaultOptions = {
    queries: {
      gcTime: 1_000 * 60 * 60 * 24, // 24 jam
      staleTime: 1_000 * 60 * 5, // 5 menit
      retry: 3,
      refetchOnWindowFocus: false,
    },
  };

  // Cek dulu apakah ini di iFrame Farcaster
  const isFarcasterFrame = 
    typeof window !== 'undefined' && 
    (window.location.href.includes('fromFrame=true') || 
     window.location.href.includes('fid='));
  
  if (isFarcasterFrame) {
    // Untuk Farcaster Frame, buat QueryClient baru setiap kali tanpa caching
    return new QueryClient({ defaultOptions });
  }

  if (typeof window === 'undefined') {
    // Return new instance untuk server tanpa caching
    return new QueryClient({ defaultOptions });
  }

  if (_queryClient) {
    return _queryClient;
  }

  _queryClient = new QueryClient({ defaultOptions });
  return _queryClient;
}

export const chains = [monadTestnet]; 