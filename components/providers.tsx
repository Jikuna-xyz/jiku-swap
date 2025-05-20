"use client";

import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { getConfig } from '@/lib/wagmi';
import { ThemeProvider } from '@/components/theme-provider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@rainbow-me/rainbowkit/styles.css';
import { useState, useEffect, Suspense } from 'react';
import { FarcasterFrameProvider } from './FarcasterFrameProvider';

interface ProvidersProps {
  children: React.ReactNode;
}

// Fallback yang akan ditampilkan saat loading
const LoadingFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-[#1E1E1E]">
    <div className="flex flex-col items-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
      <span className="text-white">Loading...</span>
    </div>
  </div>
);

// Komponen error boundary sederhana
const ErrorFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-[#1E1E1E]">
    <div className="bg-red-900/30 p-6 rounded-lg max-w-md text-center">
      <h2 className="text-xl font-bold text-white mb-2">Oops, ada masalah!</h2>
      <p className="text-white/80 mb-4">Terjadi error saat menginisialisasi Wallet</p>
      <button 
        onClick={() => window.location.reload()}
        className="bg-white text-red-900 px-4 py-2 rounded-lg font-medium"
      >
        Muat Ulang
      </button>
    </div>
  </div>
);

// Fungsi untuk mengecek apakah ini adalah Farcaster Frame
const isFarcasterFrame = () => {
  if (typeof window === 'undefined') return false;
  return window.location.href.includes('fromFrame=true') || 
         window.location.href.includes('fid=');
};

export function Providers({ children }: ProvidersProps) {
  // State untuk menyimpan wagmiConfig dan queryClient agar hanya dibuat sekali
  const [wagmiConfig, setWagmiConfig] = useState<any>(null);
  const [queryClient, setQueryClient] = useState<QueryClient | null>(null);
  const [mounted, setMounted] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [inFarcasterFrame, setInFarcasterFrame] = useState(false);

  // Inisialisasi config saat pertama kali dijalankan di client side saja
  useEffect(() => {
    try {
      // Cek apakah dalam Farcaster Frame
      const isFrame = isFarcasterFrame();
      setInFarcasterFrame(isFrame);
      
      if (isFrame) {
        console.log("Running in Farcaster Frame, using minimal providers");
      }
      
      if (typeof window !== 'undefined' && !wagmiConfig) {
        // Untuk Farcaster Frame, kita akan menggunakan config minimal atau null
        const config = isFrame ? null : getConfig();
        setWagmiConfig(config);
        
        // Buat query client baru
        setQueryClient(new QueryClient({
          defaultOptions: {
            queries: {
              gcTime: 1_000 * 60 * 60 * 24, // 24 jam
              staleTime: 1_000 * 60 * 5, // 5 menit
              retry: 3,
              refetchOnWindowFocus: false,
            },
          },
        }));
      }
      
      setMounted(true);
      console.log("Providers mounted successfully");
    } catch (error) {
      console.error("Provider initialization error:", error);
      setHasError(true);
    }
  }, []);

  // Tampilkan error fallback jika terjadi error
  if (hasError) {
    return <ErrorFallback />;
  }

  // Prevent hydration mismatch by not rendering until client-side
  if (!mounted) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#1E1E1E]">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
          <span className="text-white">Initializing Web3...</span>
        </div>
      </div>
    );
  }

  // Jika di Farcaster Frame, skip Wagmi dan RainbowKit, hanya render dengan context minimal
  if (inFarcasterFrame || !wagmiConfig) {
    return (
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        <FarcasterFrameProvider>
          {children}
        </FarcasterFrameProvider>
      </ThemeProvider>
    );
  }

  // Render normal providers untuk web app
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient!}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#0A67FF',
            accentColorForeground: 'white',
            borderRadius: 'medium',
          })}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <FarcasterFrameProvider>
              {children}
            </FarcasterFrameProvider>
          </ThemeProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}