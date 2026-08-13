import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const newsAlertSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    category: z.string().trim().min(1).max(80).optional(),
    severity: z.string().trim().min(1).max(40).optional(),
    summary: z.string().trim().min(1).max(1_000),
    content: z.string().trim().min(1).max(10_000),
    impact: z.string().trim().max(500).nullable().optional(),
    affectedInstruments: z.array(z.string().trim().min(1).max(80)).max(20).optional(),
    source: z.string().trim().max(200).nullable().optional(),
    sourceUrl: z.string().trim().url().max(2_000).nullable().optional(),
    isBreaking: z.boolean().optional(),
  })
  .strict();

export async function GET() {
  try {
    const alerts = await prisma.newsAlert.findMany({
      where: { isActive: true },
      orderBy: [
        { isBreaking: "desc" },
        { publishedAt: "desc" },
      ],
      take: 20,
    });

    // If no database news exist yet, return sample breaking news (e.g. US-Russia tariff news from prompt)
    if (alerts.length === 0) {
      return NextResponse.json([
        {
          id: "sample-news-1",
          title: "US Senate Passes Russia Sanctions Bill with Tariff Provision",
          category: "Breaking News",
          severity: "BREAKING",
          summary: "US Senate passed Russia Sanctions Bill by 86–11 Majority Vote with potential 100% tariffs on oil buyers.",
          content: "🇺🇸 US Senate passed Russia Sanctions Bill by 86–11 Majority Vote.\n\n⚠️ Bill may give President Trump authority to impose up to 100% tariff on Russian oil buyers like India & China.\n\n🇮🇳 No automatic tariff on India yet — Bill needs House approval and Presidential signature.\n\n📌 India, China, Azerbaijan, Hungary & Slovakia are among potential target countries.\n\n⚠️ India Impact: If 100% tariff is imposed, US exports could become costly and India may need to review its Russian oil strategy.",
          impact: "HIGH — Energy & Oil Market Volatility",
          affectedInstruments: ["CRUDE", "NIFTY", "SENSEX"],
          source: "Global Market Wire",
          sourceUrl: "https://gwcindia.in",
          publishedAt: new Date().toISOString(),
          isBreaking: true,
          isActive: true,
        },
        {
          id: "sample-news-2",
          title: "RBI Monetary Policy Committee Maintains Inflation Target Outlook",
          category: "Economy",
          severity: "IMPORTANT",
          summary: "Central bank highlights strong domestic growth indicators ahead of upcoming derivative expiry.",
          content: "Reserve Bank of India maintains positive economic growth momentum with inflation trending within target bandwidth. Banking and financial sector liquidity remains stable.",
          impact: "MODERATE — Banking & Financial Stocks",
          affectedInstruments: ["BANKNIFTY", "FINNIFTY", "NIFTY"],
          source: "RBI Bulletin",
          publishedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
          isBreaking: false,
          isActive: true,
        },
      ]);
    }

    return NextResponse.json(alerts);
  } catch (err: unknown) {
    console.error("GET /api/news error:", err);
    return NextResponse.json(
      { error: "Failed to fetch news alerts" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const auth = await getAdminUser();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const parsed = newsAlertSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid news alert payload" },
        { status: 400 }
      );
    }

    const {
      title,
      category,
      severity,
      summary,
      content,
      impact,
      affectedInstruments,
      source,
      sourceUrl,
      isBreaking,
    } = parsed.data;

    const created = await prisma.newsAlert.create({
      data: {
        title,
        category: category || "Market",
        severity: severity || "INFO",
        summary,
        content,
        impact,
        affectedInstruments: Array.isArray(affectedInstruments) ? affectedInstruments : [],
        source,
        sourceUrl,
        isBreaking: Boolean(isBreaking),
        isActive: true,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err: unknown) {
    console.error("POST /api/news error:", err);
    return NextResponse.json(
      { error: "Failed to create news alert" },
      { status: 500 }
    );
  }
}
