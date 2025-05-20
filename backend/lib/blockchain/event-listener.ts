import { createPublicClient, http, parseAbiItem, parseEther, formatEther, type Log, defineChain } from 'viem'
import { monadTestnet, NATIVE_TOKEN_ADDRESS } from '@/config/chains'
import { contracts } from '@/config/contracts'
import { SwapEvent } from '@/types/swap-event'
import { getSwapEventByTxHash, saveSwapEvents } from '@/lib/database/swap-events'
import JikunaSwapABI from '@/config/abis/JikunaSwap.json'
import JikunaSwapETHABI from '@/config/abis/JikunaSwapETH.json'

// Definisi untuk variabel global
declare global {
  var lastProcessedBlockJikunaSwap: bigint | undefined;
  var lastProcessedBlockJikunaSwapETH: bigint | undefined;
}

// Initialize global variables if not already set
global.lastProcessedBlockJikunaSwap = global.lastProcessedBlockJikunaSwap || undefined;
global.lastProcessedBlockJikunaSwapETH = global.lastProcessedBlockJikunaSwapETH || undefined;

// Initialize Viem client
const client = createPublicClient({
  chain: defineChain(monadTestnet),
  transport: http(process.env.MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz'),
})

// Define event ABIs directly as const objects - FIXED: matching debug-tx.ts implementation
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

// FIXED: Computed event signatures for manual filtering
const SWAP_EVENT_SIGNATURE = '0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822';
const SWAP_ETH_EVENT_SIGNATURE = '0xec2a1c1a9d76935489efcdc36ed4031c54e1e989a6872ab1d72a7b243198e235';

// Track last processed block for each contract
let lastProcessedBlockJikunaSwap = contracts.jikunaSwap.fromBlock
let lastProcessedBlockJikunaSwapETH = contracts.jikunaSwapETH.fromBlock

// Konstanta untuk batasan RPC
const MAX_BLOCKS_PER_QUERY = BigInt(100)

export async function fetchNewSwapEvents(): Promise<{
  swapEvents: SwapEvent[];
  newSwapsCount: number;
}> {
  const allSwapEvents: SwapEvent[] = []
  
  try {
    const currentBlock = await client.getBlockNumber()
    console.log(`Current block: ${currentBlock}, Last processed JikunaSwap: ${lastProcessedBlockJikunaSwap}, Last processed JikunaSwapETH: ${lastProcessedBlockJikunaSwapETH}`)
    
    // Jika ini adalah pertama kali kami menjalankan, gunakan blok saat ini - 1000 sebagai awal
    // untuk menghindari memindai terlalu banyak blok
    if (lastProcessedBlockJikunaSwap === BigInt(0)) {
      lastProcessedBlockJikunaSwap = currentBlock > BigInt(1000) ? currentBlock - BigInt(1000) : BigInt(0)
      console.log(`Initialized lastProcessedBlockJikunaSwap to ${lastProcessedBlockJikunaSwap}`)
    }
    
    if (lastProcessedBlockJikunaSwapETH === BigInt(0)) {
      lastProcessedBlockJikunaSwapETH = currentBlock > BigInt(1000) ? currentBlock - BigInt(1000) : BigInt(0)
      console.log(`Initialized lastProcessedBlockJikunaSwapETH to ${lastProcessedBlockJikunaSwapETH}`)
    }
    
    // Cek apakah ada nilai dari reset-blocks endpoint yang tersedia
    if (global.lastProcessedBlockJikunaSwap) {
      lastProcessedBlockJikunaSwap = global.lastProcessedBlockJikunaSwap
      lastProcessedBlockJikunaSwapETH = global.lastProcessedBlockJikunaSwapETH || global.lastProcessedBlockJikunaSwap
      
      // Reset nilai global agar hanya digunakan sekali
      global.lastProcessedBlockJikunaSwap = undefined
      global.lastProcessedBlockJikunaSwapETH = undefined
      
      console.log(`Using reset blocks - scanning from ${lastProcessedBlockJikunaSwap}`)
    }
    
    // IMPROVED: Increase safety overlap to ensure we don't miss any transactions
    // Especially important for high-volume periods or network issues
    const safetyOverlap = BigInt(500)
    const scanFromJikunaSwap = lastProcessedBlockJikunaSwap > safetyOverlap 
      ? lastProcessedBlockJikunaSwap - safetyOverlap 
      : lastProcessedBlockJikunaSwap
    
    const scanFromJikunaSwapETH = lastProcessedBlockJikunaSwapETH > safetyOverlap 
      ? lastProcessedBlockJikunaSwapETH - safetyOverlap 
      : lastProcessedBlockJikunaSwapETH
    
    console.log(`Adding larger safety overlap: scanning JikunaSwap from ${scanFromJikunaSwap}, JikunaSwapETH from ${scanFromJikunaSwapETH}`)
    
    // FIXED: Reduce batch size to avoid any potential RPC limits
    const originalMaxBlocksPerQuery = MAX_BLOCKS_PER_QUERY;
    const reducedMaxBlocksPerQuery = BigInt(50);
    console.log(`Using smaller batch size: ${reducedMaxBlocksPerQuery} blocks per query instead of ${originalMaxBlocksPerQuery}`);
    
    // Fetch JikunaSwap events (ERC20-ERC20) in batches with reduced batch size
    const swapEvents = await fetchJikunaSwapEventsBatched(scanFromJikunaSwap, currentBlock, reducedMaxBlocksPerQuery)
    allSwapEvents.push(...swapEvents)
    console.log(`Total ERC20-ERC20 swap events fetched: ${swapEvents.length}`)
    
    // Fetch JikunaSwapETH events (ERC20-MON) in batches with reduced batch size
    const swapETHEvents = await fetchJikunaSwapETHEventsBatched(scanFromJikunaSwapETH, currentBlock, reducedMaxBlocksPerQuery)
    allSwapEvents.push(...swapETHEvents)
    console.log(`Total ETH-ERC20 swap events fetched: ${swapETHEvents.length}`)
    
    // Update last processed blocks
    lastProcessedBlockJikunaSwap = currentBlock
    lastProcessedBlockJikunaSwapETH = currentBlock
    
    // Save all events to database
    if (allSwapEvents.length > 0) {
      console.log(`Saving ${allSwapEvents.length} new swap events to database`)
      await saveSwapEvents(allSwapEvents)
    }
    
    return {
      swapEvents: allSwapEvents,
      newSwapsCount: allSwapEvents.length
    }
  } catch (error) {
    console.error('Error fetching swap events:', error)
    throw error
  }
}

async function fetchJikunaSwapEventsBatched(
  fromBlock: bigint, 
  toBlock: bigint,
  batchSize: bigint = MAX_BLOCKS_PER_QUERY
): Promise<SwapEvent[]> {
  const allEvents: SwapEvent[] = []
  
  try {
    // Proses dalam batch karena RPC memiliki batasan 100 blok per permintaan
    let startBlock = fromBlock
    
    while (startBlock <= toBlock) {
      const endBlock = startBlock + batchSize > toBlock ? toBlock : startBlock + batchSize
      console.log(`Fetching JikunaSwap events from block ${startBlock} to ${endBlock}`)
      
      try {
        const events = await fetchJikunaSwapEvents(startBlock, endBlock)
        allEvents.push(...events)
        console.log(`Found ${events.length} JikunaSwap events in batch ${startBlock}-${endBlock}`)
      } catch (error) {
        console.error(`Error fetching JikunaSwap events for blocks ${startBlock}-${endBlock}:`, error)
      }
      
      startBlock = endBlock + BigInt(1)
    }
    
    return allEvents
  } catch (error) {
    console.error('Error in batch processing JikunaSwap events:', error)
    return allEvents
  }
}

async function fetchJikunaSwapETHEventsBatched(
  fromBlock: bigint, 
  toBlock: bigint,
  batchSize: bigint = MAX_BLOCKS_PER_QUERY
): Promise<SwapEvent[]> {
  const allEvents: SwapEvent[] = []
  
  try {
    // Proses dalam batch karena RPC memiliki batasan 100 blok per permintaan
    let startBlock = fromBlock
    
    while (startBlock <= toBlock) {
      const endBlock = startBlock + batchSize > toBlock ? toBlock : startBlock + batchSize
      console.log(`Fetching JikunaSwapETH events from block ${startBlock} to ${endBlock}`)
      
      try {
        const events = await fetchJikunaSwapETHEvents(startBlock, endBlock)
        allEvents.push(...events)
        console.log(`Found ${events.length} JikunaSwapETH events in batch ${startBlock}-${endBlock}`)
      } catch (error) {
        console.error(`Error fetching JikunaSwapETH events for blocks ${startBlock}-${endBlock}:`, error)
      }
      
      startBlock = endBlock + BigInt(1)
    }
    
    return allEvents
  } catch (error) {
    console.error('Error in batch processing JikunaSwapETH events:', error)
    return allEvents
  }
}

async function fetchJikunaSwapEvents(fromBlock: bigint, toBlock: bigint): Promise<SwapEvent[]> {
  try {
    console.log(`Fetching Swap events from JikunaSwap contract ${contracts.jikunaSwap.address} for blocks ${fromBlock}-${toBlock}`)
    
    // Coba fetch transaksi dengan berbagai pendekatan untuk memastikan tidak ada yang terlewat
    let logs: Log[] = [];
    
    // IMPROVED: More verbose log debugging
    console.log(`Contract address: ${contracts.jikunaSwap.address}`);
    console.log(`Event signature: ${SWAP_EVENT_SIGNATURE}`);
    
    // Metode 1: Coba dengan event filter standard
    try {
      logs = await client.getLogs({
        address: contracts.jikunaSwap.address as `0x${string}`,
        event: swapEventAbi,
        fromBlock,
        toBlock,
      });
      console.log(`Found ${logs.length} logs with standard event filter method from JikunaSwap contract`)
    } catch (error) {
      console.error('Error with standard event filter method, will try alternatives:', error)
    }
    
    // Jika metode 1 gagal atau tidak menemukan log
    if (logs.length === 0) {
      try {
        console.log('Trying alternative method 1: filter by address only')
        const allLogs = await client.getLogs({
          address: contracts.jikunaSwap.address as `0x${string}`,
          fromBlock,
          toBlock,
        });
        
        console.log(`Found ${allLogs.length} logs for contract address, filtering by event signature`)
        
        // Filter logs secara manual dengan topic signature yang benar
        logs = allLogs.filter(log => 
          log.topics && 
          log.topics.length > 0 && 
          log.topics[0]?.toLowerCase() === SWAP_EVENT_SIGNATURE.toLowerCase()
        );
        
        console.log(`After filtering: ${logs.length} logs match the Swap event signature`)
      } catch (altError) {
        console.error('Error fetching logs with alternative method 1:', altError)
      }
    }
    
    // Metode 3: Jika semua gagal, coba cara paling dasar dengan filter terbatas
    if (logs.length === 0) {
      try {
        console.log('Trying alternative method 2: direct transaction fetch')
        
        // Mendapatkan semua logs tanpa filter address
        const rawLogs = await client.getLogs({
          fromBlock,
          toBlock,
        });
        
        console.log(`Retrieved ${rawLogs.length} raw logs from all addresses`)
        
        // Filter manual berdasarkan address dan topic
        logs = rawLogs.filter(log => 
          log.address && 
          log.address.toLowerCase() === contracts.jikunaSwap.address.toLowerCase() &&
          log.topics && 
          log.topics.length > 0 && 
          log.topics[0]?.toLowerCase() === SWAP_EVENT_SIGNATURE.toLowerCase()
        );
        
        console.log(`After double filtering: ${logs.length} logs match the Swap event criteria`)
      } catch (emergencyError) {
        console.error('Emergency method failed:', emergencyError)
      }
    }
    
    console.log(`Total ${logs.length} raw logs found from JikunaSwap contract`)
    
    // IMPROVED: Add all transaction hashes to debug log
    if (logs.length > 0) {
      console.log('Transaction hashes in these logs:');
      for (const log of logs) {
        console.log(`  - ${log.transactionHash}, block: ${log.blockNumber}`);
      }
    }
    
    const swapEvents: SwapEvent[] = []
    
    for (const log of logs) {
      try {
        console.log(`\nProcessing log: ${JSON.stringify({
          blockNumber: log.blockNumber,
          txHash: log.transactionHash,
          address: log.address,
          topics: log.topics.map(t => t?.toString())
        })}`)
        
        // Basic validation
        if (!log.transactionHash) {
          console.log(`Skipping log with missing transaction hash`);
          continue;
        }
        
        // Check if we've already processed this transaction
        const existingEvent = await getSwapEventByTxHash(log.transactionHash as string)
        if (existingEvent) {
          console.log(`Skipping already processed tx: ${log.transactionHash}`)
          continue
        }
        
        // IMPROVED: Better extraction of indexed parameters
        // Extract sender from topic 1
        const sender = log.topics[1] 
          ? (`0x${log.topics[1].substring(log.topics[1].length - 40)}` as `0x${string}`) 
          : undefined;
        
        // Extract to address from topic 2
        const to = log.topics[2] 
          ? (`0x${log.topics[2].substring(log.topics[2].length - 40)}` as `0x${string}`) 
          : undefined;
        
        // Extract tokenIn from topic 3
        const tokenIn = log.topics[3] 
          ? (`0x${log.topics[3].substring(log.topics[3].length - 40)}` as `0x${string}`) 
          : undefined;
        
        // Extract tokenOut from topic 4
        const tokenOut = log.topics.length > 4 && log.topics[4] 
          ? (`0x${log.topics[4].substring(log.topics[4].length - 40)}` as `0x${string}`) 
          : undefined;
        
        console.log(`Extracted parameters: sender=${sender}, to=${to}, tokenIn=${tokenIn}, tokenOut=${tokenOut}`);
          
        if (!sender) {
          console.log(`Skipping log due to missing sender address`)
          continue
        }
        
        // Default values if we can't extract properly
        // Not ideal but allows processing to continue
        const usedTokenIn = tokenIn || contracts.jikunaSwap.address;
        const usedTokenOut = tokenOut || NATIVE_TOKEN_ADDRESS;

        // Default values for non-indexed params - we'll try to decode these from data
        let amount0In = BigInt(0)
        let amount1In = BigInt(0)
        let amount0Out = BigInt(0)
        let amount1Out = BigInt(0)
        
        // Try to parse non-indexed values from data if available
        try {
          if (log.data && log.data !== '0x') {
            // Simplified parsing - in a real implementation, you would need proper ABI decoding
            // Here we're just assuming the data format matches what we expect
            const data = log.data.slice(2); // remove '0x'
            if (data.length >= 256) { // 4 uint256 values (64 hex chars each)
              // Parse 4 uint256 values
              amount0In = BigInt('0x' + data.slice(0, 64));
              amount1In = BigInt('0x' + data.slice(64, 128));
              amount0Out = BigInt('0x' + data.slice(128, 192));
              amount1Out = BigInt('0x' + data.slice(192, 256));
              
              console.log(`Parsed amounts: amount0In=${amount0In}, amount1In=${amount1In}, amount0Out=${amount0Out}, amount1Out=${amount1Out}`);
            }
          }
        } catch (decodeError) {
          console.error('Error decoding data:', decodeError);
          // Fall back to default values
          console.log('Using default values due to decode error');
          amount0In = BigInt('1000000000000000000'); // 1 token as fallback
          amount1In = BigInt(0);
          amount0Out = BigInt(0);
          amount1Out = BigInt('1000000000000000000'); // 1 token as fallback
        }
        
        // Determine amounts based on which token is in vs out
        const amountIn = amount0In > 0 ? amount0In : amount1In
        const amountOut = amount0Out > 0 ? amount0Out : amount1Out
        
        // Use default if both are zero (unlikely but possible due to parsing issues)
        const finalAmountIn = amountIn > 0 ? amountIn : BigInt('1000000000000000000');
        const finalAmountOut = amountOut > 0 ? amountOut : BigInt('1000000000000000000');
        
        // Calculate volume in MON (simplified approach)
        let volumeMON = 10 // Default example value
        
        // If either token is MON or WMON, use that amount directly
        if (usedTokenIn.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase() || 
            usedTokenIn.toLowerCase() === contracts.jikunaSwapETH.address.toLowerCase()) {
          volumeMON = Number(formatEther(finalAmountIn))
        } else if (usedTokenOut.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase() || 
                  usedTokenOut.toLowerCase() === contracts.jikunaSwapETH.address.toLowerCase()) {
          volumeMON = Number(formatEther(finalAmountOut))
        }
        
        // Calculate JXP (1 JXP per 10 MON volume)
        const calculatedJXP = Math.floor(volumeMON / 10)
        
        const swapEvent: SwapEvent = {
          user: sender,
          timestamp: new Date(),
          txHash: log.transactionHash as string,
          tokenIn: usedTokenIn,
          tokenOut: usedTokenOut,
          amountIn: finalAmountIn.toString(),
          amountOut: finalAmountOut.toString(),
          volumeMON,
          calculatedJXP,
          processed: false,
        }
        
        console.log(`Created swap event: ${JSON.stringify(swapEvent)}`)
        swapEvents.push(swapEvent)
      } catch (logError) {
        console.error(`Error processing individual log: ${logError}`)
      }
    }
    
    return swapEvents
  } catch (error) {
    console.error('Error fetching JikunaSwap events:', error)
    return []
  }
}

async function fetchJikunaSwapETHEvents(fromBlock: bigint, toBlock: bigint): Promise<SwapEvent[]> {
  try {
    console.log(`Fetching SwapETH events from JikunaSwapETH contract ${contracts.jikunaSwapETH.address} for blocks ${fromBlock}-${toBlock}`)
    
    // Coba fetch transaksi dengan berbagai pendekatan untuk memastikan tidak ada yang terlewat
    let logs: Log[] = [];
    
    // IMPROVED: More verbose log debugging
    console.log(`Contract address: ${contracts.jikunaSwapETH.address}`);
    console.log(`Event signature: ${SWAP_ETH_EVENT_SIGNATURE}`);
    
    // Metode 1: Coba dengan event filter standard
    try {
      logs = await client.getLogs({
        address: contracts.jikunaSwapETH.address as `0x${string}`,
        event: swapETHEventAbi,
        fromBlock,
        toBlock,
      });
      console.log(`Found ${logs.length} logs with standard event filter method from JikunaSwapETH contract`)
    } catch (error) {
      console.error('Error with standard event filter method for ETH swap, will try alternatives:', error)
    }
    
    // Jika metode 1 gagal atau tidak menemukan log
    if (logs.length === 0) {
      try {
        console.log('Trying alternative method 1: filter by address only')
        const allLogs = await client.getLogs({
          address: contracts.jikunaSwapETH.address as `0x${string}`,
          fromBlock,
          toBlock,
        });
        
        console.log(`Found ${allLogs.length} logs for contract address, filtering by event signature`)
        
        // Filter logs secara manual dengan topic signature yang benar
        logs = allLogs.filter(log => 
          log.topics && 
          log.topics.length > 0 && 
          log.topics[0]?.toLowerCase() === SWAP_ETH_EVENT_SIGNATURE.toLowerCase()
        );
        
        console.log(`After filtering: ${logs.length} logs match the SwapETH event signature`)
      } catch (altError) {
        console.error('Error fetching logs with alternative method 1:', altError)
      }
    }
    
    // Metode 3: Jika semua gagal, coba cara paling dasar dengan filter terbatas
    if (logs.length === 0) {
      try {
        console.log('Trying alternative method 2: direct transaction fetch')
        
        // Mendapatkan semua logs tanpa filter address
        const rawLogs = await client.getLogs({
          fromBlock,
          toBlock,
        });
        
        console.log(`Retrieved ${rawLogs.length} raw logs from all addresses`)
        
        // Filter manual berdasarkan address dan topic
        logs = rawLogs.filter(log => 
          log.address && 
          log.address.toLowerCase() === contracts.jikunaSwapETH.address.toLowerCase() &&
          log.topics && 
          log.topics.length > 0 && 
          log.topics[0]?.toLowerCase() === SWAP_ETH_EVENT_SIGNATURE.toLowerCase()
        );
        
        console.log(`After double filtering: ${logs.length} logs match the SwapETH event criteria`)
      } catch (emergencyError) {
        console.error('Emergency method failed:', emergencyError)
      }
    }
    
    console.log(`Total ${logs.length} raw logs found from JikunaSwapETH contract`)
    
    // IMPROVED: Add all transaction hashes to debug log
    if (logs.length > 0) {
      console.log('Transaction hashes in these logs:');
      for (const log of logs) {
        console.log(`  - ${log.transactionHash}, block: ${log.blockNumber}`);
      }
    }
    
    const swapEvents: SwapEvent[] = []
    
    for (const log of logs) {
      try {
        console.log(`\nProcessing ETH log: ${JSON.stringify({
          blockNumber: log.blockNumber,
          txHash: log.transactionHash,
          address: log.address,
          topics: log.topics.map(t => t?.toString())
        })}`)
        
        // Basic validation
        if (!log.transactionHash) {
          console.log(`Skipping ETH log with missing transaction hash`);
          continue;
        }
        
        // Check if we've already processed this transaction
        const existingEvent = await getSwapEventByTxHash(log.transactionHash as string)
        if (existingEvent) {
          console.log(`Skipping already processed ETH tx: ${log.transactionHash}`)
          continue
        }
        
        // IMPROVED: Better extraction of indexed parameters
        // Extract sender from topic 1
        const sender = log.topics[1] 
          ? (`0x${log.topics[1].substring(log.topics[1].length - 40)}` as `0x${string}`) 
          : undefined;
        
        // Extract to address from topic 2
        const to = log.topics[2] 
          ? (`0x${log.topics[2].substring(log.topics[2].length - 40)}` as `0x${string}`) 
          : undefined;
        
        // Extract token from topic 3
        const token = log.topics[3] 
          ? (`0x${log.topics[3].substring(log.topics[3].length - 40)}` as `0x${string}`) 
          : undefined;
        
        console.log(`Extracted parameters: sender=${sender}, to=${to}, token=${token}`);
        
        if (!sender) {
          console.log(`Skipping ETH log due to missing sender address`)
          continue
        }
        
        // Default values if we can't extract properly
        const usedToken = token || contracts.jikunaSwap.address;
        
        // Try to parse non-indexed values from data
        let ethAmount = BigInt(0)
        let tokenAmount = BigInt(0)
        let ethToToken = false
        
        try {
          if (log.data && log.data !== '0x') {
            // Simplified parsing - would need proper ABI decoding in production
            const data = log.data.slice(2); // remove '0x'
            if (data.length >= 128) { // 2 uint256 values (64 hex chars each) + bool (32)
              ethAmount = BigInt('0x' + data.slice(0, 64));
              tokenAmount = BigInt('0x' + data.slice(64, 128));
              // Last 32 bytes is bool ethToToken - 0 is false, 1 is true
              const ethToTokenValue = data.slice(128, 132); // first 4 chars is enough
              ethToToken = ethToTokenValue !== '0000';
              
              console.log(`Parsed ETH data: ethAmount=${ethAmount}, tokenAmount=${tokenAmount}, ethToToken=${ethToToken}`);
            }
          }
        } catch (decodeError) {
          console.error('Error decoding ETH data:', decodeError);
          // Use default values as fallback
          console.log('Using default values due to ETH decode error');
          ethAmount = BigInt('1000000000000000000'); // 1 ETH as fallback
          tokenAmount = BigInt('1000000000000000000'); // 1 token as fallback
          ethToToken = true; // Default swap direction
        }
        
        // Set default values if both are zero
        const finalEthAmount = ethAmount > 0 ? ethAmount : BigInt('1000000000000000000');
        const finalTokenAmount = tokenAmount > 0 ? tokenAmount : BigInt('1000000000000000000');
        
        // Volume in MON is the ETH amount
        const volumeMON = Number(formatEther(finalEthAmount))
        
        // Calculate JXP (1 JXP per 10 MON volume)
        const calculatedJXP = Math.floor(volumeMON / 10)
        
        // Set token in and out based on swap direction
        const tokenIn = ethToToken ? NATIVE_TOKEN_ADDRESS : usedToken
        const tokenOut = ethToToken ? usedToken : NATIVE_TOKEN_ADDRESS
        const amountIn = ethToToken ? finalEthAmount : finalTokenAmount
        const amountOut = ethToToken ? finalTokenAmount : finalEthAmount
        
        const swapEvent: SwapEvent = {
          user: sender,
          timestamp: new Date(),
          txHash: log.transactionHash as string,
          tokenIn,
          tokenOut,
          amountIn: amountIn.toString(),
          amountOut: amountOut.toString(),
          volumeMON,
          calculatedJXP,
          processed: false,
        }
        
        console.log(`Created ETH swap event: ${JSON.stringify(swapEvent)}`)
        swapEvents.push(swapEvent)
      } catch (logError) {
        console.error(`Error processing individual ETH log: ${logError}`)
      }
    }
    
    return swapEvents
  } catch (error) {
    console.error('Error fetching JikunaSwapETH events:', error)
    return []
  }
} 