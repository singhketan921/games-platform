import { NextResponse } from "next/server";
import { updateAdminTenantGame } from "../../../../../../../src/lib/api";

export async function PATCH(request, { params }) {
  try {
    const body = await request.json();
    await updateAdminTenantGame(params.tenantId, params.gameId, body);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to update assignment" },
      { status: 400 }
    );
  }
}
