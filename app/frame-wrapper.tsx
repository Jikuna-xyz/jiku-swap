"use client";

import { Suspense, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Memuat FarcasterFrameHandler dengan dynamic import (Client Component)
const FarcasterFrameHandler = dynamic(
  () => import('./farcaster-frame'),
  { 
    ssr: false,
    loading: () => (
      <div id="frame-loading" style={{ display: 'none' }}>
        Loading Frame Handler...
      </div>
    )
  }
);

export default function FrameWrapper() {
  const [isFarcasterContext, setIsFarcasterContext] = useState(false);
  
  useEffect(() => {
    // Deteksi jika berada dalam konteks Farcaster dengan metode yang komprehensif
    if (typeof window !== 'undefined') {
      const url = window.location.href;
      const userAgent = window.navigator.userAgent.toLowerCase();
      
      const isFarcaster = 
        // URL params dan domain
        url.includes('fromFrame=true') || 
        url.includes('fid=') ||
        url.includes('warpcast.com') || 
        url.includes('frames.farcaster') ||
        // User agent deteksi
        userAgent.includes('warpcast') ||
        userAgent.includes('farcaster') ||
        // Referrer deteksi
        document.referrer.includes('warpcast.com') ||
        document.referrer.includes('farcaster');
        
      setIsFarcasterContext(isFarcaster);
      
      // Log untuk debugging
      console.log(`FrameWrapper - Frame konteks terdeteksi: ${isFarcaster}`);
      
      // Atur flag pada window untuk debugging
      window.isFarcasterContext = isFarcaster;
    }
  }, []);
  
  return (
    <Suspense fallback={<div id="frame-suspense" style={{ display: 'none' }}>Loading Farcaster Frame...</div>}>
      {/* Hanya render FarcasterFrameHandler jika dalam konteks Farcaster atau dalam development */}
      {(isFarcasterContext || process.env.NODE_ENV === 'development') && <FarcasterFrameHandler />}
    </Suspense>
  );
}

// Tambahkan deklarasi global untuk TypeScript
declare global {
  interface Window {
    isFarcasterContext?: boolean;
  }
} 