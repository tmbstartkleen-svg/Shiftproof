import { NextResponse } from "next/server";
import { databaseStatus } from "@/lib/db";
import { storageStatus } from "@/lib/storage";
import { aiStatus } from "@/lib/ai";

export async function GET() {
  return NextResponse.json({
    ok: true,
    version: "7.0.0",
    runtime: "nextjs-cloud",
    database: databaseStatus(),
    storage: storageStatus(),
    ai: aiStatus()
  });
}