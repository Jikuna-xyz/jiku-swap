export interface JXPUpdate {
  _id?: string;
  user: string; // address of user
  pendingJXP: number;
  lastUpdated: Date;
}

export interface SystemStats {
  _id: string; // "global"
  lastUpdateTime: Date;
  nextScheduledUpdate: Date;
  totalProcessedSwaps: number;
  totalJXPAwarded: number;
} 