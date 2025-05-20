# Jikuna Swap Monorepo

Repositori monorepo untuk Jikuna Swap di Monad Testnet, terdiri dari frontend aplikasi DEX dan backend service JXP (Jikuna Xtra Points).

## Struktur Project

```
/
├── frontend/        # Frontend aplikasi DEX
│   └── ...
│
├── backend/         # Backend service untuk JXP
│   ├── pages/       # Next.js API routes
│   ├── lib/         # Logika inti backend
│   ├── config/      # File konfigurasi
│   └── ...
│
└── package.json     # Root package.json
```

## Backend Service JXP

Backend service mendengarkan event swap dari kontrak DEX, menghitung JXP berdasarkan volume swap, dan mengupdate ke kontrak JikunaXtraPointsV2.

### Fitur Utama Backend

- Event listener untuk memantau event swap
- Perhitungan JXP (1 JXP per 10 MON volume)
- Batch updater untuk mengirim update JXP ke blockchain
- API untuk monitoring dan operasi manual
- Otomatisasi dengan Vercel Cron Jobs

Lihat [Backend README](./backend/README.md) untuk detail lengkap.

## Frontend Aplikasi DEX

Frontend aplikasi Jikuna Swap yang menyediakan antarmuka untuk DEX.

## Setup Development

### Setup Awal

1. Clone repository:

```bash
git clone https://github.com/yourusername/jikuna-swap.git
cd jikuna-swap
```

2. Install dependencies:

```bash
npm install
```

3. Setup backend environment:

```bash
cd backend
cp .env.example .env.local
# Edit .env.local dengan nilai yang sesuai
cd ..
```

### Development Mode

Jalankan frontend dan backend secara terpisah:

```bash
# Hanya frontend
npm run dev:frontend

# Hanya backend
npm run dev:backend
```

Atau jalankan keduanya secara bersamaan:

```bash
npm run dev
```

### Build

```bash
npm run build:frontend
npm run build:backend
# Atau build keduanya sekaligus
npm run build
```

## Deploy ke Vercel

### Backend

1. Buat project baru di Vercel
2. Hubungkan dengan repository
3. Set direktori root ke `/backend`
4. Tambahkan semua environment variable yang diperlukan
5. Enable Vercel Cron Jobs

### Frontend

1. Buat project baru lain di Vercel 
2. Hubungkan dengan repository yang sama
3. Set direktori root ke `/frontend`
4. Tambahkan environment variable yang diperlukan untuk frontend

## Kontrak dan Alamat yang Digunakan

- JikunaSwap (Router ERC20-ERC20): `0x9906c1FbaD6262E72fC3aA1db42A89a3629f93EE`
- JikunaSwapETH (Router ERC20-MON): `0x0f36AF6f7EA2b7708D756991E1f13ec0Add23998`
- JikunaXtraPointsV2: `0x1b869CEaC99F779e881DbD1354a3582F8bca9Af3`
- Admin Wallet: `0x3E5350732810d539541d5e36DCB9777816E8c934`

## Lisensi

[LISENSI yang sesuai] 