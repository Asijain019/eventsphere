import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
export const dynamic = "force-dynamic";
export async function GET() {
  let dbOk = false;
  try { await db.execute(sql`select 1`); dbOk = true; } catch { /* reported below */ }
  return NextResponse.json({ status: dbOk ? "ok" : "degraded", db: dbOk, time: new Date().toISOString() }, { status: dbOk ? 200 : 503 });
}
