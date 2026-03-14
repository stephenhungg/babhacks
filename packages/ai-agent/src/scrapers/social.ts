import type { SocialData } from "@lapis/shared";

const XAI_API_KEY = process.env.XAI_API_KEY;
const XAI_MODEL = "grok-3";

/**
 * Scrape social data for a Twitter/X handle using Grok's real-time X knowledge.
 * Falls back to null if no handle provided or API unavailable.
 */
export async function scrapeSocial(handle?: string): Promise<SocialData | null> {
  if (!handle) return null;

  // strip @ if present
  const cleanHandle = handle.replace(/^@/, "");

  if (!XAI_API_KEY) {
    console.warn("[social] XAI_API_KEY not set, skipping social scrape");
    return null;
  }

  try {
    console.log(`[social] looking up @${cleanHandle} via Grok...`);

    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: XAI_MODEL,
        messages: [
          {
            role: "system",
            content:
              "You have access to real-time X/Twitter data. Return ONLY a valid JSON object. No markdown, no explanation, no code fences. If the account does not exist, return null.",
          },
          {
            role: "user",
            content: `Look up @${cleanHandle} on X/Twitter. Return their current follower count, approximate number of posts in the last 30 days, and average likes per recent post. Return as: {"handle": "${cleanHandle}", "followers": number, "recentPostCount": number, "avgEngagement": number}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.warn(`[social] Grok API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content || content === "null") {
      console.warn(`[social] @${cleanHandle} not found on X`);
      return null;
    }

    const parsed = JSON.parse(content);

    // validate the response has the fields we need
    if (
      typeof parsed.followers !== "number" ||
      typeof parsed.recentPostCount !== "number" ||
      typeof parsed.avgEngagement !== "number"
    ) {
      console.warn(`[social] invalid response from Grok:`, content);
      return null;
    }

    console.log(
      `[social] @${cleanHandle}: ${parsed.followers} followers, ${parsed.recentPostCount} posts/30d, ${parsed.avgEngagement} avg likes`
    );

    return {
      platform: "twitter",
      handle: cleanHandle,
      followers: parsed.followers,
      recentPostCount: parsed.recentPostCount,
      avgEngagement: parsed.avgEngagement,
    };
  } catch (err) {
    console.warn(
      `[social] scrape failed for @${cleanHandle}: ${(err as Error).message}`
    );
    return null;
  }
}
