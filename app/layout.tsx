import type { Metadata } from 'next'
import type { Viewport } from 'next'
import './globals.css'
import { Providers } from '@/components/providers'
import FarcasterSwapButton from '@/components/FarcasterSwapButton'
import Script from 'next/script'
import FrameWrapper from './frame-wrapper'

const APP_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://jikuna-swap.vercel.app'

// Definisikan FrameEmbed sesuai dengan spesifikasi Farcaster Mini Apps
const frameEmbed = {
  version: "next",
  imageUrl: `${APP_URL}/images/feed.png`, // Kembali ke images/feed.png
  button: {
    title: "🚀 Start Swap on Jikuna",
    action: {
      type: "launch_frame",
      url: APP_URL,
      name: "Jikuna Swap",
      splashImageUrl: `${APP_URL}/images/splash.png`, 
      splashBackgroundColor: "#1E1E1E",
    },
  },
}

export const metadata: Metadata = {
  title: 'Jikuna Swap',
  description: 'DEX on Monad Testnet',
  generator: 'v0.dev',
  metadataBase: new URL(APP_URL),
  openGraph: {
    title: 'Jikuna Swap - DEX on Monad Testnet',
    description: 'Exchange tokens on Monad Testnet with low fees and minimal slippage',
    images: [`${APP_URL}/images/feed.png`, `${APP_URL}/logo.png`],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Jikuna Swap - DEX on Monad Testnet',
    description: 'Exchange tokens on Monad Testnet with low fees and minimal slippage',
    images: [`${APP_URL}/images/feed.png`, `${APP_URL}/logo.png`],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://jikuna-swap.vercel.app'; // Sudah didefinisikan sebagai APP_URL

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Script blocker to prevent conflicts */}
        <script dangerouslySetInnerHTML={{ __html: `
          // Prevent ethereum provider conflicts
          (function() {
            if (typeof window !== 'undefined') {
              // Save original var for properties we want to protect
              var _originalDescriptors = {};
              
              try {
                // Function to protect property
                function protectProperty(propName) {
                  // Save original descriptor if it exists
                  var descriptor = Object.getOwnPropertyDescriptor(window, propName);
                  if (descriptor) {
                    _originalDescriptors[propName] = descriptor;
                  }
                  
                  // Prepare default value
                  var propValue = window[propName] || {};
                  
                  // Override property
                  Object.defineProperty(window, propName, {
                    get: function() { 
                      return propValue; 
                    },
                    set: function(newVal) {
                      console.log('Intercept attempt to set ' + propName);
                      // Merge new properties with existing ones
                      propValue = Object.assign({}, propValue, newVal);
                    },
                    configurable: true
                  });
                }
                
                // Protect properties that could potentially conflict
                protectProperty('ethereum');
                protectProperty('walletConnect');
                protectProperty('Buffer');
                
                console.log('Property protection set up in frame context');
              } catch (e) {
                console.warn('Property protection setup failed', e);
              }
            }
          })();
        `}} />
        <meta name="theme-color" content="#1E1E1E" />
        
        {/* Farcaster Mini App Embed - Sesuai dokumentasi https://miniapps.farcaster.xyz/docs/guides/sharing */}
        <meta name="fc:frame" content={JSON.stringify(frameEmbed)} />
        
        {/* Open Graph tags for fallback */}
        <meta property="og:title" content={metadata.openGraph?.title?.toString()} />
        <meta property="og:description" content={metadata.openGraph?.description?.toString()} />
        {/* Menggunakan gambar pertama dari array images di openGraph metadata sebagai og:image utama */}
        {metadata.openGraph?.images && (
           <meta property="og:image" content={Array.isArray(metadata.openGraph.images) ? metadata.openGraph.images[0].toString() : metadata.openGraph.images.toString()} />
        )}
        {/* Jika ingin width/height, pastikan tipe metadata.openGraph.images adalah OGImageDescriptor[] dan akses propertinya */}
        
        {/* Script for Farcaster */}
        <script noModule={true} type="text/javascript" dangerouslySetInnerHTML={{ __html: `
          window.ethereum = window.ethereum || {};
          console.log('Disabled ethereum provider injection in Farcaster Frame');
        `}} />
      </head>
      <body className="bg-[#1E1E1E] overflow-x-hidden min-h-screen antialiased">
        <Providers>
          {children}
          {/* FarcasterSwapButton will automatically appear when needed */}
          <FarcasterSwapButton />
        </Providers>
        
        {/* Use FrameWrapper which manages dynamic import for FarcasterFrameHandler */}
        <FrameWrapper />
        
        {/* Hidden debug info */}
        <div id="debug-hidden" style={{ display: 'none' }}>
          <div>Jikuna Swap Frame Debug Info</div>
        </div>
      </body>
    </html>
  )
}
