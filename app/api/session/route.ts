import { NextResponse } from "next/server";
import { createSession } from "@/lib/session";

export async function POST() {
  const s = await createSession();
  return NextResponse.json(s);
}
