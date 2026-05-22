import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    feature: 'Recovery Readiness',
    summary: { clientsReviewed: 24, deloadSuggested: 5, sleepFlags: 7, hydrationFlags: 4 },
    clients: [
      { name: 'Alex Johnson', readiness: 62, signal: 'HRV down 18% and sleep under 6h', action: 'Swap HIIT for zone-2 walk and mobility' },
      { name: 'Maya Singh', readiness: 81, signal: 'Good sleep and low soreness', action: 'Proceed with planned strength progression' },
      { name: 'Chris Lee', readiness: 54, signal: 'High soreness and missed hydration target', action: 'Deload lower-body volume by 30%' },
    ],
    rules: [
      { rule: 'HRV drop > 15%', response: 'Reduce intensity and add breathing work' },
      { rule: 'Sleep < 6 hours', response: 'Move high-skill work to next session' },
      { rule: 'Soreness >= 8/10', response: 'Deload affected movement pattern' },
    ],
  });
}
