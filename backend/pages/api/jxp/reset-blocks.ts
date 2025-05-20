import { NextApiRequest, NextApiResponse } from 'next'
import { getDb } from '@/lib/database/mongodb'
import { createPublicClient, http, defineChain } from 'viem'
import { monadTestnet } from '@/config/chains'
import { verifyAdminApiKey, verifyCronSecret } from '@/lib/utils/auth'

// Variable untuk menyimpan last processed blocks (akan diakses via global)
declare global {
  var lastProcessedBlockJikunaSwap: bigint | undefined;
  var lastProcessedBlockJikunaSwapETH: bigint | undefined;
}

// Inisialisasi Viem client
const client = createPublicClient({
  chain: defineChain(monadTestnet),
  transport: http(process.env.MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz'),
})

// Reset block terakhir yang diproses dan scan ulang event swap
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Hanya izinkan metode POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  // Pemeriksaan autentikasi (menerima API key admin atau cron secret)
  const isAdminAuthorized = verifyAdminApiKey(req);
  const isCronAuthorized = verifyCronSecret(req);
  
  if (!isAdminAuthorized && !isCronAuthorized) {
    return res.status(401).json({ 
      success: false, 
      message: 'Unauthorized. Missing or invalid authorization.' 
    });
  }

  try {
    // Koneksi ke MongoDB - bukan syarat utama, hanya memastikan koneksi ada
    await getDb()
    
    // Dapatkan block saat ini
    const currentBlock = await client.getBlockNumber()
    
    // Hitung block untuk mulai scan
    // Perbaikan: bisa menerima blockNumber langsung atau jumlah blocks untuk scan ke belakang
    let startBlock: bigint;
    
    if (req.body?.blockNumber) {
      // Jika blockNumber langsung diberikan, gunakan itu
      const blockNumber = BigInt(req.body.blockNumber);
      startBlock = blockNumber > BigInt(0) ? blockNumber : BigInt(0);
    } else {
      // Gunakan jumlah blocks untuk scan ke belakang dari current block
      const blocksToScan = req.body?.blocks ? BigInt(req.body.blocks) : BigInt(1000); // Default 1000 block terakhir
      startBlock = currentBlock > blocksToScan ? currentBlock - blocksToScan : BigInt(0);
    }
    
    // Simpan nilai block di global variables
    global.lastProcessedBlockJikunaSwap = startBlock
    global.lastProcessedBlockJikunaSwapETH = startBlock
    
    return res.status(200).json({ 
      success: true, 
      message: `Reset blok berhasil. Akan memulai scan dari block ${startBlock}`,
      currentBlock: currentBlock.toString(),
      newStartBlock: startBlock.toString()
    })
  } catch (error) {
    console.error('Error resetting blocks:', error)
    return res.status(500).json({ success: false, message: 'Error resetting blocks', error: String(error) })
  }
} 