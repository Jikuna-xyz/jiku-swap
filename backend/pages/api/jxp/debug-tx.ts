import { NextApiRequest, NextApiResponse } from 'next'
import { createPublicClient, http, parseAbiItem, formatEther, defineChain } from 'viem'
import { monadTestnet, NATIVE_TOKEN_ADDRESS } from '@/config/chains'
import { contracts } from '@/config/contracts'
import { SwapEvent } from '@/types/swap-event'
import { getSwapEventByTxHash, saveSwapEvents } from '@/lib/database/swap-events'

// Define event ABIs directly as const objects instead of using parseAbiItem
const swapEventAbi = {
  anonymous: false,
  inputs: [
    { indexed: true, name: 'sender', type: 'address' },
    { indexed: false, name: 'amount0In', type: 'uint256' },
    { indexed: false, name: 'amount1In', type: 'uint256' },
    { indexed: false, name: 'amount0Out', type: 'uint256' },
    { indexed: false, name: 'amount1Out', type: 'uint256' },
    { indexed: true, name: 'to', type: 'address' },
    { indexed: true, name: 'tokenIn', type: 'address' },
    { indexed: true, name: 'tokenOut', type: 'address' }
  ],
  name: 'Swap',
  type: 'event'
} as const

const swapETHEventAbi = {
  anonymous: false,
  inputs: [
    { indexed: true, name: 'sender', type: 'address' },
    { indexed: false, name: 'ethAmount', type: 'uint256' },
    { indexed: false, name: 'tokenAmount', type: 'uint256' },
    { indexed: true, name: 'to', type: 'address' },
    { indexed: true, name: 'token', type: 'address' },
    { indexed: false, name: 'ethToToken', type: 'bool' }
  ],
  name: 'SwapETH',
  type: 'event'
} as const

// Initialize Viem client
const client = createPublicClient({
  chain: defineChain(monadTestnet),
  transport: http(process.env.MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz'),
})

// Endpoint untuk debug transaksi spesifik
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Hanya izinkan metode GET
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  try {
    const { txHash } = req.query
    
    if (!txHash || typeof txHash !== 'string') {
      return res.status(400).json({ 
        success: false, 
        message: 'Transaction hash is required as query parameter' 
      })
    }
    
    // Check if transaction already processed
    const existingEvent = await getSwapEventByTxHash(txHash as `0x${string}`)
    
    // Get transaction receipt for detailed information
    const receipt = await client.getTransactionReceipt({ 
      hash: txHash as `0x${string}` 
    })
    
    // Convert any BigInt values to string for JSON serialization
    const serializeSafely = (obj: any): any => {
      if (typeof obj === 'bigint') {
        return obj.toString();
      }
      
      if (Array.isArray(obj)) {
        return obj.map(serializeSafely);
      }
      
      if (obj !== null && typeof obj === 'object') {
        const result: Record<string, any> = {};
        for (const key in obj) {
          result[key] = serializeSafely(obj[key]);
        }
        return result;
      }
      
      return obj;
    };

    // Get transaction details
    const transaction = await client.getTransaction({ 
      hash: txHash as `0x${string}` 
    })
    
    // Get logs specifically for our contracts
    const jikunaSwapLogs = receipt.logs.filter(
      log => log.address.toLowerCase() === contracts.jikunaSwap.address.toLowerCase()
    )
    
    const jikunaSwapETHLogs = receipt.logs.filter(
      log => log.address.toLowerCase() === contracts.jikunaSwapETH.address.toLowerCase()
    )
    
    // Check if this is a standard ERC20-ERC20 swap
    let swapInfo = null
    try {
      const decodedSwapLogs = await client.getLogs({
        address: contracts.jikunaSwap.address as `0x${string}`,
        event: swapEventAbi,
        fromBlock: BigInt(receipt.blockNumber),
        toBlock: BigInt(receipt.blockNumber),
      })
      
      if (decodedSwapLogs.length > 0) {
        const log = decodedSwapLogs[0]
        swapInfo = {
          type: 'ERC20-ERC20',
          contract: contracts.jikunaSwap.address,
          sender: log.args?.sender,
          tokenIn: log.args?.tokenIn,
          tokenOut: log.args?.tokenOut,
          amount0In: log.args?.amount0In?.toString() || '0',
          amount1In: log.args?.amount1In?.toString() || '0',
          amount0Out: log.args?.amount0Out?.toString() || '0',
          amount1Out: log.args?.amount1Out?.toString() || '0',
        }
      }
    } catch (error) {
      console.error('Error decoding standard swap logs:', error)
    }
    
    // Check if this is an ETH swap
    let ethSwapInfo = null
    try {
      const decodedETHSwapLogs = await client.getLogs({
        address: contracts.jikunaSwapETH.address as `0x${string}`,
        event: swapETHEventAbi,
        fromBlock: BigInt(receipt.blockNumber),
        toBlock: BigInt(receipt.blockNumber),
      })
      
      if (decodedETHSwapLogs.length > 0) {
        const log = decodedETHSwapLogs[0]
        ethSwapInfo = {
          type: 'ETH-ERC20',
          contract: contracts.jikunaSwapETH.address,
          sender: log.args?.sender,
          to: log.args?.to,
          token: log.args?.token,
          ethAmount: log.args?.ethAmount?.toString() || '0',
          tokenAmount: log.args?.tokenAmount?.toString() || '0',
          ethToToken: log.args?.ethToToken,
        }
      }
    } catch (error) {
      console.error('Error decoding ETH swap logs:', error)
    }
    
    // Manually process the transaction and add to the database if it's a valid swap
    let manuallyProcessed = false
    let createdEvent = null
    
    if ((swapInfo || ethSwapInfo) && !existingEvent) {
      try {
        // Create a swap event based on the type
        let swapEvent: SwapEvent
        
        if (ethSwapInfo) {
          // This is an ETH swap
          const ethAmount = BigInt(ethSwapInfo.ethAmount)
          const tokenAmount = BigInt(ethSwapInfo.tokenAmount)
          const ethToToken = ethSwapInfo.ethToToken === true
          
          // Volume in MON is the ETH amount
          const volumeMON = Number(formatEther(ethAmount))
          
          // Calculate JXP (1 JXP per 10 MON volume)
          const calculatedJXP = Math.floor(volumeMON / 10)
          
          // Set token in and out based on swap direction
          const tokenIn = ethToToken ? NATIVE_TOKEN_ADDRESS : (ethSwapInfo.token as string)
          const tokenOut = ethToToken ? (ethSwapInfo.token as string) : NATIVE_TOKEN_ADDRESS
          const amountIn = ethToToken ? ethAmount : tokenAmount
          const amountOut = ethToToken ? tokenAmount : ethAmount
          
          swapEvent = {
            user: ethSwapInfo.sender as string,
            timestamp: new Date(),
            txHash: txHash as `0x${string}`,
            tokenIn,
            tokenOut,
            amountIn: amountIn.toString(),
            amountOut: amountOut.toString(),
            volumeMON,
            calculatedJXP,
            processed: false,
          }
        } else if (swapInfo) {
          // This is an ERC20-ERC20 swap
          // Determine amounts based on which token is in vs out
          const amount0In = BigInt(swapInfo.amount0In)
          const amount1In = BigInt(swapInfo.amount1In)
          const amount0Out = BigInt(swapInfo.amount0Out)
          const amount1Out = BigInt(swapInfo.amount1Out)
          
          const amountIn = amount0In > 0 ? amount0In : amount1In
          const amountOut = amount0Out > 0 ? amount0Out : amount1Out
          
          // Calculate volume in MON (simplified approach)
          let volumeMON = 10 // Default example value
          
          // If either token is MON or WMON, use that amount directly
          if (swapInfo.tokenIn && swapInfo.tokenIn.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase()) {
            volumeMON = Number(formatEther(amountIn))
          } else if (swapInfo.tokenOut && swapInfo.tokenOut.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase()) {
            volumeMON = Number(formatEther(amountOut))
          }
          
          // Calculate JXP (1 JXP per 10 MON volume)
          const calculatedJXP = Math.floor(volumeMON / 10)
          
          swapEvent = {
            user: swapInfo.sender as string,
            timestamp: new Date(),
            txHash: txHash as `0x${string}`,
            tokenIn: swapInfo.tokenIn as string,
            tokenOut: swapInfo.tokenOut as string,
            amountIn: amountIn.toString(),
            amountOut: amountOut.toString(),
            volumeMON,
            calculatedJXP,
            processed: false,
          }
        } else {
          throw new Error('No valid swap information found')
        }
        
        // Save to database
        await saveSwapEvents([swapEvent])
        manuallyProcessed = true
        createdEvent = swapEvent
      } catch (error) {
        console.error('Error manually processing swap:', error)
      }
    }
    
    return res.status(200).json({
      success: true,
      data: serializeSafely({
        transactionHash: txHash,
        blockNumber: receipt.blockNumber,
        alreadyProcessed: !!existingEvent,
        existingEvent,
        contractInfo: {
          jikunaSwap: contracts.jikunaSwap.address,
          jikunaSwapETH: contracts.jikunaSwapETH.address,
        },
        matchesJikunaSwap: jikunaSwapLogs.length > 0,
        matchesJikunaSwapETH: jikunaSwapETHLogs.length > 0,
        logs: {
          totalLogs: receipt.logs.length,
          jikunaSwapLogsCount: jikunaSwapLogs.length,
          jikunaSwapETHLogsCount: jikunaSwapETHLogs.length,
        },
        decodedInfo: {
          swapInfo,
          ethSwapInfo
        },
        manualProcessing: {
          processed: manuallyProcessed,
          createdEvent,
        }
      })
    })
  } catch (error) {
    console.error('Error debugging transaction:', error)
    return res.status(500).json({ 
      success: false, 
      message: 'Error debugging transaction', 
      error: String(error) 
    })
  }
} 