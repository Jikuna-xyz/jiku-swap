import { NextRequest, NextResponse } from 'next/server';
import { 
  FrameButton,
  validateFrameMessage
} from 'frames.js';

// Token data dari kontrak Jikuna
const DEFAULT_TOKENS = [
  {
    symbol: "MON",
    name: "Monad",
    address: "0x0000000000000000000000000000000000000000", // Native token
    decimals: 18
  },
  {
    symbol: "WMON",
    name: "Wrapped Monad",
    address: "0xaF40B9D229eAE50FD258AEA9C7dB7d01D62bAA5e",
    decimals: 18
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    address: "0xCf3b2C7C148baFf136B383883C1F5c825fb7BEb5",
    decimals: 6
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    address: "0xc7e46CBeA99D9831CC9142cBc449e71F16b6973e",
    decimals: 6
  }
];

// Konstanta untuk router kontrak Jikuna
const JIKUNA_ROUTER = "0x9906c1FbaD6262E72fC3aA1db42A89a3629f93EE";
const JIKUNA_ROUTER_ETH = "0x0f36AF6f7EA2b7708D756991E1f13ec0Add23998";

// Base URL untuk aplikasi
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://jikuna-swap.vercel.app';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Mendapatkan dan memvalidasi pesan frame
    const body = await req.json();
    console.log("Frame POST request body:", JSON.stringify(body));
    
    // Validasi message menggunakan frames.js
    const result = await validateFrameMessage(body);
    console.log("Validation result:", JSON.stringify(result));
    
    if (!result.isValid || !result.message) {
      console.error("Invalid frame message");
      return NextResponse.json(
        { error: 'Invalid frame message' },
        { status: 400 }
      );
    }

    // Menggunakan type any untuk menghindari error tipe
    const message = result.message as any;
    
    // Mendapatkan state dan data button
    const buttonIndex = message.buttonIndex || 1;
    const inputText = message.inputText || '';
    const fidString = message.requesterFid?.toString() || '';
    
    console.log(`Button: ${buttonIndex}, Input: ${inputText}, FID: ${fidString}`);
    
    // Parse state
    let urlState;
    try {
      urlState = message.state ? JSON.parse(message.state) : { 
        step: 'main',
        fromToken: DEFAULT_TOKENS[0].symbol,
        toToken: DEFAULT_TOKENS[2].symbol,
        amount: '0.1'
      };
      console.log("Parsed state:", JSON.stringify(urlState));
    } catch (e) {
      console.error("Error parsing state:", e);
      urlState = { 
        step: 'main',
        fromToken: DEFAULT_TOKENS[0].symbol,
        toToken: DEFAULT_TOKENS[2].symbol,
        amount: '0.1'
      };
    }

    // Handle navigasi berdasarkan step dan button
    let frameResponse;
    
    if (urlState.step === 'main') {
      if (buttonIndex === 1) {
        // Ke halaman swap
        frameResponse = getSwapFrame({ 
          ...urlState, 
          step: 'swap',
          fid: fidString
        });
      } else if (buttonIndex === 2) {
        // Ke halaman wallet connect
        frameResponse = getConnectWalletFrame({ 
          ...urlState, 
          step: 'connect',
          fid: fidString
        });
      } else if (buttonIndex === 3) {
        // Ke halaman leaderboard
        frameResponse = getLeaderboardFrame({ 
          ...urlState, 
          step: 'leaderboard',
          fid: fidString
        });
      } else if (buttonIndex === 4) {
        // Ke halaman rewards
        frameResponse = getJXPFrame({ 
          ...urlState, 
          step: 'jxp',
          fid: fidString
        });
      } else {
        // Default landing
        frameResponse = getMainFrame(urlState);
      }
    } else if (urlState.step === 'swap') {
      if (buttonIndex === 1) {
        // Handle input amount
        frameResponse = getSwapFrame({ 
          ...urlState, 
          step: 'input_amount',
          fid: fidString
        });
      } else if (buttonIndex === 2) {
        // Token selection - from token
        frameResponse = getTokenSelectionFrame({ 
          ...urlState, 
          step: 'select_from_token',
          fid: fidString
        });
      } else if (buttonIndex === 3) {
        // Token selection - to token
        frameResponse = getTokenSelectionFrame({ 
          ...urlState, 
          step: 'select_to_token',
          fid: fidString
        });
      } else if (buttonIndex === 4) {
        // Back to main
        frameResponse = getMainFrame({ 
          ...urlState, 
          step: 'main',
          fid: fidString
        });
      }
    } else if (urlState.step === 'input_amount') {
      // Handle input amount
      if (inputText) {
        frameResponse = getSwapConfirmFrame({ 
          ...urlState, 
          step: 'confirm_swap',
          amount: inputText,
          fid: fidString
        });
      } else {
        // Jika tidak ada input, kembali ke swap
        frameResponse = getSwapFrame({ 
          ...urlState, 
          step: 'swap',
          fid: fidString,
          error: 'Masukkan jumlah yang valid'
        });
      }
    } else if (urlState.step === 'confirm_swap') {
      if (buttonIndex === 1) {
        // Execute swap
        frameResponse = getSwapExecutionFrame({ 
          ...urlState, 
          step: 'execute_swap',
          fid: fidString
        });
      } else {
        // Kembali ke swap
        frameResponse = getSwapFrame({ 
          ...urlState, 
          step: 'swap',
          fid: fidString
        });
      }
    } else if (urlState.step === 'select_from_token' || urlState.step === 'select_to_token') {
      // Handle token selection
      const selectedToken = DEFAULT_TOKENS[buttonIndex - 1];
      if (selectedToken) {
        if (urlState.step === 'select_from_token') {
          frameResponse = getSwapFrame({ 
            ...urlState, 
            step: 'swap',
            fromToken: selectedToken.symbol,
            fid: fidString
          });
        } else {
          frameResponse = getSwapFrame({ 
            ...urlState, 
            step: 'swap',
            toToken: selectedToken.symbol,
            fid: fidString
          });
        }
      } else {
        // Kembali ke swap jika tidak ada token yang dipilih
        frameResponse = getSwapFrame({ 
          ...urlState, 
          step: 'swap',
          fid: fidString
        });
      }
    } else if (urlState.step === 'leaderboard') {
      // Kembali ke main
      frameResponse = getMainFrame({ 
        ...urlState, 
        step: 'main',
        fid: fidString
      });
    } else if (urlState.step === 'jxp') {
      // Kembali ke main
      frameResponse = getMainFrame({ 
        ...urlState, 
        step: 'main',
        fid: fidString
      });
    } else if (urlState.step === 'connect') {
      // Kembali ke main
      frameResponse = getMainFrame({ 
        ...urlState, 
        step: 'main',
        fid: fidString
      });
    } else if (urlState.step === 'execute_swap') {
      // Show success and return to main
      frameResponse = getSwapSuccessFrame({ 
        ...urlState, 
        step: 'swap_success',
        fid: fidString
      });
    } else if (urlState.step === 'swap_success') {
      // Kembali ke main
      frameResponse = getMainFrame({ 
        ...urlState, 
        step: 'main',
        fid: fidString
      });
    } else {
      // Default to main frame
      frameResponse = getMainFrame(urlState);
    }

    console.log("Frame response:", JSON.stringify(frameResponse));
    return NextResponse.json(frameResponse);
  } catch (error) {
    console.error("Error in frame POST handler:", error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getMainFrame(state: any) {
  return {
    version: 'vNext',
    image: `${BASE_URL}/api/frame/image`,
    buttons: [
      { label: '🚀 Mulai Swap', action: 'post' },
      { label: '💼 Koneksi Wallet', action: 'post' },
      { label: '📊 Leaderboard', action: 'post' },
      { label: '💎 JXP Rewards', action: 'post' }
    ],
    state: JSON.stringify({
      ...state,
      step: 'main'
    })
  };
}

function getSwapFrame(state: any) {
  const { fromToken, toToken, amount, error } = state;
  const imageUrl = `${BASE_URL}/api/frame/image?screen=swap&fromToken=${fromToken}&toToken=${toToken}&amount=${amount}${error ? `&error=${error}` : ''}`;
  
  return {
    version: 'vNext',
    image: imageUrl,
    buttons: [
      { label: '💸 Jumlah', action: 'post' },
      { label: `📥 ${fromToken || 'MON'}`, action: 'post' },
      { label: `📤 ${toToken || 'USDC'}`, action: 'post' },
      { label: '⬅️ Kembali', action: 'post' }
    ],
    state: JSON.stringify({
      ...state,
      step: 'swap'
    })
  };
}

function getTokenSelectionFrame(state: any) {
  const selectingFrom = state.step === 'select_from_token';
  const imageUrl = `${BASE_URL}/api/frame/image?screen=tokenSelect&selectingFrom=${selectingFrom}`;

  return {
    version: 'vNext',
    image: imageUrl,
    buttons: [
      { label: 'MON', action: 'post' },
      { label: 'WMON', action: 'post' },
      { label: 'USDC', action: 'post' },
      { label: 'USDT', action: 'post' }
    ],
    state: JSON.stringify(state)
  };
}

function getConnectWalletFrame(state: any) {
  return {
    version: 'vNext',
    image: `${BASE_URL}/api/frame/image?screen=connect`,
    buttons: [
      { label: 'Buka Web Wallet', action: 'link', target: `${BASE_URL}/wallet?fid=${state.fid}` },
      { label: '⬅️ Kembali', action: 'post' }
    ],
    state: JSON.stringify({
      ...state,
      step: 'connect'
    })
  };
}

function getLeaderboardFrame(state: any) {
  return {
    version: 'vNext',
    image: `${BASE_URL}/api/frame/image?screen=leaderboard`,
    buttons: [
      { label: '⬅️ Kembali', action: 'post' }
    ],
    state: JSON.stringify({
      ...state,
      step: 'leaderboard'
    })
  };
}

function getJXPFrame(state: any) {
  return {
    version: 'vNext',
    image: `${BASE_URL}/api/frame/image?screen=jxp`,
    buttons: [
      { label: 'Lihat Rewards', action: 'link', target: `${BASE_URL}/jxp-tiers?fid=${state.fid}` },
      { label: '⬅️ Kembali', action: 'post' }
    ],
    state: JSON.stringify({
      ...state,
      step: 'jxp'
    })
  };
}

function getSwapConfirmFrame(state: any) {
  const { fromToken, toToken, amount } = state;
  const imageUrl = `${BASE_URL}/api/frame/image?screen=confirmSwap&fromToken=${fromToken}&toToken=${toToken}&amount=${amount}`;
  
  return {
    version: 'vNext',
    image: imageUrl,
    buttons: [
      { label: '✅ Konfirmasi Swap', action: 'post' },
      { label: '❌ Batalkan', action: 'post' }
    ],
    state: JSON.stringify({
      ...state,
      step: 'confirm_swap'
    })
  };
}

function getSwapExecutionFrame(state: any) {
  return {
    version: 'vNext',
    image: `${BASE_URL}/api/frame/image?screen=executing`,
    buttons: [
      { label: 'Menunggu...', action: 'post', disabled: true }
    ],
    state: JSON.stringify({
      ...state,
      step: 'execute_swap'
    })
  };
}

function getSwapSuccessFrame(state: any) {
  const { fromToken, toToken, amount } = state;
  const imageUrl = `${BASE_URL}/api/frame/image?screen=success&fromToken=${fromToken}&toToken=${toToken}&amount=${amount}`;
  
  return {
    version: 'vNext',
    image: imageUrl,
    buttons: [
      { label: '🎉 Berhasil! Kembali ke Menu', action: 'post' },
      { label: 'Bagikan di Farcaster', action: 'post_redirect' }
    ],
    state: JSON.stringify({
      ...state,
      step: 'swap_success'
    })
  };
}

function getErrorFrame(state: any, errorMessage: string) {
  return {
    version: 'vNext',
    image: `${BASE_URL}/api/frame/image?screen=error&message=${encodeURIComponent(errorMessage)}`,
    buttons: [
      { label: 'Kembali ke Menu', action: 'post' }
    ],
    state: JSON.stringify({
      ...state,
      step: 'main'
    })
  };
}

// Endpoint GET untuk Farcaster Frame discovery
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    // Log request untuk debugging
    console.log("Frame GET request:", req.url);
    
    // Endpoint GET untuk memberikan metadata frame untuk integrasi Farcaster
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://jikuna-swap.vercel.app';
    
    // Frame metadata untuk Farcaster menggunakan endpoint API image yang khusus dibuat
    const frameMetadata = {
      version: "next",
      // Gunakan endpoint API untuk gambar
      imageUrl: `${baseUrl}/api/image`,
      // Tambahkan postUrl agar frame tahu harus POST kemana
      postUrl: `${baseUrl}/api/frame`,
      // Buttons yang dimiliki frame
      buttons: [
        { label: "🚀 Mulai Swap" },
        { label: "💼 Koneksi Wallet" },
        { label: "📊 Leaderboard" },
        { label: "💎 JXP Rewards" }
      ],
      // Initial state
      state: JSON.stringify({
        step: 'main',
        fromToken: DEFAULT_TOKENS[0].symbol,
        toToken: DEFAULT_TOKENS[2].symbol,
        amount: '0.1'
      })
    };
    
    // Set header respons
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type');
    
    console.log("Frame metadata GET response:", JSON.stringify(frameMetadata));
    return new NextResponse(JSON.stringify(frameMetadata), {
      status: 200,
      headers
    });
  } catch (error) {
    console.error("Error in frame GET handler:", error);
    
    // Even with error, send CORS headers
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type');
    
    return new NextResponse(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers
    });
  }
}

// Tambahkan handler untuk OPTIONS request (preflight CORS)
export async function OPTIONS(req: NextRequest): Promise<NextResponse> {
  // Set header respons untuk CORS
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type');
  
  // Kirim respons kosong dengan header CORS
  return new NextResponse(null, {
    status: 200,
    headers
  });
} 