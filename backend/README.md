# Backend JXP Service untuk Jikuna Swap

Backend service untuk mengelola perhitungan dan pembaruan JXP (Jikuna Xtra Points) bagi DEX Jikuna di Monad Testnet.

## Fitur Utama

- Event listener untuk memantau event swap dari kontrak JikunaSwap
- Perhitungan JXP berdasarkan volume swap (1 JXP per 10 MON)
- Batch updater untuk mengirim update JXP ke kontrak JikunaXtraPointsV2
- API untuk monitoring dan operasi manual
- Otomatisasi dengan Vercel Cron Jobs

## Teknologi yang Digunakan

- Next.js API Routes
- MongoDB untuk database
- viem untuk interaksi blockchain
- TypeScript
- Vercel Cron

## Setup Lokal

1. Install dependencies:

```bash
npm install
```

2. Buat file `.env.local` dengan contoh dari `.env.example`:

```bash
cp .env.example .env.local
```

3. Edit `.env.local` dan isi dengan nilai yang sesuai:

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
UPDATE_INTERVAL_HOURS=6
FETCH_EVENTS_INTERVAL_HOURS=1

# Security
ADMIN_API_KEY=your_secure_api_key_for_admin_endpoints
CRON_SECRET=your_vercel_cron_secret
```

4. Jalankan server development:

```bash
npm run dev
```

## Struktur API

### API Publik

- `GET /api/jxp/status` - Mendapatkan status sistem dan statistik

### API Admin (Memerlukan API key)

- `POST /api/jxp/admin/manual-update` - Memicu pembaruan JXP ke blockchain secara manual
- `POST /api/jxp/admin/add-jxp` - Menambahkan JXP ke alamat tertentu

Contoh manual-update:
```bash
curl -X POST https://your-backend.vercel.app/api/jxp/admin/manual-update \
  -H "x-api-key: your_admin_api_key"
```

Contoh add-jxp:
```bash
curl -X POST https://your-backend.vercel.app/api/jxp/admin/add-jxp \
  -H "x-api-key: your_admin_api_key" \
  -H "Content-Type: application/json" \
  -d '{"address":"0x123...","amount":100}'
```

### API Cron (Dipanggil oleh Vercel Cron)

- `POST /api/jxp/events/fetch-swap-events` - Mengambil event swap baru (tiap jam)
- `POST /api/jxp/webhook` - Memproses JXP dan mengirim ke blockchain (tiap 6 jam)

## Deploy ke Vercel

1. Hubungkan repository ke Vercel
2. Set direktori root ke `/backend`
3. Tambahkan semua environment variable
4. Enable Vercel Cron Jobs

## Monitoring dan Debugging

Untuk memantau sistem:
- Cek endpoint `/api/jxp/status` untuk melihat status keseluruhan sistem
- Pantau logs di Vercel untuk setiap error
- Cek MongoDB collections untuk melihat data yang disimpan

## Keamanan

- Admin API dilindungi dengan API key
- Cron endpoints dilindungi dengan secret khusus
- Private key admin wallet disimpan secara aman di environment variables

## Pengembangan Lanjutan

- Tambahkan fitur caching untuk meningkatkan performa
- Implementasikan rate limiting untuk API
- Tambahkan lebih banyak validasi untuk data input
- Tingkatkan estimasi volume MON dengan oracle harga 