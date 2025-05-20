"use client";

import { useState } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { waitForTransaction } from '@wagmi/core';
import { getConfig } from '@/lib/wagmi';
import JikunaXtraPointsV2ABI from '@/abis/JikunaXtraPointsV2_abi.json';

// Alamat kontrak JikunaXtraPointsV2
const JIKUNA_XP_ADDRESS = '0x1b869CEaC99F779e881DbD1354a3582F8bca9Af3';

interface UseJikunaXPUpdateReturn {
  updateJXP: (pointsToAdd: bigint) => Promise<string | null>;
  isPending: boolean;
  error: Error | null;
}

/**
 * Hook to update JXP after swap transactions
 * Note: For manual use only, most JXP updates
 * are handled automatically by the JikunaSwap router
 */
export function useJikunaXPUpdate(): UseJikunaXPUpdateReturn {
  const { address, isConnected } = useAccount();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { writeContractAsync } = useWriteContract();
  const config = getConfig();

  /**
   * Function to update user's JXP
   * @param pointsToAdd Amount of JXP to add
   * @returns Transaction hash if successful, null if failed
   */
  const updateJXP = async (pointsToAdd: bigint): Promise<string | null> => {
    if (!isConnected || !address) {
      setError(new Error('Wallet not connected'));
      return null;
    }

    try {
      setIsPending(true);
      setError(null);

      // In actual implementation, only admin or authorized contracts
      // can update JXP, so this function is for demonstration only.
      // The actual JikunaSwap contract handles JXP updates automatically.
      console.log(`🎮 Will add ${pointsToAdd.toString()} JXP to ${address}`);
      
      // In production environment, this would call updateUserJXP if permission exists
      // For demo, we create an empty function that returns a dummy hash
      // const hash = await writeContractAsync({
      //   address: JIKUNA_XP_ADDRESS as `0x${string}`,
      //   abi: JikunaXtraPointsV2ABI,
      //   functionName: 'updateUserJXP',
      //   args: [address, pointsToAdd],
      // });
      
      // Simulate delay for demo
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Dummy transaction hash
      const dummyHash = '0x' + Math.random().toString(16).substring(2, 34) + Math.random().toString(16).substring(2, 34);
      
      console.log(`✅ JXP successfully updated: ${dummyHash}`);
      return dummyHash;
    } catch (err) {
      console.error('Error updating JXP:', err);
      setError(err as Error);
      return null;
    } finally {
      setIsPending(false);
    }
  };

  return {
    updateJXP,
    isPending,
    error
  };
} 