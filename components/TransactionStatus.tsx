"use client";

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface TransactionStatusProps {
  hash?: string | null;
  isPending: boolean;
  isSuccess?: boolean;
  error?: Error | null;
  onClose: () => void;
}

export function TransactionStatus({
  hash,
  isPending,
  isSuccess,
  error,
  onClose,
}: TransactionStatusProps) {
  const { toast } = useToast();
  const [showStatus, setShowStatus] = useState<boolean>(false);

  useEffect(() => {
    if (hash || isPending || isSuccess || error) {
      setShowStatus(true);
    }
  }, [hash, isPending, isSuccess, error]);

  useEffect(() => {
    if (error) {
      toast({
        title: 'Transaksi Gagal',
        description: error.message,
        variant: 'destructive',
      });
    } else if (isSuccess && hash) {
      toast({
        title: 'Transaksi Berhasil',
        description: `Hash Transaksi: ${hash}`,
      });
    }
  }, [isSuccess, error, hash, toast]);

  if (!showStatus) return null;

  return (
    <div className="fixed bottom-6 right-6 w-80 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl overflow-hidden">
      <div className="flex justify-between items-center p-4 border-b border-zinc-800">
        <h3 className="font-semibold text-white">Status Transaksi</h3>
        <button
          onClick={() => {
            setShowStatus(false);
            onClose();
          }}
          className="text-zinc-400 hover:text-zinc-200"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      
      <div className="p-4">
        {isPending && (
          <div className="flex items-center gap-3 text-white mb-4">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span>Transaksi sedang diproses...</span>
          </div>
        )}

        {isSuccess && (
          <div className="flex items-center gap-3 text-green-500 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <span>Transaksi berhasil</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 text-red-500 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>Transaksi gagal</span>
          </div>
        )}

        {hash && (
          <div className="mb-4">
            <div className="text-sm text-zinc-400 mb-1">Hash Transaksi:</div>
            <div className="p-2 bg-zinc-800 rounded overflow-x-auto">
              <a
                href={`https://testnet.monadexplorer.com/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 text-sm hover:underline break-all"
              >
                {hash}
              </a>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4">
            <div className="text-sm text-zinc-400 mb-1">Pesan Error:</div>
            <div className="p-2 bg-zinc-800 rounded overflow-x-auto">
              <span className="text-red-400 text-sm break-all">{error.message}</span>
            </div>
          </div>
        )}

        {(isSuccess || error) && (
          <button
            onClick={() => {
              setShowStatus(false);
              onClose();
            }}
            className="w-full py-2 px-4 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700"
          >
            Tutup
          </button>
        )}
      </div>
    </div>
  );
} 