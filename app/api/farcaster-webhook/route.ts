import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("Received Farcaster webhook:", body);
    
    // Proses data Farcaster webhooks di sini
    // Contoh: Proses interaksi frame, notifikasi, dll.
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing Farcaster webhook:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 