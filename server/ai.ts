import OpenAI from "openai";
import type { Coupon } from "@shared/schema";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export async function getAIRecommendations(
  allCoupons: Coupon[],
  userCategories: string[]
): Promise<Coupon[]> {
  // If no OpenAI key, return category-based recommendations
  if (!openai || !userCategories || userCategories.length === 0) {
    return allCoupons
      .filter((c) => userCategories.includes(c.category))
      .sort((a, b) => (b.claimCount || 0) - (a.claimCount || 0))
      .slice(0, 5);
  }

  try {
    // Get coupons in user's preferred categories
    const categoryMatches = allCoupons.filter((c) =>
      userCategories.includes(c.category)
    );

    if (categoryMatches.length === 0) {
      return [];
    }

    // Create a simplified list for AI analysis
    const simplifiedCoupons = categoryMatches.map((c) => ({
      id: c.id,
      store: c.storeName,
      discount: c.discountAmount,
      title: c.title,
      category: c.category,
      claims: c.claimCount,
    }));

    const prompt = `You are a smart shopping assistant. Based on these user preferences: ${userCategories.join(", ")}
    
And these available deals:
${JSON.stringify(simplifiedCoupons, null, 2)}

Recommend the top 5 deals that would be most valuable to this user. Consider:
1. Category match with preferences
2. Discount amount/value
3. Popularity (claim count)
4. Variety across different stores

Return ONLY a JSON array of deal IDs in order of recommendation, like: ["id1", "id2", "id3", "id4", "id5"]`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 200,
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    // Parse the AI response
    const recommendedIds: string[] = JSON.parse(content);
    
    // Return the full coupon objects in the recommended order
    const recommendations = recommendedIds
      .map((id) => allCoupons.find((c) => c.id === id))
      .filter((c): c is Coupon => c !== undefined);

    return recommendations.length > 0 ? recommendations : categoryMatches.slice(0, 5);
  } catch (error) {
    console.error("AI recommendation error:", error);
    // Fallback to category-based recommendations
    return allCoupons
      .filter((c) => userCategories.includes(c.category))
      .sort((a, b) => (b.claimCount || 0) - (a.claimCount || 0))
      .slice(0, 5);
  }
}
