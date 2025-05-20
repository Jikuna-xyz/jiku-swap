"use client";

import React, { useState, useEffect } from 'react';
import { ExternalLink, Check, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';

// Interface matching the usage in enhanced-swap-screen.tsx
interface SwapSuccessPopupProps {
  onClose: () => void;
  txHash: string;
  fromToken: any; // Token object
  toToken: any; // Token object
  fromAmount: string;
  toAmount: string;
  jxpEarned: number;
  explorerUrl?: string;
}

const SwapSuccessPopup = ({
  onClose,
  txHash,
  fromToken,
  toToken,
  fromAmount,
  toAmount,
  jxpEarned,
  explorerUrl = "https://testnet.monadexplorer.com/"
}: SwapSuccessPopupProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Auto close after 20 seconds
    const timer = setTimeout(() => {
      onClose();
    }, 20000);
    
    return () => clearTimeout(timer);
  }, [onClose]);

  // Don't render anything on server-side
  if (!mounted) return null;

  // Get token symbols
  const fromTokenSymbol = typeof fromToken === 'string' ? fromToken : fromToken.symbol;
  const toTokenSymbol = typeof toToken === 'string' ? toToken : toToken.symbol;

  // Truncate hash
  const truncatedHash = txHash ? txHash.slice(0, 6) + '...' + txHash.slice(-4) : '';
  const explorerLink = txHash ? `${explorerUrl}/tx/${txHash}` : '';

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center z-[9999] bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full max-w-md mx-auto"
      >
        <Card className="bg-[#212530] border border-[#343b43] shadow-lg rounded-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-500 py-4 px-5 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-white bg-white/30 rounded-full p-1" />
              <h3 className="text-white font-medium">Swap Successful!</h3>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Content */}
          <div className="p-5">
            {/* Swap details */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-[#999da1] text-sm">You swapped</span>
                <span className="text-white font-medium">{fromAmount} {fromTokenSymbol}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#999da1] text-sm">For</span>
                <span className="text-white font-medium">{toAmount} {toTokenSymbol}</span>
              </div>
            </div>
            
            {/* Transaction hash */}
            <div className="flex justify-between items-center mb-4 mt-4">
              <span className="text-[#999da1] text-sm">Transaction</span>
              <a 
                href={explorerLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm"
              >
                View in Explorer
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
            
            {/* JXP Earned */}
            <div className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 rounded-lg p-4 mb-4 border border-purple-700/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-gradient-to-r from-purple-600 to-blue-500 w-8 h-8 rounded-full flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium text-sm">JXP Earned</h4>
                    <p className="text-[#999da1] text-xs">Jikuna Xtra Points</p>
                  </div>
                </div>
                <div>
                  <span className="text-white font-bold">+{jxpEarned}</span>
                </div>
              </div>
              
              <div className="mt-3 text-xs text-[#a8adb7]">
                <p>For every 10 MON exchanged, you earn 1 JXP point.</p>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1 border-[#343b43] text-white hover:bg-[#343b43] hover:text-white"
                onClick={onClose}
              >
                Close
              </Button>
              <Button 
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white"
                onClick={() => window.open('/jxp-tiers', '_blank')}
              >
                <Sparkles className="h-4 w-4 mr-1" />
                View JXP
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>,
    document.body
  );
};

export default SwapSuccessPopup;