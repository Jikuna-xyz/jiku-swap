# Jikuna Swap - Decentralized Exchange (DEX) on Monad Network

Jikuna Swap is a full-featured decentralized exchange (DEX) built on the Monad Testnet, featuring a modern user interface, token swapping capabilities, and a unique Jikuna Xtra Points (JXP) rewards system.

## Project Overview

Jikuna Swap is a monorepo containing:

1. **Frontend Application**: A Next.js-based DEX interface with token swapping, wallet connection, and DeFi features
2. **Backend Service**: A service for tracking swaps and managing the JXP rewards system 

## Technology Stack

### Frontend
- **Framework**: Next.js 15
- **UI**: React 19, TailwindCSS, Radix UI components
- **Wallet Integration**: Rainbow Kit, Wagmi, Viem
- **Blockchain Connection**: Farcaster Frame SDK for social interaction

### Backend
- **Framework**: Next.js API Routes
- **Database**: MongoDB
- **Blockchain Interaction**: Viem/Ethers.js
- **Scheduled Tasks**: Vercel Cron Jobs

### Smart Contracts
- JikunaSwap (Router ERC20-ERC20): `0x9906c1FbaD6262E72fC3aA1db42A89a3629f93EE`
- JikunaSwapETH (Router ERC20-MON): `0x0f36AF6f7EA2b7708D756991E1f13ec0Add23998`
- JikunaXtraPointsV2: `0x1b869CEaC99F779e881DbD1354a3582F8bca9Af3`
- WMON (Wrapped Monad): `0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701`

## Features

### DEX Trading Interface
- Token swapping with automated price calculation
- Support for native MON and ERC20 tokens
- Slippage control and transaction settings
- Real-time price updates and rate information
- Token selection with search functionality
- Mobile-responsive design

### Rewards System (JXP - Jikuna Xtra Points)
- Earn JXP rewards for swapping tokens on Jikuna Swap
- 1 JXP awarded per 10 MON volume traded
- Leaderboard tracking top traders
- Tiered rewards system based on JXP accumulated

### Farcaster Integration
- Social integration with Farcaster frames
- Share swaps and earning achievements

## Architecture

### Frontend Components
- **Swap Interface**: User-friendly swap screen with token selection, amount input, and transaction execution
- **Wallet Connection**: Integration with various wallets via Rainbow Kit
- **Token Management**: Token list, balances, and price information
- **Transaction Handling**: Gas estimation, price impact calculation, and slippage protection

### Backend Services
- **Event Monitoring**: Listens to swap events from the DEX smart contracts
- **JXP Calculation**: Calculates JXP rewards based on swap volume
- **Database Storage**: Stores swap events and JXP earnings
- **Scheduled Updates**: Periodically updates on-chain JXP balances
- **API Endpoints**: Provides information about JXP status, leaderboards, and user rewards

## Installation & Setup

### Prerequisites
- Node.js 18+
- Git
- Monad Testnet wallet with MON for transactions and gas

### Development Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/jikuna-swap.git
cd jikuna-swap
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Create environment configuration:
```bash
cp .env.example .env.local
```

4. Configure environment variables:
```
# Frontend
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_key
NEXT_PUBLIC_WALLET_CONNECT_ID=your_walletconnect_id

# Backend
MONGODB_URI=your_mongodb_connection_string
JXP_ADMIN_PRIVATE_KEY=private_key_for_jxp_updates
```

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

### Production Deployment

#### Frontend
1. Build the application:
```bash
npm run build
```

2. Deploy to Vercel:
```bash
vercel --prod
```

#### Backend
1. Deploy as a separate Vercel project:
```bash
cd backend
vercel --prod
```

2. Configure Vercel Cron Jobs for JXP updates:
```json
{
  "crons": [
    {
      "path": "/api/jxp/cron-sync",
      "schedule": "0 */4 * * *"
    }
  ]
}
```

## API Endpoints

### JXP Status
- `GET /api/jxp/status`: Get system status including JXP statistics
- `GET /api/jxp/leaderboard`: Get top JXP earners

### Admin Endpoints (Protected)
- `POST /api/jxp/admin/force-update`: Force JXP update to blockchain
- `POST /api/jxp/admin/reset-blocks`: Reset processed block range for resyncing

## Smart Contract Integration

### Token Swapping
The frontend interacts with two main router contracts:
- `JikunaSwap`: For ERC20-to-ERC20 token swaps
- `JikunaSwapETH`: For swaps involving the native MON token

### JXP Rewards
The backend tracks swap events and calculates JXP rewards based on:
1. Swap volume in MON equivalent
2. Reward rate (1 JXP per 10 MON volume)
3. Batch updates to the JikunaXtraPointsV2 contract

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Troubleshooting

### Common Issues
- **Transaction Failure**: Ensure sufficient gas and slippage tolerance
- **Token Not Found**: Check token contract address and network
- **JXP Not Updating**: JXP updates are batched and occur periodically

### Support
For issues or questions, please [open an issue](https://github.com/yourusername/jikuna-swap/issues) on GitHub.

## License

This project is licensed under the [MIT License](LICENSE). 