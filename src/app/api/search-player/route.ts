import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GROQ_API_KEY is missing' }, { status: 400 });
    }

    // Call Groq Chat Completions API
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `You are a sports database assistant. Based on the user query, return a JSON object with a single field "players", which is an array of player objects.
Each player object must follow this structure:
{
  "name": "Full Name",
  "country": "Country Name",
  "role": "Batter" | "Bowler" | "All-rounder" | "WK-Batter" (or custom role like "Forward", "Midfielder", "Defender", "Goalkeeper" for football/basketball, etc.),
  "tier": "Elite" | "Platinum" | "Gold" | "Silver",
  "base": number (reasonable base price in Lakhs or Millions, e.g. 50, 100, 200, 2000 depending on the sport. Make it consistent with typical auction base prices, e.g. 50-200),
  "img": "2-3 letter uppercase initials representing the name, e.g. 'VK' for Virat Kohli",
  "nat": "emoji flag of country, e.g. 🇮🇳, 🇵🇹, 🇦🇷",
  "bio": "A short 1-sentence description/bio of the player's recent achievements/style."
}
Only output the JSON object. Do not include markdown code block formatting (like \`\`\`json) or any conversational text around the JSON. Output raw JSON.`
          },
          {
            role: 'user',
            content: `Search for players matching query: "${query}"`
          }
        ]
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({ error: `Groq API error: ${errText}` }, { status: response.status });
    }

    const data = await response.json();
    const textContent = data.choices?.[0]?.message?.content || '';
    
    // Attempt to parse JSON. Sometimes LLMs might still output codeblocks, so let's clean it up
    let cleanedText = textContent.trim();
    if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/```$/, '').trim();
    }
    
    try {
      const result = JSON.parse(cleanedText);
      // Generate unique IDs for the players
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
