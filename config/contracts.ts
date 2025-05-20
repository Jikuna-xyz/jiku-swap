import { Address } from 'viem';
import JikunaFactoryABI from '../abis/JikunaFactory.json';
import JikunaSwapABI from '../abis/JikunaSwap.json';
import JikunaSwapETHABI from '../abis/JikunaSwapETH.json';
import WMONABI from '../abis/WMON.json';

export const JIKUNA_FACTORY_ADDRESS = '0xa681641357519Eea6aa27D2fE93Ab1dA357c3355' as const;
export const JIKUNA_SWAP_ADDRESS = '0x9906c1FbaD6262E72fC3aA1db42A89a3629f93EE' as const;
export const JIKUNA_SWAP_ETH_ADDRESS = '0x0f36AF6f7EA2b7708D756991E1f13ec0Add23998' as const;
export const JIKUNA_XP_V2_ADDRESS = '0x1b869CEaC99F779e881DbD1354a3582F8bca9Af3' as const;

export const JIKUNA_FACTORY_ABI = JikunaFactoryABI;
export const JIKUNA_SWAP_ABI = JikunaSwapABI;
export const JIKUNA_SWAP_ETH_ABI = JikunaSwapETHABI;
export const WMON_ABI = WMONABI;

// Definisi ABI JikunaXtraPointsV2 secara langsung
export const JIKUNA_XP_V2_ABI = [
  {
    type: 'function',
    name: 'getTotalJXP',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ type: 'uint256' }]
  },
  {
    type: 'function',
    name: 'getLifetimeJXP',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ type: 'uint256' }]
  },
  {
    type: 'function',
    name: 'getUserTier',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ type: 'uint8' }]
  },
  {
    type: 'function',
    name: 'getUserRank',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ type: 'uint256' }]
  },
  {
    type: 'function',
    name: 'getAvailableRewards',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256[]' }]
  },
  {
    type: 'function',
    name: 'getRewardDetails',
    stateMutability: 'view',
    inputs: [{ name: 'rewardId', type: 'uint256' }],
    outputs: [
      { name: 'id', type: 'uint256' },
      { name: 'name', type: 'string' },
      { name: 'description', type: 'string' },
      { name: 'imageUrl', type: 'string' },
      { name: 'requiredJXP', type: 'uint256' },
      { name: 'requiredTier', type: 'uint256' },
      { name: 'expiryDate', type: 'uint256' },
      { name: 'isActive', type: 'bool' },
      { name: 'claimedCount', type: 'uint256' }
    ]
  },
  {
    type: 'function',
    name: 'userClaimedRewards',
    stateMutability: 'view',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'rewardId', type: 'uint256' }
    ],
    outputs: [{ type: 'bool' }]
  },
  {
    type: 'function',
    name: 'claimReward',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'rewardId', type: 'uint256' }],
    outputs: []
  },
  {
    type: 'function',
    name: 'updateJXP',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'points', type: 'uint256' }
    ],
    outputs: []
  },
  {
    type: 'function',
    name: 'batchUpdateJXP',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'users', type: 'address[]' },
      { name: 'points', type: 'uint256[]' }
    ],
    outputs: []
  },
  {
    type: 'event',
    name: 'JXPUpdated',
    inputs: [
      { indexed: true, name: 'user', type: 'address' },
      { indexed: false, name: 'amount', type: 'uint256' },
      { indexed: false, name: 'totalJXP', type: 'uint256' },
      { indexed: false, name: 'lifetimeJXP', type: 'uint256' }
    ]
  },
  {
    type: 'event',
    name: 'RewardClaimed',
    inputs: [
      { indexed: true, name: 'user', type: 'address' },
      { indexed: true, name: 'rewardId', type: 'uint256' },
      { indexed: false, name: 'rewardName', type: 'string' },
      { indexed: false, name: 'timestamp', type: 'uint256' }
    ]
  },
  {
    type: 'event',
    name: 'TierChanged',
    inputs: [
      { indexed: true, name: 'user', type: 'address' },
      { indexed: false, name: 'oldTier', type: 'uint8' },
      { indexed: false, name: 'newTier', type: 'uint8' }
    ]
  }
] as const;

export const TOKEN_ADDRESSES = {
  NATIVE: '0x0000000000000000000000000000000000000000' as Address, // MON native
  USDC: '0xf817257fed379853cDe0fa4F97AB987181B1E5Ea' as Address,
  USDT: '0x88b8E2161DEDC77EF4ab7585569D2415a1C1055D' as Address,
  WMON: '0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701' as Address,
  WETH: '0xB5a30b0FDc5EA94A52fDc42e3E9760Cb8449Fb37' as Address,
  aprMON: '0xb2f82D0f38dc453D596Ad40A37799446Cc89274A' as Address,
  DAK: '0x0F0BDEbF0F83cD1EE3974779Bcb7315f9808c714' as Address,
  COHG: '0xE0590015A873bF326bd645c3E1266d4db41C4E6B' as Address,
  YAKI: '0xfe140e1dCe99Be9F4F15d657CD9b7BF622270C50' as Address,
  shMON: '0x3a98250F98Dd388C211206983453837C8365BDc1' as Address,
  WBTC: '0xcf5a6076cfa32686c0Df13aBaDa2b40dec133F1d' as Address,
  gMON: '0xaEef2f6B429Cb59C9B2D7bB2141ADa993E8571c3' as Address,
};

export type TokenInfo = {
  address: Address;
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
};

export type PairInfo = {
  pairAddress: Address;
  token0: TokenInfo;
  token1: TokenInfo;
  reserves0: bigint;
  reserves1: bigint;
};

// Daftar token yang tersedia di Monad Testnet
export const MOCK_TOKENS: TokenInfo[] = [
  {
    address: TOKEN_ADDRESSES.NATIVE,
    name: 'Monad',
    symbol: 'MON',
    decimals: 18,
    logoURI: '/tokens/mon.png'
  },
  {
    address: TOKEN_ADDRESSES.USDC,
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 6,
    logoURI: '/tokens/usdc.png'
  },
  {
    address: TOKEN_ADDRESSES.USDT,
    name: 'Tether',
    symbol: 'USDT',
    decimals: 6,
    logoURI: '/tokens/usdt.png'
  },
  {
    address: TOKEN_ADDRESSES.WMON,
    name: 'Wrapped Monad',
    symbol: 'WMON',
    decimals: 18,
    logoURI: '/tokens/wmon.png'
  },
  {
    address: TOKEN_ADDRESSES.WETH,
    name: 'Wrapped Ethereum',
    symbol: 'WETH',
    decimals: 18,
    logoURI: '/tokens/weth.png'
  },
  {
    address: TOKEN_ADDRESSES.WBTC,
    name: 'Wrapped Bitcoin',
    symbol: 'WBTC',
    decimals: 8,
    logoURI: '/tokens/wbtc.png'
  },
  {
    address: TOKEN_ADDRESSES.aprMON,
    name: 'April Monad',
    symbol: 'aprMON',
    decimals: 18,
    logoURI: '/tokens/aprmon.png'
  },
  {
    address: TOKEN_ADDRESSES.DAK,
    name: 'Daku Finance',
    symbol: 'DAK',
    decimals: 18,
    logoURI: '/tokens/dak.png'
  },
  {
    address: TOKEN_ADDRESSES.COHG,
    name: 'Coinhunters',
    symbol: 'COHG',
    decimals: 18,
    logoURI: '/tokens/cohg.png'
  },
  {
    address: TOKEN_ADDRESSES.YAKI,
    name: 'Yakitori',
    symbol: 'YAKI',
    decimals: 18,
    logoURI: '/tokens/yaki.png'
  },
  {
    address: TOKEN_ADDRESSES.shMON,
    name: 'Staked MON',
    symbol: 'shMON',
    decimals: 18,
    logoURI: '/tokens/shmon.png'
  },
  {
    address: TOKEN_ADDRESSES.gMON,
    name: 'Governance MON',
    symbol: 'gMON',
    decimals: 18,
    logoURI: '/tokens/gmon.png'
  },
]; 