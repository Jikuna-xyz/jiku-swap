"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAccount } from 'wagmi';

interface FarcasterContextType {
  // Farcaster user data
  fid: string | null;
  isFarcasterFrame: boolean;
  
  // Farcaster action helpers
  shareToFarcaster: (message: string) => void;
  
  // Frame swap context
  frameSwapState: {
    fromToken: string;
    toToken: string;
    amount: string;
    active: boolean;
  };
  setFrameSwapState: (state: Partial<FarcasterContextType['frameSwapState']>) => void;
  resetFrameSwapState: () => void;
  executeFrameSwap: () => Promise<void>;
}

const defaultFrameSwapState = {
  fromToken: 'MON',
  toToken: 'USDC',
  amount: '0.1',
  active: false,
};

const FarcasterContext = createContext<FarcasterContextType | null>(null);

export const FarcasterFrameProvider = ({ children }: { children: ReactNode }) => {
  const searchParams = useSearchParams();
  // Cek dahulu apakah useAccount tersedia dan cegah error
  const accountResult = (function() {
    try {
      return useAccount();
    } catch (e) {
      console.log("Error accessing wallet account:", e);
      return { address: null, isConnected: false };
    }
  })();
  
  const { address } = accountResult;
  
  // Farcaster user data
  const [fid, setFid] = useState<string | null>(null);
  const [isFarcasterFrame, setIsFarcasterFrame] = useState<boolean>(false);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  
  // Frame swap state
  const [frameSwapState, setFrameSwapStateInternal] = useState(defaultFrameSwapState);

  // Deteksi apakah aplikasi dibuka dari Farcaster Frame
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const fidParam = searchParams?.get('fid');
    const fromFrameParam = searchParams?.get('fromFrame');
    
    // Log untuk mengetahui status parameter
    console.log(`Frame Params: fid=${fidParam}, fromFrame=${fromFrameParam}`);
    
    if (fidParam) {
      setFid(fidParam);
    }
    
    const isFrame = !!fromFrameParam || !!fidParam;
    setIsFarcasterFrame(isFrame);
    
    if (isFrame) {
      console.log("FarcasterFrameProvider: Detected Frame context");
      
      // Cek chain ID jika tersedia
      if (window.ethereum && window.ethereum.chainId) {
        console.log(`Current chain ID: ${window.ethereum.chainId}`);
      }
    }
    
    // Load frame swap params jika ada
    const fromToken = searchParams?.get('fromToken');
    const toToken = searchParams?.get('toToken');
    const amount = searchParams?.get('amount');
    
    if (fromToken || toToken || amount) {
      setFrameSwapStateInternal((prev) => ({
        ...prev,
        ...(fromToken ? { fromToken } : {}),
        ...(toToken ? { toToken } : {}),
        ...(amount ? { amount } : {}),
        active: true,
      }));
    }

    // Coba load SDK Farcaster Frame
    if (isFrame) {
      const loadFrameSDK = async () => {
        try {
          // Tambahkan log saat mulai memuat SDK
          console.log("Loading Farcaster Frame SDK...");
          
          // Coba lindungi ethereum provider
          if (window.ethereum) {
            try {
              Object.defineProperty(window, 'ethereum', {
                configurable: false,
                writable: false,
                value: window.ethereum
              });
              console.log('Protected window.ethereum property');
            } catch (e) {
              console.warn('Could not protect ethereum property:', e);
            }
          }

          const { sdk } = await import('@farcaster/frame-sdk');
          
          // Tambahkan log ketika SDK berhasil dimuat
          console.log("SDK loaded");
          setSdkLoaded(true);
          
          await sdk.actions.ready({ disableNativeGestures: true });
          console.log('Farcaster Frame SDK ready called from provider');
        } catch (e) {
          console.error('Error calling Farcaster SDK ready:', e);
        }
      };
      
      // Jalankan fungsi untuk memuat SDK
      loadFrameSDK();
    }
  }, [searchParams]);

  // Fungsi untuk berbagi ke Farcaster
  const shareToFarcaster = (message: string) => {
    if (typeof window !== 'undefined') {
      const encodedMessage = encodeURIComponent(message);
      const castUrl = `https://warpcast.com/~/compose?text=${encodedMessage}`;
      window.open(castUrl, '_blank');
    }
  };
  
  // Fungsi untuk mengubah state swap
  const setFrameSwapState = (newState: Partial<FarcasterContextType['frameSwapState']>) => {
    setFrameSwapStateInternal((prev) => ({
      ...prev,
      ...newState,
    }));
  };
  
  // Reset swap state
  const resetFrameSwapState = () => {
    setFrameSwapStateInternal(defaultFrameSwapState);
  };
  
  // Execute swap dari frame
  const executeFrameSwap = async () => {
    if (!address) {
      console.error("No wallet connected");
      return;
    }
    
    try {
      console.log(`Executing frame swap: ${frameSwapState.amount} ${frameSwapState.fromToken} to ${frameSwapState.toToken}`);
      // Di sini akan implementasi swap dengan kontrak
      // Contoh dummy untuk simulasi
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Reset state setelah selesai
      resetFrameSwapState();
      
      // Share success notification
      const successMessage = `🎉 Saya baru saja swap ${frameSwapState.amount} ${frameSwapState.fromToken} ke ${frameSwapState.toToken} di Jikuna DEX! #MonadTestnet #JikunaSwap`;
      shareToFarcaster(successMessage);
    } catch (error) {
      console.error("Error executing frame swap:", error);
    }
  };

  const value: FarcasterContextType = {
    fid,
    isFarcasterFrame,
    shareToFarcaster,
    frameSwapState,
    setFrameSwapState,
    resetFrameSwapState,
    executeFrameSwap,
  };

  return (
    <FarcasterContext.Provider value={value}>
      {children}
      
      {/* Hidden element untuk debugging - tidak terlihat oleh pengguna */}
      {isFarcasterFrame && (
        <div id="farcaster-debug-info" style={{ display: 'none' }}>
          <p>FID: {fid || 'Not set'}</p>
          <p>SDK Loaded: {sdkLoaded ? 'Yes' : 'No'}</p>
        </div>
      )}
    </FarcasterContext.Provider>
  );
};

export const useFarcasterFrame = () => {
  const context = useContext(FarcasterContext);
  
  if (!context) {
    throw new Error('useFarcasterFrame must be used within a FarcasterFrameProvider');
  }
  
  return context;
};