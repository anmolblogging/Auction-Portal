import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch('https://www.espn.com/espn/rss/news', { next: { revalidate: 3600 } });
    const xml = await res.text();
    
    const items = xml.split('<item>');
    const headlines: string[] = [];
    
    for (let i = 1; i < items.length && headlines.length < 5; i++) {
      let title = "";
      const match = items[i].match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/);
      if (match) {
        title = match[1];
      } else {
        const match2 = items[i].match(/<title>(.*?)<\/title>/);
        if (match2) title = match2[1];
      }
      
      if (title) {
        if (headlines.length < 2) {
          headlines.push(`🔴 BREAKING: ${title}`);
        } else {
          headlines.push(title);
        }
      }
    }

    if (headlines.length === 0) {
      throw new Error("No headlines found");
    }

    return NextResponse.json({ headlines });
  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json({
      headlines: [
        '🔴 LIVE: Virat Kohli SOLD ₹260L',
        'Bumrah going ₹228L',
        'New IPL 2025 room open',
        'Rashid Khan SOLD ₹148L'
      ]
    });
  }
}
