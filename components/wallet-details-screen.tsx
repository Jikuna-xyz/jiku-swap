import { Clock } from "lucide-react"
import Header from "./header"

export default function WalletDetailsScreen() {
  return (
    <div className="flex flex-col h-screen pb-16" style={{ color: "white" }}>
      <Header title="JIKU.SWAP" />
      <div className="p-6 flex-1">
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-[#7e6dd1] flex items-center justify-center">
              <span className="text-white text-xs">W</span>
            </div>
            <span className="text-white text-sm">Wallet not connected</span>
            <div className="w-6 h-6 rounded-full bg-[#343b43] flex items-center justify-center">
              <Clock size={14} className="text-white" />
            </div>
          </div>
          <div className="text-white text-3xl font-bold">$0.00</div>
        </div>

        <div className="bg-[#343b43] rounded-lg p-4 mb-6">
          <p className="text-white text-sm">Connect your wallet to view your token balances and transaction history.</p>
        </div>

        <button className="w-full bg-[#c20000] text-white py-3 rounded-lg font-medium mb-4">Connect Wallet</button>

        <div className="text-center text-[#999da1] text-sm">No tokens found in your wallet</div>
      </div>
    </div>
  )
}
