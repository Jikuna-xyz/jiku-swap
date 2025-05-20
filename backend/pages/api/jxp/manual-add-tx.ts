import { NextApiRequest, NextApiResponse } from 'next'
import { createPublicClient, http, formatEther, defineChain } from 'viem'
import { monadTestnet, NATIVE_TOKEN_ADDRESS } from '@/config/chains'
import { contracts } from '@/config/contracts'
import { SwapEvent } from '@/types/swap-event'
import { getSwapEventByTxHash, saveSwapEvents } from '@/lib/database/swap-events'

// Initialize Viem client
const client = createPublicClient({
  chain: defineChain(monadTestnet),
  transport: http(process.env.MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz'),
})

// Endpoint untuk menambahkan tx manual
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Hanya izinkan metode POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  const { txHash, user, tokenIn, tokenOut, amountIn, amountOut, volumeMON } = req.body

  try {
    if (!txHash || !user) {
      return res.status(400).json({ 
        success: false, 
        message: 'Transaction hash dan user address diperlukan' 
      })
    }

    // Verifikasi tx sudah ada atau belum
    const existingEvent = await getSwapEventByTxHash(txHash)
    if (existingEvent) {
      return res.status(200).json({
        success: false,
        message: 'Transaction sudah diproses sebelumnya',
        existingEvent
      })
    }

    // Jika body request tidak lengkap, coba dapatkan info dari receipt
    let userAddress = user
    let tokenInAddress = tokenIn
    let tokenOutAddress = tokenOut
    let amountInValue = amountIn || '1000000000000000000' // 1 default
    let amountOutValue = amountOut || '1000000000000000000' // 1 default
    let volumeMonValue = volumeMON || 10 // 10 MON default

    try {
      // Get receipt jika user hanya memberikan tx hash
      if (!tokenIn || !tokenOut) {
        const receipt = await client.getTransactionReceipt({ 
          hash: txHash as `0x${string}` 
        })

        const jikunaSwapLogs = receipt.logs.filter(
          log => log.address.toLowerCase() === contracts.jikunaSwap.address.toLowerCase()
        )
        
        const jikunaSwapETHLogs = receipt.logs.filter(
          log => log.address.toLowerCase() === contracts.jikunaSwapETH.address.toLowerCase()
        )

        // Dalam kasus nyata, kita perlu decode logs
        // Kita gunakan nilai placeholder saja untuk contoh manual
        if (jikunaSwapLogs.length > 0 || jikunaSwapETHLogs.length > 0) {
          // Gunakan nilai default atau dari transaksi lain untuk tes saja
          userAddress = user
          tokenInAddress = tokenIn || NATIVE_TOKEN_ADDRESS
          tokenOutAddress = tokenOut || contracts.jikunaSwap.address
          volumeMonValue = volumeMON || 10
        }
      }
    } catch (error) {
      console.error('Error getting transaction receipt:', error)
      // Lanjutkan dengan data yang ada
    }

    // Hitung JXP (1 JXP per 10 MON volume)
    const calculatedJXP = Math.floor(Number(volumeMonValue) / 10)
    
    const swapEvent: SwapEvent = {
      user: userAddress as `0x${string}`,
      timestamp: new Date(),
      txHash: txHash as `0x${string}`,
      tokenIn: tokenInAddress as `0x${string}`,
      tokenOut: tokenOutAddress as `0x${string}`,
      amountIn: amountInValue.toString(),
      amountOut: amountOutValue.toString(),
      volumeMON: Number(volumeMonValue),
      calculatedJXP,
      processed: false,
    }
    
    // Save to database
    await saveSwapEvents([swapEvent])
    
    return res.status(200).json({
      success: true,
      message: 'Swap event berhasil ditambahkan secara manual',
      swapEvent
    })
  } catch (error) {
    console.error('Error adding manual transaction:', error)
    return res.status(500).json({
      success: false,
      message: 'Error saat menambahkan transaksi manual',
      error: String(error)
    })
  }
} 