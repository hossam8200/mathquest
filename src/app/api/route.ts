import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ app: "MathQuest", version: "0.1.0", status: "ok" });
}