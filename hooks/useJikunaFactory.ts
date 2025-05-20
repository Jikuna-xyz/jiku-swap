"use client";

import { useReadContract } from 'wagmi';
import { JIKUNA_FACTORY_ABI, JIKUNA_FACTORY_ADDRESS } from '@/config/contracts';

export function useJikunaFactory() {
  // Mendapatkan semua Jikuna Swaps dari factory
  const { data: jikunaSwaps, isLoading: isLoadingSwaps } = useReadContract({
    address: JIKUNA_FACTORY_ADDRESS,
    abi: JIKUNA_FACTORY_ABI,
    functionName: 'getAllJikunaSwaps',
  });

  // Mendapatkan default fee collector
  const { data: feeCollector } = useReadContract({
    address: JIKUNA_FACTORY_ADDRESS,
    abi: JIKUNA_FACTORY_ABI,
    functionName: 'defaultFeeCollector',
  });

  // Mendapatkan default fee percent
  const { data: feePercent } = useReadContract({
    address: JIKUNA_FACTORY_ADDRESS,
    abi: JIKUNA_FACTORY_ABI,
    functionName: 'defaultFeePercent',
  });

  // Helper untuk mendapatkan jumlah swap contract
  const { data: swapCount } = useReadContract({
    address: JIKUNA_FACTORY_ADDRESS,
    abi: JIKUNA_FACTORY_ABI,
    functionName: 'getJikunaSwapCount',
  });

  return {
    jikunaSwaps,
    feeCollector,
    feePercent,
    swapCount,
    isLoadingSwaps,
  };
} 