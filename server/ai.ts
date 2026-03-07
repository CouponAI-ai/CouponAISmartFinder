import OpenAI from "openai";
import type { Coupon } from "@shared/schema";

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";
const FREE_MODEL = "meta-llama/llama-3.1-8b-instruct:free";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: OPENROUTER_BASE,
      defaultHeaders: {
        "HTTP-Referer": "https://couponai.replit.app",
        "X-Title": "CouponAI",
      },
    })
  : null;

interface AIRecommendation {
  deal: any;
  reason: string;
  score: number;
}

export async function getAIRecommendations(
  allDeals: any[],
  userCategories: string[]
): Promise<AIRecommendation[]> {
  if (!allDeals || allDeals.length === 0) {
    return [];
  }

  if (!openai) {
    throw new Error("AI not configured");
  }

  try {
    const simplifiedDeals = allDeals.map((d) => ({
      id: d.id,
      store: d.storeName,
      discount: d.discountAmount,
      title: d.title,
      category: d.category,
      claims: d.claimCount,
      distance: d.distance?.toFixed(1),
    }));

    const preferencesText = userCategories.length > 0
      ? `User preferences: ${userCategories.join(", ")}`
      : "No specific preferences set";

    const prompt = `You are a smart shopping assistant analyzing local deals for a user.

${preferencesText}

Available verified deals:
${JSON.stringify(simplifiedDeals, null, 2)}

Analyze these deals and recommend the top 5 most valuable ones. Consider:
1. Discount value and savings potential
2. Distance (closer is better)
3. Category match with user preferences (if any)
4. Popularity (claim count)

Return a JSON array with exactly this format:
[
  { "id": "deal_id", "reason": "Brief personalized reason why this is a great pick" },
  ...
]

Return ONLY the JSON array, no other text.`;

    const response = await openai.chat.completions.create({
      model: FREE_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) {
      throw new Error("No response from AI");
    }

    let aiPicks: { id: string; reason: string }[];
    try {
      aiPicks = JSON.parse(content);
    } catch (parseError) {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        aiPicks = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not parse AI response");
      }
    }

    const recommendations: AIRecommendation[] = aiPicks
      .map((pick, index) => {
        const deal = allDeals.find((d) => d.id === pick.id);
        if (!deal) return null;
        return {
          deal,
          reason: pick.reason || "Recommended by AI based on value and location",
          score: 100 - (index * 10),
        };
      })
      .filter((r): r is AIRecommendation => r !== null);

    return recommendations.length > 0 ? recommendations : [];
  } catch (error) {
    console.error("AI recommendation error:", error);
    throw error;
  }
}
