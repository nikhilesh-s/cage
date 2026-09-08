import { NextResponse } from "next/server";
import { apply, getSession, saveSession, type Action } from "@/lib/session";

type Ctx = { params: Promise<{ code: string }> };

export async function GET(_: Request, { params }: Ctx) {
  const { code } = await params;
  const s = await getSession(code);
  if (!s) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(await saveSession(s), { headers: { "cache-control": "no-store" } });
}

export async function PATCH(req: Request, { params }: Ctx) {
  const { code } = await params;
  const s = await getSession(code);
  if (!s) return NextResponse.json({ error: "not found" }, { status: 404 });
  const a = (await req.json()) as Action;
  if (!a || typeof a.type !== "string") return NextResponse.json({ error: "bad action" }, { status: 400 });
  return NextResponse.json(await saveSession(apply(s, a)));
}
