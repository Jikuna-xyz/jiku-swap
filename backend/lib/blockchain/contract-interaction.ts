import { createWalletClient, createPublicClient, http, parseAbi, defineChain } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { monadTestnet } from '@/config/chains'
import { contracts } from '@/config/contracts'
import { getAllPendingJXPUpdates, clearPendingJXP } from '@/lib/database/jxp-updates'
import JikunaXtraPointsV2ABI from '@/config/abis/JikunaXtraPointsV2.json'

// Ensure private key is available
if (!process.env.ADMIN_PRIVATE_KEY) {
  throw new Error('ADMIN_PRIVATE_KEY environment variable is not set')
}

// Create account from private key
const account = privateKeyToAccount(`0x${process.env.ADMIN_PRIVATE_KEY}`)

// Initialize Viem clients
const publicClient = createPublicClient({
  chain: defineChain(monadTestnet),
  transport: http(process.env.MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz'),
})

const walletClient = createWalletClient({
  account,
  chain: defineChain(monadTestnet),
  transport: http(process.env.MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz'),
})

// Parse ABI for the JXP contract
const jxpContractAbi = JikunaXtraPointsV2ABI

/**
 * Batch update JXP points on-chain
 */
export async function batchUpdateJXPOnChain(): Promise<{
  success: boolean;
  transactionHash?: string;
  userCount: number;
  totalJXP: number;
  error?: string;
}> {
  try {
    // Get all pending JXP updates
    const pendingUpdates = await getAllPendingJXPUpdates()
    
    if (pendingUpdates.length === 0) {
      return {
        success: true,
        userCount: 0,
        totalJXP: 0,
      }
    }
    
    // Prepare users and amounts arrays
    const users: string[] = []
    const amounts: bigint[] = []
    let totalJXP = 0
    
    for (const update of pendingUpdates) {
      users.push(update.user)
      amounts.push(BigInt(update.pendingJXP))
      totalJXP += update.pendingJXP
    }
    
    // Call the updatePoints function
    const { request } = await publicClient.simulateContract({
      address: contracts.jikunaXtraPointsV2.address as `0x${string}`,
      abi: jxpContractAbi,
      functionName: 'updatePoints',
      args: [users, amounts],
      account,
    })
    
    // Execute the transaction
    const hash = await walletClient.writeContract(request)
    
    // Wait for transaction confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash })
    
    // Clear pending JXP for these users if transaction was successful
    if (receipt.status === 'success') {
      await clearPendingJXP(users)
    } else {
      throw new Error('Transaction failed')
    }
    
    return {
      success: true,
      transactionHash: hash,
      userCount: users.length,
      totalJXP,
    }
  } catch (error) {
    console.error('Error updating JXP on-chain:', error)
    return {
      success: false,
      userCount: 0,
      totalJXP: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Manually add JXP for a specific user
 */
export async function manuallyAddJXP(
  userAddress: string, 
  amount: number
): Promise<{
  success: boolean;
  transactionHash?: string;
  error?: string;
}> {
  try {
    // Prepare arrays with just one user
    const users = [userAddress]
    const amounts = [BigInt(amount)]
    
    // Call the updatePoints function
    const { request } = await publicClient.simulateContract({
      address: contracts.jikunaXtraPointsV2.address as `0x${string}`,
      abi: jxpContractAbi,
      functionName: 'updatePoints',
      args: [users, amounts],
      account,
    })
    
    // Execute the transaction
    const hash = await walletClient.writeContract(request)
    
    // Wait for transaction confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash })
    
    return {
      success: receipt.status === 'success',
      transactionHash: hash,
    }
  } catch (error) {
    console.error('Error manually adding JXP:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
} 