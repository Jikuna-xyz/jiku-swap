"use client";

import { useState, useEffect } from 'react';
import { useJikunaFactory } from '@/hooks/useJikunaFactory';
import { PairInfo, MOCK_TOKENS, TOKEN_ADDRESSES } from '@/config/contracts';
import { formatUnits } from 'viem';

// Indeks token dalam MOCK_TOKENS
const MON_INDEX = 0;
const USDC_INDEX = 1;
const USDT_INDEX = 2;
const WMON_INDEX = 3;
const WETH_INDEX = 4;
const WBTC_INDEX = 5;

// Mock pair data untuk pengembangan
const MOCK_PAIRS: PairInfo[] = [
  {
    pairAddress: '0x1111111111111111111111111111111111111111',
    token0: MOCK_TOKENS[MON_INDEX],
    token1: MOCK_TOKENS[USDC_INDEX],
    reserves0: BigInt(100000000000000000000), // 100 MON
    reserves1: BigInt(150000000), // 150 USDC (6 desimal)
  },
  {
    pairAddress: '0x2222222222222222222222222222222222222222',
    token0: MOCK_TOKENS[MON_INDEX],
    token1: MOCK_TOKENS[WETH_INDEX],
    reserves0: BigInt(250000000000000000000), // 250 MON
    reserves1: BigInt(120000000000000000000), // 120 WETH
  },
  {
    pairAddress: '0x3333333333333333333333333333333333333333',
    token0: MOCK_TOKENS[USDC_INDEX],
    token1: MOCK_TOKENS[USDT_INDEX],
    reserves0: BigInt(500000000), // 500 USDC (6 desimal)
    reserves1: BigInt(500000000), // 500 USDT (6 desimal)
  },
  {
    pairAddress: '0x4444444444444444444444444444444444444444',
    token0: MOCK_TOKENS[WETH_INDEX],
    token1: MOCK_TOKENS[WBTC_INDEX],
    reserves0: BigInt(50000000000000000000), // 50 WETH
    reserves1: BigInt(250000000), // 2.5 WBTC (8 desimal)
  },
  {
    pairAddress: '0x5555555555555555555555555555555555555555',
    token0: MOCK_TOKENS[MON_INDEX],
    token1: MOCK_TOKENS[WMON_INDEX],
    reserves0: BigInt(1000000000000000000000), // 1000 MON
    reserves1: BigInt(1000000000000000000000), // 1000 WMON
  },
];

export function PairsList() {
  const { jikunaSwaps, isLoadingSwaps } = useJikunaFactory();
  const [pairs, setPairs] = useState<PairInfo[]>([]);
  const [sortField, setSortField] = useState<string>('liquidity');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    // Dalam aplikasi nyata, kita akan mengambil pairs dari kontrak
    // Untuk pengembangan, gunakan data mock
    setPairs(MOCK_PAIRS);
  }, [jikunaSwaps]);

  const handleSort = (field: string) => {
    // Jika field yang sama diklik, balik arah sorting
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Jika field berbeda, set ke field baru dengan arah descending
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Kalkulasi nilai TVL dalam USD (asumsi harga sederhana untuk demo)
  const calculateTVLInUSD = (pair: PairInfo): number => {
    // Asumsi harga untuk demo
    const prices = {
      MON: 0.5, // $0.5 per MON
      WMON: 0.5, // $0.5 per WMON
      USDC: 1.0, // $1 per USDC
      USDT: 1.0, // $1 per USDT
      WETH: 3000, // $3000 per WETH
      WBTC: 60000, // $60000 per WBTC
    };

    // Dekodekan reserve berdasarkan desimal token
    const reserve0InUnit = Number(formatUnits(pair.reserves0, pair.token0.decimals));
    const reserve1InUnit = Number(formatUnits(pair.reserves1, pair.token1.decimals));

    // Dapatkan harga token (gunakan simbol untuk mencari di objek prices)
    const price0 = prices[pair.token0.symbol as keyof typeof prices] || 0;
    const price1 = prices[pair.token1.symbol as keyof typeof prices] || 0;

    // Hitung nilai total dalam USD
    const value0InUSD = reserve0InUnit * price0;
    const value1InUSD = reserve1InUnit * price1;
    
    return value0InUSD + value1InUSD;
  };

  const sortedAndFilteredPairs = [...pairs]
    .filter((pair) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        pair.token0.symbol.toLowerCase().includes(term) ||
        pair.token1.symbol.toLowerCase().includes(term) ||
        pair.pairAddress.toLowerCase().includes(term)
      );
    })
    .sort((a, b) => {
      // Sorting berdasarkan field yang dipilih
      const direction = sortDirection === 'asc' ? 1 : -1;

      switch (sortField) {
        case 'token0':
          return direction * a.token0.symbol.localeCompare(b.token0.symbol);
        case 'token1':
          return direction * a.token1.symbol.localeCompare(b.token1.symbol);
        case 'liquidity':
          // Gunakan kalkulasi TVL untuk sorting likuiditas
          const tvlA = calculateTVLInUSD(a);
          const tvlB = calculateTVLInUSD(b);
          return direction * (tvlA - tvlB);
        default:
          return 0;
      }
    });

  const formatTVL = (pair: PairInfo): string => {
    const tvl = calculateTVLInUSD(pair);
    
    // Format TVL berdasarkan besarnya nilai
    if (tvl >= 1000000) {
      return `$${(tvl / 1000000).toFixed(2)}M`;
    } else if (tvl >= 1000) {
      return `$${(tvl / 1000).toFixed(2)}K`;
    } else {
      return `$${tvl.toFixed(2)}`;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-zinc-900 rounded-2xl shadow-lg">
      <h2 className="text-2xl font-bold text-white mb-6">Pasangan Token</h2>

      <div className="mb-6 flex gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Cari berdasarkan token atau alamat"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {isLoadingSwaps ? (
        <div className="flex justify-center p-8">
          <div className="text-white">Memuat pasangan token...</div>
        </div>
      ) : sortedAndFilteredPairs.length === 0 ? (
        <div className="bg-zinc-800 rounded-xl p-8 text-center text-zinc-400">
          Tidak ada pasangan token yang ditemukan.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-sm text-zinc-400 border-b border-zinc-800">
              <tr>
                <th 
                  className="px-4 py-3 cursor-pointer hover:text-zinc-200"
                  onClick={() => handleSort('token0')}
                >
                  Token A
                  {sortField === 'token0' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  className="px-4 py-3 cursor-pointer hover:text-zinc-200"
                  onClick={() => handleSort('token1')}
                >
                  Token B
                  {sortField === 'token1' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  className="px-4 py-3 cursor-pointer hover:text-zinc-200"
                  onClick={() => handleSort('liquidity')}
                >
                  Likuiditas
                  {sortField === 'liquidity' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th className="px-4 py-3">TVL</th>
                <th className="px-4 py-3">Alamat Pair</th>
              </tr>
            </thead>
            <tbody>
              {sortedAndFilteredPairs.map((pair) => (
                <tr 
                  key={pair.pairAddress} 
                  className="border-b border-zinc-800 text-white hover:bg-zinc-800"
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      {pair.token0.logoURI && (
                        <img 
                          src={pair.token0.logoURI} 
                          alt={pair.token0.symbol} 
                          className="w-6 h-6 rounded-full"
                        />
                      )}
                      <span>{pair.token0.symbol}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      {pair.token1.logoURI && (
                        <img 
                          src={pair.token1.logoURI} 
                          alt={pair.token1.symbol} 
                          className="w-6 h-6 rounded-full"
                        />
                      )}
                      <span>{pair.token1.symbol}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div>
                      <div>{formatUnits(pair.reserves0, pair.token0.decimals)} {pair.token0.symbol}</div>
                      <div>{formatUnits(pair.reserves1, pair.token1.decimals)} {pair.token1.symbol}</div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-green-400 font-medium">
                    {formatTVL(pair)}
                  </td>
                  <td className="px-4 py-4 text-zinc-400">
                    <a
                      href={`https://testnet.monadexplorer.com/address/${pair.pairAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-blue-400"
                    >
                      {`${pair.pairAddress.substring(0, 6)}...${pair.pairAddress.substring(38)}`}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 