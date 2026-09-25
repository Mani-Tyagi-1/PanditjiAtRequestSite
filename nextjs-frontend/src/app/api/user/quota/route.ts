import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    success: true,
    quota: {
      total: 1000,
      used: 0,
      remaining: 1000,
      unlimited: true,
    },
  });
}
