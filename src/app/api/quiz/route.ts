import { NextResponse } from 'next/server';
import { QUIZ_DATA } from '@/lib/quizData';

// Allow any website (like your WordPress blog) to request this data securely
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Handle preflight requests
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
  try {
    // Take all categories and mash them into one giant pool of 100+ questions
    const allQuestions = Object.values(QUIZ_DATA).flat();
    
    // Shuffle the giant pool randomly
    const shuffled = allQuestions.sort(() => 0.5 - Math.random());
    
    // Pick the top 5 random questions to send to the ad widget
    const selected = shuffled.slice(0, 5);

    return NextResponse.json({ questions: selected }, { headers: corsHeaders, status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch quiz data' }, { headers: corsHeaders, status: 500 });
  }
}