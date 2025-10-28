import { NextResponse } from "next/server";
import { z } from "zod";
import { calculatePricing } from "@/lib/pricing/engine";
import type { FeatureKey } from "@/lib/store/builder";
import { ROLE_KEYS } from "@/lib/pricing/rules";

type RoleKey = (typeof ROLE_KEYS)[number];

const featureEnum = z.enum([
  "dimension",
  "ar",
  "fullscreen",
  "screenshot",
  "color",
  "option",
  "preset",
  "aiSuggestions",
  "aiCatalog",
] as [FeatureKey, ...FeatureKey[]]);

const roleRatesSchema = z
  .object(
    ROLE_KEYS.reduce<Record<RoleKey, z.ZodOptional<z.ZodNumber>>>(
      (acc, role) => {
        acc[role] = z.number().positive().optional();
        return acc;
      },
      {} as Record<RoleKey, z.ZodOptional<z.ZodNumber>>
    )
  )
  .partial();

const requestSchema = z.object({
  blueprintId: z.string().uuid().optional(),
  features: z.array(featureEnum).default([]),
  roleRates: roleRatesSchema.optional(),
  k: z.number().optional(),
});

function badRequest(message: string) {
  return NextResponse.json(
    {
      error: {
        code: "BAD_REQUEST",
        message,
      },
    },
    { status: 400 }
  );
}

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch (error) {
    return badRequest("Invalid JSON body");
  }

  const parsed = requestSchema.safeParse(json);
  if (!parsed.success) {
    return badRequest(parsed.error.flatten().formErrors.join("; ") || "Invalid payload");
  }

  const { features, roleRates, k } = parsed.data;
  const pricing = calculatePricing({
    features,
    roleRates: roleRates as Partial<Record<RoleKey, number>> | undefined,
    k,
  });

  return NextResponse.json({
    dev: pricing.dev,
    maint: pricing.maint,
    overhead: pricing.overhead,
    technology: pricing.technology,
    vat: pricing.vat,
    total: pricing.total,
    featureBreakdown: pricing.featureBreakdown,
    trace: pricing.trace,
    traceId: pricing.traceId,
    generatedAt: pricing.generatedAt,
  });
}
