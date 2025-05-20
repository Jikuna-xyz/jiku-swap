export const contracts = {
  jikunaSwap: {
    address: process.env.JIKUNA_SWAP_ADDRESS || '0x9906c1FbaD6262E72fC3aA1db42A89a3629f93EE',
    fromBlock: BigInt(0), // Update this with actual deployment block for production
  },
  jikunaSwapETH: {
    address: process.env.JIKUNA_SWAP_ETH_ADDRESS || '0x0f36AF6f7EA2b7708D756991E1f13ec0Add23998',
    fromBlock: BigInt(0), // Update this with actual deployment block for production
  },
  jikunaXtraPointsV2: {
    address: process.env.JXP_CONTRACT_ADDRESS || '0x1b869CEaC99F779e881DbD1354a3582F8bca9Af3',
  },
}

export const adminWallet = {
  address: '0x3E5350732810d539541d5e36DCB9777816E8c934', // Admin with UPDATER role
} 