export interface SwapEvent {
  _id?: string;
  user: string; // address of user
  timestamp: Date;
  txHash: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: string; // amount as string to handle large numbers
  amountOut: string;
  volumeMON: number; // volume in MON
  calculatedJXP: number; // JXP earned
  processed: boolean;
  processedAt?: Date;
} 