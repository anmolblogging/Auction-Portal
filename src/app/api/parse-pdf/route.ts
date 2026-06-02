/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { base64 } = await req.json();
    if (!base64) {
      return NextResponse.json({ error: 'Base64 data is required' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY is missing' }, { status: 400 });
    }

    // Call Anthropic Messages API with PDF document
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        system: `You are an expert sports data analyst. Analyze the uploaded PDF document and extract any list/table of sports players.
For each player found, build a player object matching this structure:
{
  "name": "Full Name",
  "country": "Country Name (infer if not present)",
  "role": "Batter" | "Bowler" | "All-rounder" | "WK-Batter" (or custom role like "Forward", "Midfielder", "Defender", "Goalkeeper" for football, etc. based on the sport)",
  "tier": "Elite" | "Platinum" | "Gold" | "Silver",
  "base": number (base price in Lakhs/Millions, parse from document or default to 50 if not specified),
  "img": "2-3 letter initials representing the name, e.g. 'VK' for Virat Kohli",
  "nat": "emoji flag of country, e.g. 🇮🇳, 🇵🇹, 🇦🇷",
  "bio": "A short 1-sentence bio or key stat about the player from the PDF or standard knowledge."
}
Return a JSON object with a single field "players", which is an array of these player objects.
Only output the JSON object. Do not include markdown code block formatting (like \`\`\`json) or any conversational text around the JSON. Output raw JSON.`,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'document',
                source: {
                  type: 'base64',
                  media_type: 'application/pdf',
                  data: base64,
                },
              },
              {
                type: 'text',
                text: 'Parse the player list from the attached document and return a JSON list of players.',
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({ error: `Anthropic API error: ${errText}` }, { status: response.status });
    }

    const data = await response.json();
    const textContent = data.content?.[0]?.text || '';
    
    let cleanedText = textContent.trim();
    if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/```$/, '').trim();
    }

    try {
      const result = JSON.parse(cleanedText);
      if (result.players && Array.isArray(result.players)) {
        result.players = result.players.map((p: any, idx: number) => ({
          ...p,
          id: `${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 9)}`,
        }));
      }
      return NextResponse.json(result);
    } catch (parseErr) {
      console.error('Failed to parse Claude output as JSON:', cleanedText, parseErr);
      return NextResponse.json({ error: 'Failed to parse player details from AI output' }, { status: 500 });
    }

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
