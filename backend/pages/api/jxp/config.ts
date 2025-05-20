import { NextApiRequest, NextApiResponse } from 'next'
import { contracts } from '@/config/contracts'
import { monadTestnet } from '@/config/chains'

// Endpoint untuk melihat konfigurasi yang digunakan
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Hanya izinkan metode GET
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  try {
    // Buat objek konfigurasi untuk ditampilkan
    const configInfo = {
      contracts: {
        jikunaSwap: {
          address: contracts.jikunaSwap.address,
          fromBlock: contracts.jikunaSwap.fromBlock.toString(),
        },
        jikunaSwapETH: {
          address: contracts.jikunaSwapETH.address,
          fromBlock: contracts.jikunaSwapETH.fromBlock.toString(),
        },
        jikunaXtraPointsV2: {
          address: contracts.jikunaXtraPointsV2.address,
        },
      },
      chain: {
        id: monadTestnet.id,
        name: monadTestnet.name,
        rpcUrl: process.env.MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz',
      },
      environment: {
        MONGODB_URI: process.env.MONGODB_URI ? 'Set ✓' : 'Not Set ✗',
        MONAD_RPC_URL: process.env.MONAD_RPC_URL ? 'Set ✓' : 'Not Set ✗',
        PRIVATE_KEY: process.env.PRIVATE_KEY ? 'Set ✓' : 'Not Set ✗',
        CONTRACT_ADDRESSES: {
          JIKUNA_SWAP_ADDRESS: process.env.JIKUNA_SWAP_ADDRESS ? 'Set ✓' : 'Not Set ✗',
          JIKUNA_SWAP_ETH_ADDRESS: process.env.JIKUNA_SWAP_ETH_ADDRESS ? 'Set ✓' : 'Not Set ✗',
          JXP_CONTRACT_ADDRESS: process.env.JXP_CONTRACT_ADDRESS ? 'Set ✓' : 'Not Set ✗',
        }
      }
    }
    
    return res.status(200).json({ success: true, config: configInfo })
  } catch (error) {
    console.error('Error getting config:', error)
    return res.status(500).json({ success: false, message: 'Error getting config', error: String(error) })
  }
} 