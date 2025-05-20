"use client";

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useFarcasterFrame } from '@/components/FarcasterFrameProvider';
import { useAccount } from 'wagmi';
import { WalletConnector } from '@/components/WalletConnector';

export default function FarcasterPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { frameSwapState, executeFrameSwap, isFarcasterFrame, fid } = useFarcasterFrame();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Parameter dari URL
  const action = searchParams?.get('action');
  const fromToken = searchParams?.get('fromToken') || frameSwapState.fromToken;
  const toToken = searchParams?.get('toToken') || frameSwapState.toToken;
  const amount = searchParams?.get('amount') || frameSwapState.amount;
  
  // Otomatis eksekusi swap jika semua kondisi terpenuhi
  useEffect(() => {
    const executeSwapIfReady = async () => {
      if (action === 'swap' && isConnected && frameSwapState.active && !isProcessing && !isSuccess) {
        try {
          setIsProcessing(true);
          setError(null);
          
          // Eksekusi swap
          await executeFrameSwap();
          
          // Set state sukses
          setIsSuccess(true);
        } catch (err) {
          console.error('Error executing swap:', err);
          setError('Terjadi kesalahan saat melakukan swap. Silakan coba lagi.');
        } finally {
          setIsProcessing(false);
        }
      }
    };
    
    executeSwapIfReady();
  }, [action, isConnected, frameSwapState, executeFrameSwap, isProcessing, isSuccess]);
  
  // Handling untuk tombol kembali
  const handleBack = () => {
    // Coba gunakan history back, lalu fallback ke halaman utama
    if (window.history.length > 1) {
      window.history.back();
    } else {
      router.push('/');
    }
  };
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#0f172a] to-[#1e293b] p-4">
      <Card className="w-full max-w-md bg-black/40 border-gray-800">
        <CardHeader>
          <CardTitle className="text-2xl text-center text-white">
            Jikuna Swap x Farcaster
          </CardTitle>
          <CardDescription className="text-center text-gray-400">
            {isFarcasterFrame 
              ? 'Terkoneksi dengan Farcaster MiniApp'
              : 'Halaman integrasi dengan Farcaster MiniApp'}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {!isConnected ? (
            <div className="space-y-4">
              <div className="text-center text-sm text-gray-400 mb-4">
                Hubungkan wallet Anda untuk menggunakan fitur swap
              </div>
              <div className="flex justify-center">
                <WalletConnector />
              </div>
            </div>
          ) : isSuccess ? (
            <div className="space-y-4 text-center">
              <div className="bg-green-900/30 text-green-400 p-4 rounded-lg border border-green-900">
                <div className="text-3xl mb-2">🎉</div>
                <h3 className="text-xl font-semibold mb-2">Swap Berhasil!</h3>
                <p className="text-sm text-gray-300">
                  Anda telah berhasil menukar {amount} {fromToken} ke {toToken}
                </p>
              </div>
              
              <Button 
                onClick={handleBack}
                className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
              >
                Kembali
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {frameSwapState.active ? (
                <div className="bg-blue-900/30 border border-blue-900/50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-blue-400 mb-2">Detail Swap</h3>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Jumlah</span>
                      <span className="font-medium">{frameSwapState.amount} {frameSwapState.fromToken}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Terima</span>
                      <span className="font-medium">
                        {frameSwapState.fromToken === 'MON' && frameSwapState.toToken === 'USDC' 
                          ? (parseFloat(frameSwapState.amount) * 12.5).toFixed(2)
                          : frameSwapState.fromToken === 'USDC' && frameSwapState.toToken === 'MON'
                          ? (parseFloat(frameSwapState.amount) / 12.5).toFixed(6)
                          : '0.00'
                        } {frameSwapState.toToken}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Rate</span>
                      <span className="font-medium">
                        1 {frameSwapState.fromToken} = {
                          frameSwapState.fromToken === 'MON' && frameSwapState.toToken === 'USDC' 
                            ? '12.50'
                            : frameSwapState.fromToken === 'USDC' && frameSwapState.toToken === 'MON'
                            ? '0.080'
                            : '1.00'
                        } {frameSwapState.toToken}
                      </span>
                    </div>
                  </div>
                  
                  {error && (
                    <div className="bg-red-900/30 text-red-400 p-3 rounded-md text-sm mb-4 border border-red-900/50">
                      {error}
                    </div>
                  )}
                  
                  <Button 
                    onClick={() => executeFrameSwap()}
                    disabled={isProcessing}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {isProcessing ? 'Memproses...' : 'Konfirmasi Swap'}
                  </Button>
                </div>
              ) : (
                <div className="text-center text-sm text-gray-400">
                  Tidak ada transaksi swap yang tertunda dari Farcaster Frame
                </div>
              )}
              
              <div className="pt-4 border-t border-gray-800">
                <Button 
                  variant="outline" 
                  onClick={handleBack}
                  className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  Kembali ke Jikuna Swap
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}