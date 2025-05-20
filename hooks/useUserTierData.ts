"use client";

import { useState, useEffect, useMemo } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import JikunaXtraPointsV2ABI from '@/abis/JikunaXtraPointsV2_abi.json';

// Alamat kontrak JikunaXtraPointsV2
const JIKUNA_XP_ADDRESS = '0x1b869CEaC99F779e881DbD1354a3582F8bca9Af3';

// Local proxy endpoint untuk menghindari CORS issues
const JXP_PROXY_URL = '/api/proxy/jxp-status';

// LocalStorage key untuk cache data
const LS_JXP_DATA_KEY = 'jikuna_jxp_status_data';
const LS_JXP_TIMESTAMP_KEY = 'jikuna_jxp_status_timestamp';
const CACHE_MAX_AGE = 5 * 60 * 1000; // 5 minutes in milliseconds

// Definisi tier
export interface TierInfo {
  id: number;
  name: string;
  color: string;
  icon: string;
  minJXP: number;
  maxJXP: number | null;
  multiplier: number;
  benefits: string[];
}

// Definisi struktur tier, benefit, dan requirements
export const TIERS: TierInfo[] = [
  {
    id: 1,
    name: 'Regular',
    color: '#B87333', // Bronze color
    icon: '🥉',
    minJXP: 0,
    maxJXP: 1000,
    multiplier: 1,
    benefits: ['Akses dasar ke platform', '1x JXP Multiplier']
  },
  {
    id: 2,
    name: 'Silver',
    color: '#C0C0C0', // Silver color
    icon: '🥈',
    minJXP: 1001,
    maxJXP: 5000,
    multiplier: 1.2,
    benefits: ['1.2x JXP Multiplier', 'Biaya transaksi lebih rendah 5%', 'Akses ke event khusus']
  },
  {
    id: 3,
    name: 'Gold',
    color: '#FFD700', // Gold color
    icon: '🥇',
    minJXP: 5001,
    maxJXP: 20000,
    multiplier: 1.5,
    benefits: ['1.5x JXP Multiplier', 'Biaya transaksi lebih rendah 10%', 'Akses prioritas ke IDO']
  },
  {
    id: 4,
    name: 'Diamond',
    color: '#B9F2FF', // Diamond-like color
    icon: '💎',
    minJXP: 20001,
    maxJXP: null, // No upper limit
    multiplier: 2,
    benefits: ['2x JXP Multiplier', 'Biaya transaksi lebih rendah 15%', 'Akses VIP ke semua fitur']
  }
];

// Interface untuk return value hook
export interface UserTierData {
  tier: TierInfo | null;
  jxp: number;
  isLoading: boolean;
  error: Error | null;
  nextTier: TierInfo | null;
  progressToNextTier: number; // Dalam persentase
  jxpToNextTier: number;
  systemStatus?: any; // Data status sistem dari backend
  backendError?: string; // Error message dari backend
  usingCachedData?: boolean; // Indikator bahwa data yang digunakan adalah dari cache
}

// Interface untuk respons API
interface JXPStatusResponse {
  success: boolean;
  systemStatus: {
    lastUpdateTime: string;
    lastUpdateTimeFormatted: string;
    nextScheduledUpdate: string;
    nextScheduledUpdateFormatted: string;
  };
  stats: {
    totalProcessedSwaps: number;
    totalPendingJXP: number;
    recentSwaps: Array<{
      txHash: string;
      user: string;
      jxpAmount: number;
      timestamp: string;
    }>;
  };
}

/**
 * Helper functions untuk manajemen cache di localStorage
 */
function saveToLocalStorage(data: any) {
  try {
    if (typeof window === 'undefined') return; // Skip jika di server-side
    
    localStorage.setItem(LS_JXP_DATA_KEY, JSON.stringify(data));
    localStorage.setItem(LS_JXP_TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    console.error('Error saving JXP data to localStorage:', error);
  }
}

function getFromLocalStorage(): { data: any, timestamp: number } | null {
  try {
    if (typeof window === 'undefined') return null; // Skip jika di server-side
    
    const data = localStorage.getItem(LS_JXP_DATA_KEY);
    const timestamp = localStorage.getItem(LS_JXP_TIMESTAMP_KEY);
    
    if (!data || !timestamp) return null;
    
    return {
      data: JSON.parse(data),
      timestamp: parseInt(timestamp, 10)
    };
  } catch (error) {
    console.error('Error retrieving JXP data from localStorage:', error);
    return null;
  }
}

function isCacheValid(timestamp: number): boolean {
  return Date.now() - timestamp < CACHE_MAX_AGE;
}

// Helper untuk mengelola fetch dengan timeout yang aman
async function fetchWithTimeout(url: string, options = {}, timeoutMs = 15000) {
  try {
    // Buat AbortController untuk mengelola timeout dan membatalkan request
    const controller = new AbortController();
    const { signal } = controller;
    
    // Tambahkan signal ke options
    const fetchOptions = {
      ...options,
      signal
    };
    
    // Buat promise untuk timeout
    const timeoutPromise = new Promise((_, reject) => {
      const id = setTimeout(() => {
        // Clear timeout untuk mencegah memory leak
        clearTimeout(id);
        // Abort request
        controller.abort('Timeout');
        // Reject promise dengan error timeout
        reject(new Error('Request timeout'));
      }, timeoutMs);
    });
    
    // Race antara fetch dan timeout
    return await Promise.race([
      fetch(url, fetchOptions),
      timeoutPromise
    ]) as Response;
  } catch (error) {
    // Re-throw error untuk ditangani di level yang lebih tinggi
    throw error;
  }
}

// Hook utama untuk mengambil data tier pengguna
export function useUserTierData(): UserTierData {
  const { address, isConnected } = useAccount();
  const [error, setError] = useState<Error | null>(null);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [backendLoading, setBackendLoading] = useState<boolean>(false);
  const [backendError, setBackendError] = useState<string | undefined>(undefined);
  const [usingCachedData, setUsingCachedData] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);
  
  // Ambil data status dari backend
  useEffect(() => {
    let isMounted = true;
    
    async function fetchJXPStatus() {
      if (!isConnected || !isMounted) return;
      
      setBackendLoading(true);
      setBackendError(undefined);
      setUsingCachedData(false);
      
      // Cek apakah ada data dalam cache yang masih valid
      const cachedData = getFromLocalStorage();
      if (cachedData && isCacheValid(cachedData.timestamp)) {
        if (isMounted) {
          setSystemStatus(cachedData.data);
          setUsingCachedData(true);
          setBackendLoading(false);
          console.log('Using cached JXP data from localStorage');
        }
        // Tetap lanjutkan fetch untuk update background
      }
      
      try {
        // Gunakan helper fetchWithTimeout
        const response = await fetchWithTimeout(
          JXP_PROXY_URL,
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
            // Jangan gunakan cache di browser karena kita punya implementasi cache sendiri
            cache: 'no-store',
          },
          15000 // 15 seconds timeout
        );
        
        if (!isMounted) return;
        
        if (!response.ok) {
          throw new Error(`Backend responded with status: ${response.status}`);
        }
        
        const data: JXPStatusResponse = await response.json();
        if (isMounted) {
          setSystemStatus(data);
          setUsingCachedData(false);
          
          // Simpan data ke localStorage sebagai cache
          if (data.success) {
            saveToLocalStorage(data);
          }
        }
      } catch (err) {
        if (!isMounted) return;
        
        // Handle specific error types
        if (err instanceof Error) {
          // Hapus check untuk AbortError karena kita menggunakan helper yang sudah menangani AbortController
          // dan akan mengembalikan error timeout yang lebih bermakna
          if (err.message === 'Request timeout') {
            setBackendError('Request timeout: Backend did not respond within the specified time');
          } else if (err.message.includes('Failed to fetch')) {
            setBackendError('Connection to backend failed - possibly a network issue');
          } else {
            setBackendError(`Error: ${err.message}`);
          }
          console.error('Error fetching JXP status:', err);
          
          // Jika belum menggunakan data cache, coba gunakan cache meskipun sudah tidak valid
          if (!usingCachedData) {
            const cachedData = getFromLocalStorage();
            if (cachedData) {
              setSystemStatus(cachedData.data);
              setUsingCachedData(true);
              console.log('Using stale cached JXP data after fetch error');
            }
          }
          
          // Implementasi retry logic
          if (retryCount < 3 && isMounted) {
            const retryDelay = Math.pow(2, retryCount) * 1000; // Exponential backoff
            console.log(`Will retry JXP fetch in ${retryDelay}ms (attempt ${retryCount + 1}/3)`);
            
            // Gunakan setTimeout biasa, bukan dengan useEffect atau state change
            setTimeout(() => {
              if (isMounted) {
                setRetryCount(prev => prev + 1);
                // Memicu re-fetch
                console.log(`Retrying JXP fetch (attempt ${retryCount + 1}/3)`);
                fetchJXPStatus();
              }
            }, retryDelay);
          }
        }
      } finally {
        if (isMounted) {
          setBackendLoading(false);
        }
      }
    }
    
    fetchJXPStatus();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [isConnected, address, retryCount]);

  // Ambil tier dari kontrak - gunakan conditional fetching dengan config berbeda sesuai kondisi
  const { 
    data: tierData, 
    isLoading: isTierLoading,
    error: tierError
  } = useReadContract({
    address: JIKUNA_XP_ADDRESS as `0x${string}`,
    abi: JikunaXtraPointsV2ABI,
    functionName: 'getUserTier',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && isConnected
    }
  });

  // Ambil JXP dari kontrak
  const { 
    data: jxpData, 
    isLoading: isJxpLoading,
    error: jxpError
  } = useReadContract({
    address: JIKUNA_XP_ADDRESS as `0x${string}`,
    abi: JikunaXtraPointsV2ABI,
    functionName: 'getUserJXP',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && isConnected
    }
  });

  useEffect(() => {
    if (tierError) setError(tierError as Error);
    else if (jxpError) setError(jxpError as Error);
    else setError(null);
  }, [tierError, jxpError]);

  // Format JXP dari bigint ke number
  const jxp = useMemo(() => {
    if (!jxpData) return 0;
    return Number(formatUnits(jxpData as bigint, 0));
  }, [jxpData]);

  // Tentukan tier saat ini
  const currentTier = useMemo(() => {
    if (!tierData) return TIERS[0]; // Default to Regular tier
    const tierId = Number(tierData);
    return TIERS[tierId - 1] || TIERS[0]; // Index 0-based, tier 1-based
  }, [tierData]);

  // Tentukan tier berikutnya
  const nextTier = useMemo(() => {
    if (!currentTier) return null;
    if (currentTier.id === TIERS.length) return null; // Already at highest tier
    return TIERS[currentTier.id]; // Next tier
  }, [currentTier]);

  // Hitung progress ke tier berikutnya
  const { progressToNextTier, jxpToNextTier } = useMemo(() => {
    if (!currentTier || !nextTier) {
      return { progressToNextTier: 0, jxpToNextTier: 0 };
    }

    const totalNeeded = nextTier.minJXP - currentTier.minJXP;
    const currentProgress = Math.max(0, jxp - currentTier.minJXP);
    const remaining = Math.max(0, nextTier.minJXP - jxp);

    // Avoid division by zero
    const percentage = totalNeeded > 0 ? (currentProgress / totalNeeded) * 100 : 0;
    
    // Ensure percentage doesn't exceed 100% or go below 0%
    const clampedPercentage = Math.max(0, Math.min(100, percentage));
    
    return { 
      progressToNextTier: clampedPercentage, 
      jxpToNextTier: remaining
    };
  }, [currentTier, nextTier, jxp]);

  return {
    tier: currentTier,
    jxp,
    isLoading: isTierLoading || isJxpLoading || backendLoading,
    error,
    nextTier,
    progressToNextTier,
    jxpToNextTier,
    systemStatus,
    backendError,
    usingCachedData
  };
} 