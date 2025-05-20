import { parseEther } from 'viem';
import { useAccount, useBalance, usePublicClient, useWalletClient } from 'wagmi';
import { TOKEN_ADDRESSES, WMON_ABI } from '@/config/contracts';
import { useState, useCallback } from 'react';
import { useJikunaXPUpdate } from './useJikunaXPUpdate';

export function useWMON() {
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { updateJXP } = useJikunaXPUpdate();

  // Get balances
  const { data: nativeBalance, refetch: refetchNativeBalance } = useBalance({
    address,
  });

  const { data: wmonBalance, refetch: refetchWmonBalance } = useBalance({
    address,
    token: TOKEN_ADDRESSES.WMON,
  });

  // Fungsi untuk menghitung JXP untuk operasi wrap/unwrap
  const calculateJXP = useCallback((amount: string): bigint => {
    if (!amount || parseFloat(amount) === 0) return BigInt(0);
    
    // 1 point per 1 token wrapped/unwrapped (min 1 point)
    const amountBigInt = parseEther(amount);
    let pointsToAdd = amountBigInt / BigInt(100);
    if (pointsToAdd < BigInt(1)) pointsToAdd = BigInt(1);
    
    return pointsToAdd;
  }, []);

  // Handle wrapping MON to WMON
  const handleWrap = useCallback(async (amount?: string) => {
    if (!walletClient || !publicClient || !address || !amount || amount === '0') return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Membatasi gas ke 300k untuk menghindari gas yang terlalu tinggi
      const hash = await walletClient.writeContract({
        address: TOKEN_ADDRESSES.WMON,
        abi: WMON_ABI,
        functionName: 'deposit',
        value: parseEther(amount),
        gas: BigInt(300000), // Batas gas 300k
      });
      
      setTxHash(hash);
      
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      
      if (receipt.status === 'success') {
        setIsSuccess(true);
        refetchNativeBalance();
        refetchWmonBalance();
        
        // Update JXP dilakukan secara langsung di blockchain sebagai bagian dari transaksi
        // tapi kita masih update state JXP untuk tampilan UI
        try {
          // Ini tidak memerlukan konfirmasi karena kita tidak mengirim transaksi,
          // hanya mengupdate state lokal
          const pointsToAdd = calculateJXP(amount);
          updateJXP(pointsToAdd);
        } catch (error) {
          console.error('Error updating JXP state:', error);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transaksi gagal');
    } finally {
      setIsLoading(false);
    }
  }, [walletClient, publicClient, address, refetchNativeBalance, refetchWmonBalance, updateJXP, calculateJXP]);

  // Handle unwrapping WMON to MON
  const handleUnwrap = useCallback(async (amount?: string) => {
    if (!walletClient || !publicClient || !address || !amount || amount === '0') return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Membatasi gas ke 300k untuk menghindari gas yang terlalu tinggi
      const hash = await walletClient.writeContract({
        address: TOKEN_ADDRESSES.WMON,
        abi: WMON_ABI,
        functionName: 'withdraw',
        args: [parseEther(amount)],
        gas: BigInt(300000), // Batas gas 300k
      });
      
      setTxHash(hash);
      
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      
      if (receipt.status === 'success') {
        setIsSuccess(true);
        refetchNativeBalance();
        refetchWmonBalance();
        
        // Update JXP dilakukan secara langsung di blockchain sebagai bagian dari transaksi
        // tapi kita masih update state JXP untuk tampilan UI
        try {
          // Ini tidak memerlukan konfirmasi karena kita tidak mengirim transaksi,
          // hanya mengupdate state lokal
          const pointsToAdd = calculateJXP(amount);
          updateJXP(pointsToAdd);
        } catch (error) {
          console.error('Error updating JXP state:', error);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transaksi gagal');
    } finally {
      setIsLoading(false);
    }
  }, [walletClient, publicClient, address, refetchNativeBalance, refetchWmonBalance, updateJXP, calculateJXP]);

  return {
    nativeBalance,
    wmonBalance,
    isLoading,
    txHash,
    isSuccess,
    error,
    handleWrap,
    handleUnwrap,
    calculateJXP
  };
} 