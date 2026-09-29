import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest, { params }: { params: Promise<{ connectorId: string }> }) {
  const { connectorId } = await params;
  const token = request.headers.get("x-shiftproof-token");
  const expected = process.env[`CONNECTOR_${connectorId.toUpperCase()}_TOKEN`];
  if (expected && token !== expected) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const payload = await request.json().catch(() => ({}));
  return NextResponse.json({ ok: true, connectorId, receivedAt: new Date().toISOString(), acceptedKeys: Object.keys(payload).slice(0, 20) });
}