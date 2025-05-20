# Langkah-langkah Reorganisasi Projekt Jikuna Swap

Berikut adalah langkah-langkah untuk mereorganisasi project Jikuna Swap menjadi struktur monorepo:

## 1. Backup Project

```bash
# Buat salinan cadangan project saat ini
cp -r D:/user/jiku-swap D:/user/jiku-swap-backup
```

## 2. Pindahkan Frontend yang Sudah Ada

```bash
# Pindahkan semua file frontend ke folder frontend/
cd D:/user/jiku-swap
mv .next app abis components config hooks lib public styles utils *.json *.ts *.md frontend/

# Kecualikan package.root.json yang baru dibuat
mv frontend/package.root.json ./package.json
```

## 3. Update Package.json Frontend

Update `frontend/package.json` untuk menambahkan nama yang sesuai:

```json
{
  "name": "jikuna-swap-frontend",
  // Sisanya tetap sama
}
```

## 4. Install Dependencies Backend

```bash
# Masuk ke folder backend
cd D:/user/jiku-swap/backend

# Install dependencies
npm install
```

## 5. Setup Environment Variables

```bash
# Copy file contoh .env ke .env.local
cd D:/user/jiku-swap/backend
cp .env.example .env.local

# Edit file .env.local dan isi nilai-nilai yang diperlukan
```

Contoh isi `.env.local`:
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

## 6. Install Dependencies Root dan Setup Monorepo

```bash
# Di root project
cd D:/user/jiku-swap

# Install concurrently untuk menjalankan frontend dan backend bersamaan
npm install --save-dev concurrently
```

## 7. Test Frontend dan Backend

```bash
# Jalankan frontend saja
npm run dev:frontend

# Jalankan backend saja
npm run dev:backend

# Atau jalankan keduanya bersamaan
npm run dev
```

## 8. Deploy ke Vercel

### Setup Backend

1. Buat project baru di Vercel
2. Hubungkan dengan repository
3. Set direktori root ke `/backend`
4. Tambahkan semua environment variable yang diperlukan
5. Enable Vercel Cron Jobs

### Setup Frontend

1. Buat project baru lain di Vercel
2. Hubungkan dengan repository yang sama
3. Set direktori root ke `/frontend`
4. Tambahkan environment variable yang diperlukan untuk frontend

## 9. Setup MongoDB

1. Buat cluster MongoDB Atlas
2. Buat database `jikuna-jxp`
3. Buat collections: `swapEvents`, `jxpUpdates`, dan `systemStats`
4. Tambahkan alamat IP Vercel ke whitelist
5. Buat user database dan dapatkan connection string
6. Perbarui MONGODB_URI di environment variables Vercel

## 10. Monitoring

Setelah setup selesai, pantau endpoint status:
- `GET /api/jxp/status` - menampilkan status sistem dan update terbaru

Dan gunakan endpoint admin untuk operasi manual:
- `POST /api/jxp/admin/manual-update` - memicu update JXP
- `POST /api/jxp/admin/add-jxp` - menambahkan JXP ke alamat tertentu 