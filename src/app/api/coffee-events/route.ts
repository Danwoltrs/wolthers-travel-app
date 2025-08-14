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

    // Convert Date objects to ISO strings for JSON serialization
    const serializedEvents = events.map(event => ({
      ...event,
      date: event.date.toISOString(),
      endDate: event.endDate ? event.endDate.toISOString() : undefined
    }));

    return NextResponse.json({
      success: true,
      events: serializedEvents,
      count: serializedEvents.length
    });

  } catch (error) {
    console.error('Coffee events API error:', error);
    
    // Return fallback data on error
    const fallbackEvents = await scrapeCoffeeEvents(false);
    const serializedFallbackEvents = fallbackEvents.map(event => ({
      ...event,
      date: event.date.toISOString(),
      endDate: event.endDate ? event.endDate.toISOString() : undefined
    }));
    
    return NextResponse.json({
      success: false,
      events: serializedFallbackEvents,
      count: serializedFallbackEvents.length,
      error: 'Scraping failed, using fallback data'
    });
  }
}