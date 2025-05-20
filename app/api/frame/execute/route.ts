import { NextRequest, NextResponse } from 'next/server';
import { validateFrameMessage } from 'frames.js';

// Simulasi database untuk menyimpan state transaksi berdasarkan FID
// Dalam produksi sebenarnya, ini akan disimpan di database
const transactionStore: Record<string, {
  status: 'pending' | 'success' | 'failed';
  txHash?: string;
  fromToken: string;
  toToken: string;
  amount: string;
  timestamp: number;
}> = {};

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Mendapatkan dan memvalidasi pesan frame
    const body = await req.json();
    
    // Validasi message menggunakan frames.js
    const result = await validateFrameMessage(body);
    
    if (!result.isValid || !result.message) {
      return NextResponse.json(
        { error: 'Invalid frame message' },
        { status: 400 }
      );
    }

    // Mendapatkan data dari message state
    // Menggunakan type any untuk menghindari error tipe
    const message = result.message as any;
    const fidString = message.requesterFid?.toString() || '';
    let state;
    
    try {
      state = message.state ? JSON.parse(message.state) : {};
    } catch (e) {
      state = {};
    }
    
    const { fromToken, toToken, amount } = state;

    if (!fromToken || !toToken || !amount) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Simulasi proses swap
    // Dalam implementasi nyata, Anda akan memanggil kontrak di sini
    
    // Simpan state transaksi
    const txHash = `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`;
    transactionStore[fidString] = {
      status: 'success',
      txHash,
      fromToken,
      toToken,
      amount,
      timestamp: Date.now()
    };

    // Return response
    return NextResponse.json({
      success: true,
      transaction: {
        status: 'success',
        txHash,
        fromToken,
        toToken,
        amount
      }
    });
  } catch (error) {
    console.error('Error executing frame swap:', error);
    
    return NextResponse.json(
      { error: 'Failed to execute swap' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const fid = searchParams.get('fid');
    
    if (!fid) {
      return NextResponse.json(
        { error: 'Missing fid parameter' },
        { status: 400 }
      );
    }
    
    // Mendapatkan status transaksi
    const transaction = transactionStore[fid];
    
    if (!transaction) {
      return NextResponse.json(
        { status: 'not_found' }
      );
    }
    
    return NextResponse.json({
      transaction
    });
  } catch (error) {
    console.error('Error getting transaction status:', error);
    
    return NextResponse.json(
      { error: 'Failed to get transaction status' },
      { status: 500 }
    );
  }
}