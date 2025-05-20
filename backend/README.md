# Backend JXP Service for Jikuna Swap

Backend service for managing calculation and updates of JXP (Jikuna Xtra Points) for Jikuna DEX on Monad Testnet.

## Key Features

- Event listener to monitor swap events from JikunaSwap contract
- JXP calculation based on swap volume (1 JXP per 10 MON)
- Batch updater to send JXP updates to the JikunaXtraPointsV2 contract
- API for monitoring and manual operations
- Automation with Vercel Cron Jobs

## Technologies Used

- Next.js API Routes
- MongoDB for database storage
- viem for blockchain interactions
- TypeScript for type-safe development
- Vercel Cron for scheduled tasks

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env.local` file from the `.env.example` template:

```bash
cp .env.example .env.local
```

3. Edit `.env.local` and fill with appropriate values:

```
# Blockchain
ADMIN_PRIVATE_KEY=your_private_key_without_0x_prefix
MONAD_RPC_URL=https://testnet-rpc.monad.xyz
JXP_CONTRACT_ADDRESS=0x1b869CEaC99F779e881DbD1354a3582F8bca9Af3
JIKUNA_SWAP_ADDRESS=0x9906c1FbaD6262E72fC3aA1db42A89a3629f93EE
JIKUNA_SWAP_ETH_ADDRESS=0x0f36AF6f7EA2b7708D756991E1f13ec0Add23998

# Database
MONGODB_URI=your_mongodb_connection_string

# Service Config
UPDATE_INTERVAL_HOURS=6       # How often JXP is sent to blockchain
FETCH_EVENTS_INTERVAL_HOURS=1 # How often swap events are fetched

# Security
ADMIN_API_KEY=your_secure_api_key_for_admin_endpoints
CRON_SECRET=your_vercel_cron_secret
```

4. Run the development server:

```bash
npm run dev
```

## API Structure

### Public API

- `GET /api/jxp/status` - Get system status and statistics (no authentication required)

### Admin API (Requires API key)

- `POST /api/jxp/admin/manual-update` - Trigger JXP updates to blockchain manually
- `POST /api/jxp/admin/add-jxp` - Add JXP to a specific address

Example of manual update:
```bash
curl -X POST https://your-backend.vercel.app/api/jxp/admin/manual-update \
  -H "x-api-key: your_admin_api_key"
```

Example of adding JXP:
```bash
curl -X POST https://your-backend.vercel.app/api/jxp/admin/add-jxp \
  -H "x-api-key: your_admin_api_key" \
  -H "Content-Type: application/json" \
  -d '{"address":"0x123...","amount":100}'
```

### Cron API (Called by Vercel Cron)

- `POST /api/jxp/events/fetch-swap-events` - Fetch new swap events (runs hourly)
- `POST /api/jxp/webhook` - Process JXP and send to blockchain (runs every 6 hours)

## Deployment to Vercel

1. Connect your repository to Vercel
2. Set the root directory to `/backend`
3. Add all environment variables in the Vercel project settings
4. Enable Vercel Cron Jobs in the project settings

## Monitoring and Debugging

To monitor the system:
- Check the `/api/jxp/status` endpoint to view overall system status
- Monitor logs in Vercel dashboard for any errors
- Inspect MongoDB collections to view stored data and transaction history

## Security

- Admin API protected with API key authentication
- Cron endpoints protected with dedicated secret
- Admin wallet private key securely stored in environment variables
- All sensitive data is never exposed in client-side code

## Future Enhancements

- Add caching features to improve performance
- Implement rate limiting for APIs to prevent abuse
- Add more comprehensive input data validation
- Improve MON volume estimation with price oracles
- Add more detailed analytics and reporting features 