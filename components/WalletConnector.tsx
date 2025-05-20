"use client";

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useBalance } from 'wagmi';
import { formatEther } from 'viem';
import { monadTestnet } from '@/lib/wagmi';
import { useEffect, useState } from 'react';

export function WalletConnector() {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });
  const [isFarcasterFrame, setIsFarcasterFrame] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsFarcasterFrame(
        window.location.href.includes('fromFrame=true') ||
        window.location.href.includes('fid=')
      );
    }
  }, []);

  // Fallback UI untuk Farcaster Frame
  if (isFarcasterFrame) {
    return (
      <div className="flex flex-col gap-2">
        {isConnected ? (
          <>
            <div className="text-green-500 font-semibold">Wallet Connected</div>
            <div className="text-xs break-all">{address}</div>
            {balance && (
              <div className="text-sm text-zinc-400">
                Balance: {parseFloat(formatEther(balance.value)).toFixed(4)} {balance.symbol}
              </div>
            )}
          </>
        ) : (
          <div className="text-yellow-500">Wallet not connected</div>
        )}
      </div>
    );
  }

  // Mode web biasa (RainbowKit)
  return (
    <div className="flex flex-col gap-4">
      <ConnectButton.Custom>
        {({
          account,
          chain,
          openAccountModal,
          openChainModal,
          openConnectModal,
          mounted,
        }) => {
          const ready = mounted;
          const connected = ready && account && chain;

          return (
            <div
              {...(!ready && {
                'aria-hidden': true,
                style: {
                  opacity: 0,
                  pointerEvents: 'none',
                  userSelect: 'none',
                },
              })}
              className="flex items-center gap-2"
            >
              {(() => {
                if (!connected) {
                  return (
                    <button
                      onClick={openConnectModal}
                      className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white shadow-sm hover:bg-blue-500"
                    >
                      Connect Wallet
                    </button>
                  );
                }

                if (chain.unsupported) {
                  return (
                    <button
                      onClick={openChainModal}
                      className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white shadow-sm hover:bg-red-500"
                    >
                      Wrong Network
                    </button>
                  );
                }

                return (
                  <div className="flex items-center gap-4">
                    <button
                      onClick={openChainModal}
                      className="flex items-center gap-1 rounded-lg bg-zinc-800 px-3 py-2 text-sm font-medium text-white"
                    >
                      {chain.name}
                    </button>

                    <button
                      onClick={openAccountModal}
                      className="flex items-center gap-2 rounded-lg bg-zinc-800 px-3 py-2 text-sm font-medium text-white"
                    >
                      {account.displayName}
                      {account.displayBalance && ` (${account.displayBalance})`}
                    </button>
                  </div>
                );
              })()}
            </div>
          );
        }}
      </ConnectButton.Custom>

      {isConnected && balance && (
        <div className="text-sm text-zinc-400">
          Balance: {parseFloat(formatEther(balance.value)).toFixed(4)} {balance.symbol}
        </div>
      )}
    </div>
  );
} 