import { NextResponse } from "next/server";
import { APP_URL } from "../../../lib/constants";

export async function GET() {
  const farcasterConfig = {
    accountAssociation: {
      header:
        "eyJmaWQiOjEwODMzNzAsInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHg5NTUwODM1MTUwRWU4MjdhRkRCMTQ5ZDZjN2YwQUUxOTkwMzdFMzgxIn0",
      payload:
        "eyJkb21haW4iOiJqaWt1LXN3YXAudmVyY2VsLmFwcCJ9",
      signature:
        "MHgyMDI2Nzk2OWJiMGZjNmQwMzM1YjE1NTYxZTQzYTViNjVhZTZkMGJiYTYxZDYzNjdhNDZmN2ViZGI0NDdjMzliNTQxYjNjNTVkNmVkNjY5NTc2OTMwZjY1M2JlNWMxMTc3OTZiMWRjNWU5MWY4MDhlZDJiOWE3ZjU4YWI4YmMxZDFi",
    },
    frame: {
      version: "1",
      name: "Jikuna Swap",
      iconUrl: `${APP_URL}/images/icon.png`,
      homeUrl: `${APP_URL}`,
      imageUrl: `${APP_URL}/images/feed.png`,
      screenshotUrls: [],
      tags: ["jikuna", "farcaster", "miniapp", "swap"],
      primaryCategory: "developer-tools",
      buttonTitle: "Launch App",
      splashImageUrl: `${APP_URL}/images/splash.png`,
      splashBackgroundColor: "#ffffff",
      webhookUrl: `${APP_URL}/api/webhook`,
    },
  };

  return NextResponse.json(farcasterConfig);
} 