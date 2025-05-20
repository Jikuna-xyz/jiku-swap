"use client";

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { useFarcasterFrame } from './FarcasterFrameProvider';
import { useAccount } from 'wagmi';
import { Loader2 } from 'lucide-react';

interface FarcasterSwapButtonProps {
  className?: string;
}

export default function FarcasterSwapButton({ className }: FarcasterSwapButtonProps) {
  const { frameSwapState, executeFrameSwap, resetFrameSwapState } = useFarcasterFrame();
  const { isConnected } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [showButton, setShowButton] = useState(false);

  // Hanya tampilkan tombol jika frameSwapState aktif
  useEffect(() => {
    if (frameSwapState.active) {
      setShowButton(true);
    } else {
      setShowButton(false);
    }
  }, [frameSwapState]);

  // Handle swap dari farcaster frame
  const handleFrameSwap = async () => {
    if (!isConnected) {
      console.error("Wallet not connected");
      return;
    }

    try {
      setIsLoading(true);
      await executeFrameSwap();
    } catch (error) {
      console.error("Error executing swap:", error);
    } finally {
      setIsLoading(false);
      // Hide button after swap completes
      setShowButton(false);
    }
  };

  // Cancel frame swap
  const handleCancel = () => {
    resetFrameSwapState();
    setShowButton(false);
  };

  if (!showButton) {
    return null;
  }

  return (
    <div className="fixed bottom-20 right-4 flex flex-col gap-2 z-50">
      <div className="bg-black/80 backdrop-blur-md border border-blue-500/30 p-3 rounded-lg text-white text-sm shadow-lg">
        <h4 className="font-semibold text-blue-400 mb-2">Swap dari Farcaster Frame</h4>
        <div className="mb-3">
          <div className="flex justify-between">
            <span className="text-gray-400">Dari</span>
            <span>{frameSwapState.amount} {frameSwapState.fromToken}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Ke</span>
            <span>{frameSwapState.toToken}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs border-gray-700 hover:bg-gray-800" 
            onClick={handleCancel}
            disabled={isLoading}
          >
            Batal
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            className="text-xs bg-blue-600 hover:bg-blue-700" 
            onClick={handleFrameSwap}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                Proses...
              </>
            ) : (
              'Swap Sekarang'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}