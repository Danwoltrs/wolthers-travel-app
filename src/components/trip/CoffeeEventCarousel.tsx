import React, { useState, useEffect } from 'react';
import { CoffeeEvent } from '@/services/coffee-events/scraper';
import { CoffeeEventScraper } from '@/services/coffee-events/scraper';
import { Calendar, MapPin } from 'lucide-react';
import clsx from 'clsx';

export const CoffeeEventCarousel: React.FC = () => {
  const [events, setEvents] = useState<CoffeeEvent[]>([]);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);

  useEffect(() => {
    const fetchEvents = async () => {
      const scraper = new CoffeeEventScraper();
      const allEvents = await Promise.all([
        scraper.scrapeEvents('WorldOfCoffee'),
        scraper.scrapeEvents('SwissCoffeeDinner'),
        scraper.scrapeEvents('NationalCoffeeAssociation'),
        scraper.scrapeEvents('SantosSeminar'),
        scraper.scrapeEvents('SpecialtyCoffeeAssociation')
      ]);

      const sortedEvents = allEvents.flat()
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .slice(0, 6);

      setEvents(sortedEvents);
    };

    fetchEvents();
  }, []);

  const nextEvent = () => {
    setCurrentEventIndex((prev) => (prev + 1) % events.length);
  };

  const renderEventCard = (event: CoffeeEvent) => (
    <div 
      className={clsx(
        'bg-white dark:bg-[#1a1a1a]',
        'border border-pearl-200 dark:border-[#2a2a2a]',
        'rounded-lg p-4 shadow-md',
        'transition-all duration-300 ease-in-out',
        'flex flex-col space-y-2'
      )}
    >
      <h3 className="text-lg font-semibold text-emerald-800 dark:text-golden-400">
        {event.name}
      </h3>
      <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
        <Calendar className="w-5 h-5" />
        <span>{event.date.toLocaleDateString()}</span>
      </div>
      <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
        <MapPin className="w-5 h-5" />
        <span>{event.location}</span>
      </div>
      <a 
        href={event.url} 
        target="_blank" 
        rel="noopener noreferrer"
        className={clsx(
          'mt-2 inline-block',
          'bg-emerald-800 text-white',
          'px-3 py-1 rounded-md',
          'hover:bg-emerald-700',
          'transition-colors duration-200'
        )}
      >
        Event Details
      </a>
    </div>
  );

  return (
    <div className="coffee-event-carousel space-y-4">
      <h2 className="text-xl font-bold text-emerald-900 dark:text-golden-400">
        Upcoming Coffee Industry Events
      </h2>
      {events.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {events.map(renderEventCard)}
        </div>
      ) : (
        <p className="text-gray-500 dark:text-gray-400">
          Loading coffee industry events...
        </p>
      )}
    </div>
  );
};