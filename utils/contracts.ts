import { Address, parseUnits, formatUnits } from 'viem';
import { 
  JIKUNA_SWAP_ABI, 
  JIKUNA_SWAP_ADDRESS, 
  JIKUNA_SWAP_ETH_ABI, 
  JIKUNA_SWAP_ETH_ADDRESS 
} from '@/config/contracts';
import { getConfig } from '@/lib/wagmi';
import { readContract } from '@wagmi/core';

/**
 * Calculate deadline timestamp for transactions
 * @param minutes Minutes to add to current time
 * @returns Deadline timestamp in seconds
 */
export function calculateDeadline(minutes: number = 20): bigint {
  return BigInt(Math.floor(Date.now() / 1000) + 60 * minutes);
}

/**
 * Calculate minimum output amount based on expected output and slippage
 * @param outputAmount Expected output amount
 * @param slippage Slippage percentage (e.g., 0.5 for 0.5%)
 * @param decimals Decimals of the token
 * @returns Minimum output amount with slippage applied
 */
export function calculateMinimumOutputAmount(
  outputAmount: string,
  slippage: number = 0.5,
  decimals: number = 18
): bigint {
  if (!outputAmount || outputAmount === '0') {
    return BigInt(0);
  }
  
  try {
    const slippageFactor = 1 - slippage / 100;
    const minOutput = parseFloat(outputAmount) * slippageFactor;
    return parseUnits(minOutput.toString(), decimals);
  } catch (error) {
    console.error('Error calculating minimum output amount:', error);
    return BigInt(0);
  }
}

/**
 * Get estimated output amount for a token swap
 */
export async function getEstimatedOutputAmount(
  tokenIn: Address,
  tokenOut: Address,
  amountIn: string,
  decimalsIn: number = 18
): Promise<string> {
  if (!tokenIn || !tokenOut || !amountIn || parseFloat(amountIn) === 0) {
    return '0';
  }

  try {
    const amountInWei = parseUnits(amountIn, decimalsIn);
    const config = getConfig();
    
    // Panggil fungsi getAmountOut dari kontrak
    const result = await readContract(config, {
      address: JIKUNA_SWAP_ADDRESS,
      abi: JIKUNA_SWAP_ABI,
      functionName: 'getAmountOut',
      args: [tokenIn, tokenOut, amountInWei],
    });

    // Hasil dari fungsi getAmountOut akan berupa bigint
    return formatUnits(result as bigint, 18);
  } catch (error) {
    console.error('Error getting estimated output amount:', error);
    return '0';
  }
} 