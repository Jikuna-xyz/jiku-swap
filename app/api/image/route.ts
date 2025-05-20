import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Handler untuk GET request
export async function GET(req: NextRequest) {
  try {
    // Dapatkan parameter dari URL jika ada
    const searchParams = req.nextUrl.searchParams;
    const screen = searchParams.get('screen') || 'main';
    
    // Tentukan path gambar berdasarkan parameter
    let imagePath;
    
    switch (screen) {
      case 'swap':
        imagePath = path.join(process.cwd(), 'public', 'frames', 'swap.png');
        break;
      case 'tokenSelect':
        imagePath = path.join(process.cwd(), 'public', 'frames', 'token-select.png');
        break;
      case 'connect':
        imagePath = path.join(process.cwd(), 'public', 'frames', 'connect.png');
        break;
      case 'leaderboard':
        imagePath = path.join(process.cwd(), 'public', 'frames', 'leaderboard.png');
        break;
      case 'jxp':
        imagePath = path.join(process.cwd(), 'public', 'frames', 'jxp.png');
        break;
      case 'confirmSwap':
        imagePath = path.join(process.cwd(), 'public', 'frames', 'confirm-swap.png');
        break;
      case 'executing':
        imagePath = path.join(process.cwd(), 'public', 'frames', 'executing.png');
        break;
      case 'success':
        imagePath = path.join(process.cwd(), 'public', 'frames', 'success.png');
        break;
      case 'error':
        imagePath = path.join(process.cwd(), 'public', 'frames', 'error.png');
        break;
      default:
        // Default ke main jika tidak ada parameter yang cocok
        imagePath = path.join(process.cwd(), 'public', 'frames', 'main.png');
    }
    
    // Fallback ke logo jika file tidak ada
    if (!fs.existsSync(imagePath)) {
      imagePath = path.join(process.cwd(), 'public', 'logo.png');
    }
    
    // Baca file sebagai buffer
    const imageBuffer = fs.readFileSync(imagePath);
    
    // Set header respons dengan CORS yang benar
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=60',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Origin, Accept',
        'Access-Control-Max-Age': '86400'
      }
    });
  } catch (error) {
    console.error('Error serving image:', error);
    
    // Jika gagal, coba kirim logo default
    try {
      const logoPath = path.join(process.cwd(), 'public', 'logo.png');
      const fallbackBuffer = fs.readFileSync(logoPath);
      
      return new NextResponse(fallbackBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=60',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Origin, Accept',
          'Access-Control-Max-Age': '86400'
        }
      });
    } catch (fallbackError) {
      // Jika semua gagal, kirim respons dengan kode status 500
      return new NextResponse(null, { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Origin, Accept'
        }
      });
    }
  }
}

// Tambahkan handler untuk OPTIONS request (preflight CORS)
export async function OPTIONS(req: NextRequest) {
  // Kirim respons kosong dengan header CORS lengkap
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Origin, Accept',
      'Access-Control-Max-Age': '86400'
    }
  });
} 