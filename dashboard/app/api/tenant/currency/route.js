import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request) {
  try {
    const { currency } = await request.json();
    if (!currency || typeof currency !== "string") {
      return NextResponse.json({ error: "Currency is required" }, { status: 400 });
    }
    const normalized = currency.trim().toUpperCase();
    if (!normalized) {
      return NextResponse.json({ error: "Currency is required" }, { status: 400 });
    }
    cookies().set({
      name: "tenant-preferred-currency",
      value: normalized,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
    });
    return NextResponse.json({ success: true, currency: normalized });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Failed to update currency preference" },
      { status: 400 }
    );
  }
}
