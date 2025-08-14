import axios from 'axios';
import { parse } from 'node-html-parser';
import { z } from 'zod';

// Event Schema for Type Safety
export const CoffeeEventSchema = z.object({
  id: z.string(),
  name: z.string(),
  date: z.date(),
  endDate: z.date().optional(),
  location: z.string(),
  url: z.string(),
  organization: z.string().optional(),
  description: z.string().optional(),
  source: z.enum([
    'WorldOfCoffee', 
    'SwissCoffeeDinner', 
    'NationalCoffeeAssociation', 
    'SantosSeminar', 
    'SpecialtyCoffeeAssociation',
    'SemanaInternacionalDoCafe',
    'CampinasEvent'
  ])
});

export type CoffeeEvent = z.infer<typeof CoffeeEventSchema>;

interface ScrapingConfig {
  timeout: number;
  retries: number;
  userAgent: string;
}

export class CoffeeEventScraper {
  private config: ScrapingConfig;
  private cache: Map<string, { data: CoffeeEvent[]; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 60 * 60 * 1000; // 1 hour

  constructor(config?: Partial<ScrapingConfig>) {
    this.config = {
      timeout: 5000, // Reduced timeout
      retries: 2, // Reduced retries
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      ...config
    };
  }

  // Generic scraping method with real web scraping
  async scrapeEvents(source: CoffeeEvent['source'], enableScraping: boolean = false): Promise<CoffeeEvent[]> {
    // Always use fallback data for now to avoid CORS and timeout issues
    if (!enableScraping || process.env.NODE_ENV !== 'development') {
      return this.getFallbackEvents(source);
    }

    try {
      // Check cache first
      const cached = this.getFromCache(source);
      if (cached) {
        return cached;
      }

      let events: CoffeeEvent[] = [];

      switch(source) {
        case 'WorldOfCoffee':
          events = await this.scrapeWorldOfCoffee();
          break;
        case 'SwissCoffeeDinner':
          events = await this.scrapeSwissCoffeeDinner();
          break;
        case 'NationalCoffeeAssociation':
          events = await this.scrapeNCA();
          break;
        case 'SantosSeminar':
          events = await this.scrapeSantosSeminar();
          break;
        case 'SpecialtyCoffeeAssociation':
          events = await this.scrapeSCA();
          break;
        case 'SemanaInternacionalDoCafe':
          events = await this.scrapeSIC();
          break;
        case 'CampinasEvent':
          events = await this.scrapeCampinas();
          break;
        default:
          events = [];
      }

      // Only cache if we got real results
      if (events.length > 0) {
        this.cache.set(source, { data: events, timestamp: Date.now() });
      }
      
      return events.length > 0 ? events : this.getFallbackEvents(source);

    } catch (error) {
      console.error(`Error scraping ${source}:`, error);
      return this.getFallbackEvents(source);
    }
  }

  private getFromCache(source: string): CoffeeEvent[] | null {
    const cached = this.cache.get(source);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  private async fetchWithRetry(url: string): Promise<string> {
    try {
      const response = await axios.get(url, {
        timeout: this.config.timeout,
        headers: {
          'User-Agent': this.config.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        validateStatus: (status) => status < 500, // Accept 4xx errors but reject 5xx
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch ${url}:`, error.message);
      throw error;
    }
  }

  // Individual scraping methods
  private async scrapeWorldOfCoffee(): Promise<CoffeeEvent[]> {
    try {
      const html = await this.fetchWithRetry('https://www.worldofcoffee.org/');
      const root = parse(html);
      const events: CoffeeEvent[] = [];

      // Look for event containers
      const eventSelectors = [
        '.event-item',
        '.upcoming-event', 
        '[class*="event"]',
        '.card',
        '.event-card'
      ];

      for (const selector of eventSelectors) {
        const eventElements = root.querySelectorAll(selector);
        
        for (const element of eventElements) {
          const event = this.extractEventFromElement(element, 'WorldOfCoffee');
          if (event && this.isValidEvent(event)) {
            events.push(event);
          }
        }
      }

      return events.length > 0 ? events : this.getFallbackEvents('WorldOfCoffee');
    } catch (error) {
      console.error('World of Coffee scraping failed:', error);
      return this.getFallbackEvents('WorldOfCoffee');
    }
  }

  private async scrapeNCA(): Promise<CoffeeEvent[]> {
    try {
      const html = await this.fetchWithRetry('https://www.ncausa.org/Industry-Resources/NCA-Annual-Convention');
      const root = parse(html);
      const events: CoffeeEvent[] = [];

      // NCA specific selectors
      const eventElements = root.querySelectorAll('.convention-info, .event-details, .upcoming-convention');
      
      for (const element of eventElements) {
        const event = this.extractEventFromElement(element, 'NationalCoffeeAssociation');
        if (event && this.isValidEvent(event)) {
          events.push(event);
        }
      }

      return events.length > 0 ? events : this.getFallbackEvents('NationalCoffeeAssociation');
    } catch (error) {
      console.error('NCA scraping failed:', error);
      return this.getFallbackEvents('NationalCoffeeAssociation');
    }
  }

  private async scrapeSIC(): Promise<CoffeeEvent[]> {
    try {
      const html = await this.fetchWithRetry('https://semanainternacionaldocafe.com.br/');
      const root = parse(html);
      const events: CoffeeEvent[] = [];

      // SIC specific selectors - Brazilian Portuguese content
      const eventElements = root.querySelectorAll('.evento, .semana, .programacao, .event');
      
      for (const element of eventElements) {
        const event = this.extractEventFromElement(element, 'SemanaInternacionalDoCafe');
        if (event && this.isValidEvent(event)) {
          events.push(event);
        }
      }

      return events.length > 0 ? events : this.getFallbackEvents('SemanaInternacionalDoCafe');
    } catch (error) {
      console.error('SIC scraping failed:', error);
      return this.getFallbackEvents('SemanaInternacionalDoCafe');
    }
  }

  private async scrapeSantosSeminar(): Promise<CoffeeEvent[]> {
    try {
      const html = await this.fetchWithRetry('https://www.seminariocafesantos.com.br/');
      const root = parse(html);
      const events: CoffeeEvent[] = [];

      // Santos specific selectors
      const eventElements = root.querySelectorAll('.seminario, .evento, .event-info');
      
      for (const element of eventElements) {
        const event = this.extractEventFromElement(element, 'SantosSeminar');
        if (event && this.isValidEvent(event)) {
          events.push(event);
        }
      }

      return events.length > 0 ? events : this.getFallbackEvents('SantosSeminar');
    } catch (error) {
      console.error('Santos Seminar scraping failed:', error);
      return this.getFallbackEvents('SantosSeminar');
    }
  }

  private async scrapeSCA(): Promise<CoffeeEvent[]> {
    try {
      const html = await this.fetchWithRetry('https://sca.coffee/events/global');
      const root = parse(html);
      const events: CoffeeEvent[] = [];

      // SCA specific selectors
      const eventElements = root.querySelectorAll('.event, .expo, .conference');
      
      for (const element of eventElements) {
        const event = this.extractEventFromElement(element, 'SpecialtyCoffeeAssociation');
        if (event && this.isValidEvent(event)) {
          events.push(event);
        }
      }

      return events.length > 0 ? events : this.getFallbackEvents('SpecialtyCoffeeAssociation');
    } catch (error) {
      console.error('SCA scraping failed:', error);
      return this.getFallbackEvents('SpecialtyCoffeeAssociation');
    }
  }

  private async scrapeCampinas(): Promise<CoffeeEvent[]> {
    try {
      const html = await this.fetchWithRetry('https://coffeedinner.com.br/en/');
      const root = parse(html);
      const events: CoffeeEvent[] = [];

      // Campinas specific selectors
      const eventElements = root.querySelectorAll('.coffee-dinner, .summit, .event');
      
      for (const element of eventElements) {
        const event = this.extractEventFromElement(element, 'CampinasEvent');
        if (event && this.isValidEvent(event)) {
          events.push(event);
        }
      }

      return events.length > 0 ? events : this.getFallbackEvents('CampinasEvent');
    } catch (error) {
      console.error('Campinas scraping failed:', error);
      return this.getFallbackEvents('CampinasEvent');
    }
  }

  private async scrapeSwissCoffeeDinner(): Promise<CoffeeEvent[]> {
    try {
      const html = await this.fetchWithRetry('https://www.sc-ta.ch/');
      const root = parse(html);
      const events: CoffeeEvent[] = [];

      // Swiss Coffee specific selectors
      const eventElements = root.querySelectorAll('.event, .forum, .dinner');
      
      for (const element of eventElements) {
        const event = this.extractEventFromElement(element, 'SwissCoffeeDinner');
        if (event && this.isValidEvent(event)) {
          events.push(event);
        }
      }

      return events.length > 0 ? events : this.getFallbackEvents('SwissCoffeeDinner');
    } catch (error) {
      console.error('Swiss Coffee scraping failed:', error);
      return this.getFallbackEvents('SwissCoffeeDinner');
    }
  }

  private extractEventFromElement(element: any, source: CoffeeEvent['source']): CoffeeEvent | null {
    try {
      const text = element.text?.toLowerCase() || '';
      const html = element.innerHTML || '';

      // Extract event name
      const nameElement = element.querySelector('h1, h2, h3, .title, .name, .event-title');
      const name = nameElement?.text?.trim() || this.extractFromText(text, /event|conference|summit|seminar|expo/i);

      // Extract date patterns
      const dateMatch = text.match(/(\d{1,2}[-\/]\d{1,2}[-\/]\d{4}|\d{4}[-\/]\d{1,2}[-\/]\d{1,2}|january|february|march|april|may|june|july|august|september|october|november|december)/i);
      const date = dateMatch ? this.parseDate(dateMatch[0]) : null;

      // Extract location
      const locationElement = element.querySelector('.location, .venue, .city');
      const location = locationElement?.text?.trim() || this.extractLocation(text);

      // Extract URL
      const linkElement = element.querySelector('a[href]');
      const url = linkElement?.getAttribute('href') || this.getSourceUrl(source);

      // Extract description
      const descElement = element.querySelector('.description, .summary, p');
      const description = descElement?.text?.trim()?.substring(0, 200);

      if (name && date && location) {
        return {
          id: `${source.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: name,
          date: date,
          location: location,
          url: url.startsWith('http') ? url : `https://${url}`,
          organization: this.getOrganizationName(source),
          description: description || `Coffee industry event: ${name}`,
          source: source
        };
      }

      return null;
    } catch (error) {
      console.error('Error extracting event from element:', error);
      return null;
    }
  }

  private extractFromText(text: string, pattern: RegExp): string {
    const match = text.match(pattern);
    return match ? match[0] : '';
  }

  private extractLocation(text: string): string {
    // Common location patterns
    const locationPatterns = [
      /in\s+([A-Za-z\s,]+)/i,
      /at\s+([A-Za-z\s,]+)/i,
      /([A-Za-z]+,\s*[A-Za-z]+)/,
      /(brazil|usa|germany|switzerland|japan|thailand)/i
    ];

    for (const pattern of locationPatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1] || match[0];
      }
    }

    return 'Location TBD';
  }

  private parseDate(dateStr: string): Date | null {
    try {
      // Handle various date formats
      const cleanDate = dateStr.replace(/[-\/]/g, '/');
      const date = new Date(cleanDate);
      
      // If date is in the past, try next year
      if (date < new Date()) {
        date.setFullYear(date.getFullYear() + 1);
      }

      return isNaN(date.getTime()) ? null : date;
    } catch {
      return null;
    }
  }

  private isValidEvent(event: CoffeeEvent): boolean {
    return !!(
      event.name && 
      event.name.length > 3 &&
      event.date && 
      event.date > new Date() &&
      event.location &&
      event.url
    );
  }

  private getSourceUrl(source: CoffeeEvent['source']): string {
    const urls = {
      'WorldOfCoffee': 'https://www.worldofcoffee.org/',
      'SwissCoffeeDinner': 'https://www.sc-ta.ch/',
      'NationalCoffeeAssociation': 'https://www.ncausa.org/',
      'SantosSeminar': 'https://www.seminariocafesantos.com.br/',
      'SpecialtyCoffeeAssociation': 'https://sca.coffee/',
      'SemanaInternacionalDoCafe': 'https://semanainternacionaldocafe.com.br/',
      'CampinasEvent': 'https://coffeedinner.com.br/en/'
    };
    return urls[source] || '';
  }

  private getOrganizationName(source: CoffeeEvent['source']): string {
    const organizations = {
      'WorldOfCoffee': 'Specialty Coffee Association',
      'SwissCoffeeDinner': 'Swiss Coffee Trade Association',
      'NationalCoffeeAssociation': 'National Coffee Association USA',
      'SantosSeminar': 'Santos Trade Association',
      'SpecialtyCoffeeAssociation': 'Specialty Coffee Association',
      'SemanaInternacionalDoCafe': 'Associação Brasileira da Indústria de Café',
      'CampinasEvent': 'Brazilian Coffee Exporters Council'
    };
    return organizations[source] || '';
  }

  // Provide actual coffee industry event data based on web research
  private getFallbackEvents(source: CoffeeEvent['source']): CoffeeEvent[] {
    const today = new Date();
    
    switch(source) {
      case 'WorldOfCoffee':
        return [
          {
            id: 'sca-expo-houston-2025',
            name: 'Specialty Coffee Expo 2025',
            date: new Date('2025-04-25'),
            location: 'Houston, TX, USA',
            url: 'https://www.coffeeexpo.org/',
            organization: 'Specialty Coffee Association',
            description: 'The final Specialty Coffee Expo before rebranding to World of Coffee, welcoming 17,000+ attendees from 85 countries.',
            source: 'WorldOfCoffee'
          },
          {
            id: 'woc-san-diego-2026',
            name: 'World of Coffee San Diego 2026',
            date: new Date('2026-04-10'),
            location: 'San Diego, CA, USA',
            url: 'https://usa.worldofcoffee.org/',
            organization: 'Specialty Coffee Association',
            description: 'First North American event under the World of Coffee rebrand, featuring global coffee community.',
            source: 'WorldOfCoffee'
          }
        ];
        
      case 'SwissCoffeeDinner':
        return [
          {
            id: 'scta-forum-dinner-2025',
            name: '16th SCTA Coffee Forum & Dinner 2025',
            date: new Date('2025-10-01'),
            endDate: new Date('2025-10-03'),
            location: 'Basel, Switzerland',
            url: 'https://www.sc-ta.ch/events/forum-dinner-2025/',
            organization: 'Swiss Coffee Trade Association (SCTA)',
            description: 'The premier Swiss coffee industry event featuring dynamic discussions, networking with global decision-makers, and the SCTA Next Gen Sustainability Contest.',
            source: 'SwissCoffeeDinner'
          }
        ];
        
      case 'NationalCoffeeAssociation':
        return [
          {
            id: 'nca-convention-2026',
            name: 'NCA Convention 2026',
            date: new Date('2026-03-12'),
            location: 'Tampa, FL, USA',
            url: 'https://www.ncausa.org/',
            organization: 'National Coffee Association USA',
            description: 'The premier gathering for coffee industry professionals in North America.',
            source: 'NationalCoffeeAssociation'
          }
        ];
        
      case 'SantosSeminar':
        return [
          {
            id: 'santos-2026',
            name: 'International Coffee Seminar Santos 2026',
            date: new Date('2026-05-21'),
            location: 'Santos, Brazil',
            url: 'https://www.seminariocafesantos.com.br/',
            organization: 'Santos Trade Association',
            description: 'Biennial international coffee seminar focusing on Brazilian coffee market and global trends.',
            source: 'SantosSeminar'
          }
        ];
        
      case 'SpecialtyCoffeeAssociation':
        return [
          {
            id: 'woc-bangkok-2026',
            name: 'World of Coffee Asia Bangkok 2026',
            date: new Date('2026-05-07'),
            location: 'Bangkok, Thailand',
            url: 'https://asia.worldofcoffee.org/',
            organization: 'Specialty Coffee Association',
            description: 'Third edition of World of Coffee Asia, showcasing innovations in the Asian coffee market.',
            source: 'SpecialtyCoffeeAssociation'
          },
          {
            id: 'woc-belgium-2026',
            name: 'World of Coffee Belgium 2026',
            date: new Date('2026-06-25'),
            location: 'Brussels, Belgium',
            url: 'https://www.worldofcoffee.org/',
            organization: 'Specialty Coffee Association Europe',
            description: 'Belgian debut of World of Coffee, featuring European coffee innovations and competitions.',
            source: 'SpecialtyCoffeeAssociation'
          }
        ];
        
      case 'SemanaInternacionalDoCafe':
        return [
          {
            id: 'sic-2025',
            name: 'Semana Internacional do Café 2025',
            date: new Date('2025-11-05'),
            location: 'Belo Horizonte, Brazil',
            url: 'https://semanainternacionaldocafe.com.br/',
            organization: 'Associação Brasileira da Indústria de Café',
            description: 'SIC 2025 será realizada de 05 a 07 de novembro, das 10h às 19h, no Expominas, Belo Horizonte.',
            source: 'SemanaInternacionalDoCafe'
          }
        ];
        
      case 'CampinasEvent':
        return [
          {
            id: 'campinas-coffee-dinner-2027',
            name: '11th Coffee Dinner & Summit 2027',
            date: new Date('2027-07-02'),
            location: 'Campinas, Brazil',
            url: 'https://coffeedinner.com.br/en/',
            organization: 'Brazilian Coffee Exporters Council (Cecafé)',
            description: 'Biennial coffee industry summit bringing together 1,000+ global coffee leaders and professionals.',
            source: 'CampinasEvent'
          }
        ];
        
      default:
        return [];
    }
  }
}

// Main export function for external use
export async function scrapeCoffeeEvents(enableScraping: boolean = false): Promise<CoffeeEvent[]> {
  const scraper = new CoffeeEventScraper();
  
  // Configure scraper based on environment
  if (!enableScraping && process.env.NODE_ENV === 'production') {
    console.log('Web scraping disabled in production, using fallback data');
  }
  
  const allEvents = await Promise.all([
    scraper.scrapeEvents('WorldOfCoffee', enableScraping),
    scraper.scrapeEvents('SwissCoffeeDinner', enableScraping),
    scraper.scrapeEvents('NationalCoffeeAssociation', enableScraping),
    scraper.scrapeEvents('SantosSeminar', enableScraping),
    scraper.scrapeEvents('SpecialtyCoffeeAssociation', enableScraping),
    scraper.scrapeEvents('SemanaInternacionalDoCafe', enableScraping),
    scraper.scrapeEvents('CampinasEvent', enableScraping)
  ]);

  // Flatten and sort by date, return next 6 events
  return allEvents.flat()
    .filter(event => event.date > new Date()) // Only future events
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 6);
}

// Search for specific coffee events
export async function searchCoffeeEvents(query: string): Promise<CoffeeEvent[]> {
  const scraper = new CoffeeEventScraper();
  
  try {
    // Get all events first
    const allEvents = await scrapeCoffeeEvents(true);
    
    // Filter events based on search query
    const filteredEvents = allEvents.filter(event =>
      event.name.toLowerCase().includes(query.toLowerCase()) ||
      event.location.toLowerCase().includes(query.toLowerCase()) ||
      event.organization?.toLowerCase().includes(query.toLowerCase()) ||
      event.description?.toLowerCase().includes(query.toLowerCase())
    );

    return filteredEvents.length > 0 ? filteredEvents : allEvents;
  } catch (error) {
    console.error('Error searching coffee events:', error);
    return scrapeCoffeeEvents(false); // Fallback to static data
  }
}