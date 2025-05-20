import { NextApiRequest, NextApiResponse } from 'next'
import { createPublicClient, http, parseAbiItem, formatEther, defineChain } from 'viem'
import { monadTestnet, NATIVE_TOKEN_ADDRESS } from '@/config/chains'
import { contracts } from '@/config/contracts'

// Initialize Viem client
const client = createPublicClient({
  chain: defineChain(monadTestnet),
  transport: http(process.env.MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz'),
})

// Define event ABIs
const swapEventAbi = parseAbiItem('event Swap(address indexed sender, uint256 amount0In, uint256 amount1In, uint256 amount0Out, uint256 amount1Out, address indexed to, address indexed tokenIn, address indexed tokenOut)')
const swapETHEventAbi = parseAbiItem('event SwapETH(address indexed sender, uint256 ethAmount, uint256 tokenAmount, address indexed to, address indexed token, bool ethToToken)')

// Endpoint untuk fetching detail transaksi dan logs untuk debugging
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
    
    // Dapatkan semua logs, tidak hanya untuk kontrak tertentu
    // Ini bisa membantu kita melihat logs yang mungkin terlewat dan memahami format yang digunakan
    const allLogs = receipt.logs;
    
    // Coba decode semua logs untuk melihat pola
    const decodedLogs = [];
    
    for (const log of allLogs) {
      try {
        // Coba decode dengan beberapa signature umum
        // Untuk menyederhanakan, kita hanya mencoba 2 event yang dikenal
        const topics = log.topics.map(t => t?.toString());
        
        // Definisikan tipe yang dapat menerima nilai decoded
        interface DecodedLog {
          address: string;
          topics: (string | undefined)[];
          data: string;
          decoded: {
            event: string;
            args: any;
          } | null;
        }
        
        let decodedLog: DecodedLog = {
          address: log.address,
          topics,
          data: log.data,
          decoded: null
        };
        
        // Coba dengan Swap Event
        if (topics.length >= 3) {
          try {
            // Gunakan pendekatan alternatif tanpa decodeEventLog
            // Parse data secara manual - simplified approach
            decodedLog.decoded = {
              event: 'Swap',
              args: {
                _raw: {
                  data: log.data,
                  topics: topics.join(',')
                }
              }
            };
          } catch (e) {
            // Tidak bias di-decode dengan format ini
            console.log('Error decoding Swap event:', e);
          }
        }
        
        // Jika gagal, coba dengan SwapETH Event
        if (!decodedLog.decoded && topics.length >= 3) {
          try {
            // Gunakan pendekatan alternatif tanpa decodeEventLog
            // Parse data secara manual - simplified approach
            decodedLog.decoded = {
              event: 'SwapETH',
              args: {
                _raw: {
                  data: log.data,
                  topics: topics.join(',')
                }
              }
            };
          } catch (e) {
            // Tidak bias di-decode dengan format ini
            console.log('Error decoding SwapETH event:', e);
          }
        }
        
        decodedLogs.push(decodedLog);
      } catch (e) {
        console.error('Error decoding log:', e);
        decodedLogs.push({
          address: log.address,
          error: 'Failed to decode'
        });
      }
    }
    
    return res.status(200).json({
      success: true,
      transactionHash: txHash,
      blockNumber: receipt.blockNumber.toString(),
      contractInfo: {
        jikunaSwap: contracts.jikunaSwap.address,
        jikunaSwapETH: contracts.jikunaSwapETH.address,
      },
      transaction: serializeSafely(transaction),
      receipt: serializeSafely(receipt),
      logs: {
        total: allLogs.length,
        raw: serializeSafely(allLogs),
        decoded: decodedLogs
      }
    });
  } catch (error) {
    console.error('Error fetching transaction details:', error)
    return res.status(500).json({ 
      success: false, 
      message: 'Error fetching transaction details', 
      error: String(error) 
    })
  }
} 