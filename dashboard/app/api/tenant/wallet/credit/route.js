import { NextResponse } from "next/server";
import { creditTenantWallet } from "../../../../../src/lib/tenantApi";

export async function POST(request) {
  try {
    const body = await request.json();
    const { playerId, amount, reference } = body || {};
    if (!playerId || !amount) {
      return NextResponse.json({ error: "playerId and amount are required" }, { status: 400 });
    }
    const result = await creditTenantWallet({ playerId, amount, reference });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err.message || "Failed to credit" }, { status: 400 });
  }
}