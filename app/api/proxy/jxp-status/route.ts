import { NextResponse } from 'next/server';

// Backend URLs - daftar URL backend yang bisa digunakan
const JXP_BACKEND_URLS = [
  'https://jikuna-jxp-backend-f1kkgdu99-alan-ilahis-projects.vercel.app',
  'https://jikuna-jxp-backend.vercel.app',
  'https://jikuna-jxp-backend-alan-ilahis-projects.vercel.app'
];

// Mock data untuk fallback jika semua koneksi gagal
const FALLBACK_RESPONSE = {
  success: true,
  systemStatus: {
    lastUpdateTime: new Date().toISOString(),
    lastUpdateTimeFormatted: new Date().toLocaleString(),
    nextScheduledUpdate: new Date(Date.now() + 3600000).toISOString(),
    nextScheduledUpdateFormatted: new Date(Date.now() + 3600000).toLocaleString()
  },
  stats: {
    totalProcessedSwaps: 0,
    totalPendingJXP: 0,
    recentSwaps: []
  },
  isFallbackData: true
};

/**
 * Helper function to try each backend URL until one succeeds
 */
async function tryFetchFromBackends() {
  // Copy error untuk response akhir
  let lastError = null;
  
  // Coba setiap URL secara berurutan
  for (const baseUrl of JXP_BACKEND_URLS) {
    try {
      console.log(`Trying backend URL: ${baseUrl}...`);
      
      // Buat request dengan timeout menggunakan AbortController
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 detik timeout
      
      // Kirim permintaan ke backend saat ini
      const response = await fetch(`${baseUrl}/api/jxp/status`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
        signal: controller.signal,
      });
      
      // Clear timeout
      clearTimeout(timeoutId);
      
      // Jika berhasil
      if (response.ok) {
        console.log(`Successful response from ${baseUrl}`);
        return await response.json();
      } else {
        console.log(`Failed with status ${response.status} from ${baseUrl}`);
        lastError = new Error(`Backend ${baseUrl} responded with status: ${response.status}`);
      }
    } catch (error) {
      console.error(`Error with backend ${baseUrl}:`, error);
      lastError = error;
      // Lanjut ke URL berikutnya
    }
  }
  
  // Jika semua backend gagal, lempar error terakhir
  throw lastError || new Error('All backend URLs failed');
}

/**
 * API route untuk mengambil data JXP status dari backend
 * Berfungsi sebagai proxy untuk menghindari masalah CORS
 */
export async function GET() {
  try {
    console.log('Fetching JXP status from backend via proxy...');
    
    // Mencoba mendapatkan data dari salah satu backend
    const data = await tryFetchFromBackends();
    
    // Return response dari proxy
    return NextResponse.json(data);
  } catch (error) {
    console.error('All backend attempts failed:', error);
    
    // Gunakan fallback data dengan header cache-control yang ketat
    return NextResponse.json(
      FALLBACK_RESPONSE,
      { 
        status: 200,
        headers: {
          'Cache-Control': 'private, max-age=30',
          'X-Proxy-Fallback': 'true'
        }
      }
    );
  }
} 