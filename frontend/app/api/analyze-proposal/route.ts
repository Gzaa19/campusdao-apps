import { NextRequest, NextResponse } from "next/server";
import type { AIAnalysisResponse } from "@/lib/types";

/**
 * POST /api/analyze-proposal
 *
 * AI Analysis placeholder endpoint.
 * ─────────────────────────────────
 * Currently returns a deterministic mock response based on the proposal text.
 * To connect a real model, replace the logic inside `analyzeWithAI()` with
 * a call to your preferred provider, for example:
 *
 *   import OpenAI from "openai";
 *   const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
 *
 *   const chat = await openai.chat.completions.create({
 *     model: "gpt-4o-mini",
 *     messages: [{ role: "user", content: buildPrompt(description) }],
 *   });
 *   return parseResponse(chat.choices[0].message.content);
 *
 * Or use Google Gemini, Anthropic Claude, or any other LLM API of your choice.
 */

interface RequestBody {
  proposalId: number;
  description: string;
}

// ── Prompt builder (ready for real LLM integration) ─────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function buildPrompt(description: string): string {
  return `You are evaluating a student DAO funding proposal for community service work. 
Analyze the following proposal and respond with a JSON object containing:
- "summary": a 2-3 sentence executive summary
- "qualityScore": an integer 0-100 reflecting clarity, feasibility, and community impact
- "suggestions": an array of 2-4 actionable improvement suggestions

Proposal:
"""
${description}
"""

Return ONLY valid JSON, no markdown or explanation.`;
}

// ── Mock analyser (deterministic, no API key required) ───────

function mockAnalyze(description: string): AIAnalysisResponse {
  const wordCount = description.trim().split(/\s+/).length;
  const hasGoal = /goal|objective|aim|purpose/i.test(description);
  const hasBudget = /budget|fund|cost|spend|xlm/i.test(description);
  const hasTimeline = /week|month|day|timeline|schedule|duration/i.test(description);
  const hasCommunity = /community|student|campus|people|benefit/i.test(description);

  let score = 30;
  if (wordCount > 50)  score += 15;
  if (wordCount > 100) score += 10;
  if (hasGoal)      score += 15;
  if (hasBudget)    score += 10;
  if (hasTimeline)  score += 10;
  if (hasCommunity) score += 10;
  score = Math.min(score, 95);

  const suggestions: string[] = [];
  if (!hasGoal)      suggestions.push("Clearly state the main objective of the project.");
  if (!hasBudget)    suggestions.push("Break down how the requested funds will be allocated.");
  if (!hasTimeline)  suggestions.push("Include an estimated timeline with milestones.");
  if (!hasCommunity) suggestions.push("Describe the expected community impact and beneficiaries.");
  if (wordCount < 50) suggestions.push("Provide a more detailed description (aim for 100+ words).");

  const summary =
    score >= 70
      ? `This proposal demonstrates a clear community focus with a well-structured plan. It covers the essential components needed for DAO approval. Minor refinements could further strengthen the case for funding.`
      : score >= 50
        ? `The proposal has a reasonable foundation but would benefit from more detail in key areas. The community impact is implied but not fully elaborated. Adding specifics around budget breakdown and timeline would significantly improve its chance of approval.`
        : `The proposal is in early draft form and lacks critical details for the DAO to make an informed decision. It needs a clearer goal statement, budget breakdown, timeline, and explanation of community impact before it can be seriously considered.`;

  return {
    summary,
    qualityScore: score,
    suggestions: suggestions.slice(0, 4),
  };
}

// ── Route handler ────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body: RequestBody = await req.json();

    if (!body.description || typeof body.description !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid `description` field." },
        { status: 400 },
      );
    }

    const description = body.description.trim();

    if (description.length < 10) {
      return NextResponse.json(
        { error: "Description too short to analyze." },
        { status: 400 },
      );
    }

    // ── Real LLM integration point ───────────────────────────
    // Uncomment and adapt one of the examples below:
    //
    // Option A: OpenAI
    // const { default: OpenAI } = await import("openai");
    // const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    // const chat = await openai.chat.completions.create({
    //   model: "gpt-4o-mini",
    //   messages: [{ role: "user", content: buildPrompt(description) }],
    //   response_format: { type: "json_object" },
    // });
    // const result = JSON.parse(chat.choices[0].message.content ?? "{}");
    // return NextResponse.json(result);
    //
    // Option B: Google Gemini
    // const { GoogleGenerativeAI } = await import("@google/generative-ai");
    // const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);
    // const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    // const response = await model.generateContent(buildPrompt(description));
    // const result = JSON.parse(response.response.text());
    // return NextResponse.json(result);
    // ────────────────────────────────────────────────────────

    // Simulate a short delay to mimic real API latency
    await new Promise((r) => setTimeout(r, 800));

    const analysis = mockAnalyze(description);
    return NextResponse.json(analysis);
  } catch (error) {
    console.error("[analyze-proposal] Error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
