"use client";

import { useEffect, useState } from 'react';
import Script from 'next/script';

// Komponen ini khusus ditujukan untuk menangani integrasi Farcaster Frame
export default function FarcasterFrameHandler() {
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [chainId, setChainId] = useState<string | null>(null);

  // Mencoba mendapatkan chainId dari window (jika tersedia)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // Handle ethereum dengan lebih aman
        if (window.ethereum) {
          const id = window.ethereum.chainId;
          if (id) {
            setChainId(id);
            console.log(`Current chain ID: ${id}`);
          }
        }
      } catch (e: unknown) {
        console.warn("Could not get chain ID:", e);
      }
    }
  }, [sdkLoaded]);

  // Handler untuk memuat SDK Frame
  const handleSdkLoad = () => {
    console.log("SDK loaded");
    setSdkLoaded(true);
    
    // Langsung panggil ready setelah SDK dimuat
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        try {
          console.log('Farcaster SDK diinisialisasi');
          
          // Pendekatan 1: Menggunakan window.fcFrameSDK jika tersedia
          if (window.fcFrameSDK) {
            console.log('Menggunakan fcFrameSDK dari window');
            window.fcFrameSDK.actions.ready({ disableNativeGestures: true })
              .then(() => console.log('Farcaster Frame SDK ready sukses'))
              .catch((error: unknown) => console.error('Farcaster Frame SDK ready error:', error));
          } 
          // Pendekatan 2: Menggunakan dynamic import dari package
          else {
            console.log('Menggunakan dynamic import untuk SDK');
            import('@farcaster/frame-sdk').then(({ sdk }) => {
              console.log('SDK diimpor dengan sukses');
              sdk.actions.ready({ disableNativeGestures: true })
                .then(() => console.log('Farcaster Frame SDK ready sukses via import'))
                .catch((error: unknown) => console.error('Farcaster Frame SDK ready error via import:', error));
            }).catch((error: unknown) => {
              console.error('Error mengimpor SDK:', error);
            });
          }
        } catch (error: unknown) {
          console.error('Error inisialisasi Farcaster SDK:', error);
        }
      }
    }, 500);
  };

  // Lindungi ethereum provider untuk mencegah konflik
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        console.log("Melindungi ethereum provider untuk Frame");
        
        // Hanya tambahkan dummy provider jika belum ada
        if (!window.ethereum) {
          const dummyProvider = {
            isFrameEthereumProvider: true,
            chainId: '0x8c78', // Monad Testnet
            isMetaMask: false
          };
          
          // Gunakan Object.defineProperty dengan opsi non-configurable untuk mencegah override
          Object.defineProperty(window, 'ethereum', {
            value: dummyProvider,
            writable: false,
            configurable: false
          });
          
          console.log("Dummy ethereum provider dibuat dengan sukses");
        } else {
          console.log("Ethereum provider sudah ada, menggunakan yang ada");
        }
      } catch (error: unknown) {
        console.warn("Error melindungi ethereum provider:", error);
      }
    }
  }, []);

  return (
    <>
      {/* Menampilkan status SDK untuk debugging */}
      <div id="farcaster-frame-status" style={{ display: 'none' }}>
        <p>SDK Loaded: {sdkLoaded ? 'Yes' : 'No'}</p>
        <p>Chain ID: {chainId || 'Unknown'}</p>
      </div>
      
      {/* Muat SDK menggunakan Script component dengan atribut strategi yang tepat */}
      <Script
        id="farcaster-sdk-init"
        strategy="afterInteractive"
        src="https://cdn.jsdelivr.net/npm/@farcaster/frame-sdk@latest/dist/index.min.js"
        onLoad={handleSdkLoad}
      />
    </>
  );
}

// Tambahkan deklarasi global untuk TypeScript
declare global {
  interface Window {
    ethereum?: any;
    fcFrameSDK?: any;
  }
} 