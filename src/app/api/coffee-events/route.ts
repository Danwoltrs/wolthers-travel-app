import { NextResponse } from 'next/server';
import { scrapeCoffeeEvents, searchCoffeeEvents } from '@/services/coffee-events/scraper';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  const enableScraping = searchParams.get('scraping') === 'true';

  try {
    let events;
    
    if (query) {
      events = await searchCoffeeEvents(query);
    } else {
      events = await scrapeCoffeeEvents(enableScraping);
    }

    return NextResponse.json({
      success: true,
      events: events,
      count: events.length
    });

  } catch (error) {
    console.error('Coffee events API error:', error);
    
    // Return fallback data on error
    const fallbackEvents = await scrapeCoffeeEvents(false);
    
    return NextResponse.json({
      success: false,
      events: fallbackEvents,
      count: fallbackEvents.length,
      error: 'Scraping failed, using fallback data'
    });
  }
}