import { NextResponse } from "next/server";
import { CATALOG_DATA } from "@/data/catalog";

export async function GET() {
  return NextResponse.json(CATALOG_DATA, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
