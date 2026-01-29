const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();

chromium.use(stealth);

class BookingScraper {
  constructor(options = {}) {
    this.headless = options.headless !== false;
    this.timeout = options.timeout || 30000;
    this.browser = null;
    this.page = null;
  }

  async init() {
    this.browser = await chromium.launch({
      headless: this.headless,
      args: ['--disable-blink-features=AutomationControlled']
    });

    // 1. Define your human-like User Agents
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
    ];
    const selectedAgent = userAgents[Math.floor(Math.random() * userAgents.length)];

    // 2. APPLY when creating the context (This is the Playwright way)
    const context = await this.browser.newContext({
      userAgent: selectedAgent,
      viewport: { width: 1920, height: 1080 }
    });

    this.page = await context.newPage();
  }

  async searchCity(city, checkIn = null, checkOut = null, adults = 2) {
    try {
      // Calculate dates if not provided (7 days from now for 2 nights)
      const today = new Date();
      if (!checkIn) {
        checkIn = new Date(today);
        checkIn.setDate(today.getDate() + 7);
      }
      if (!checkOut) {
        checkOut = new Date(checkIn);
        checkOut.setDate(checkIn.getDate() + 2);
      }

      const checkInStr = this.formatDate(checkIn);
      const checkOutStr = this.formatDate(checkOut);

      console.log(`Searching for hotels in ${city}...`);
      console.log(`Check-in: ${checkInStr}, Check-out: ${checkOutStr}, Adults: ${adults}`);

      // Build search URL
      const searchUrl = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(city)}&checkin=${checkInStr}&checkout=${checkOutStr}&group_adults=${adults}&no_rooms=1&group_children=0`;

      // 1. Navigate with a more relaxed wait condition
      await this.page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

      // 2. Check if we got blocked by a Captcha
      const content = await this.page.content();
      if (content.includes("Press and hold") || content.includes("captcha")) {
        throw new Error("BLOCKED_BY_CAPTCHA");
      }

      // Handle cookie consent if present
      await this.handleCookieConsent();

      // Wait a bit for dynamic content
      await this.page.waitForTimeout(3000);

      // 3. Wait for the hotel cards, but don't crash if they are missing
      try {
        // Booking.com main selector
        await this.page.waitForSelector('[data-testid="property-card"]', { timeout: 15000 });
      } catch (e) {
        console.log("No hotels found on this page.");
        return []; // Return empty array instead of throwing an error
      }

      // Extract hotel data
      const hotels = await this.extractHotels();

      console.log(`Found ${hotels.length} hotels`);
      return hotels;

    } catch (error) {
      console.error('Error searching city:', error.message);
      throw error;
    }
  }

  async scrapePropertyUrl(propertyUrl) {
    try {
      console.log(`Scraping property: ${propertyUrl}`);

      // 1. Navigate with a more relaxed wait condition
      await this.page.goto(propertyUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

      // 2. Check if we got blocked by a Captcha
      const content = await this.page.content();
      if (content.includes("Press and hold") || content.includes("captcha")) {
        throw new Error("BLOCKED_BY_CAPTCHA");
      }

      // Handle cookie consent if present
      await this.handleCookieConsent();

      // 3. Wait for the hotel cards, but don't crash if they are missing
      try {
        await this.page.waitForSelector('[data-testid="property-card"]', { timeout: 15000 });
      } catch (e) {
        console.log("No property details found on this page.");
        return []; // Return empty array instead of throwing an error
      }

      // Extract hotel data
      const hotels = await this.extractHotels();

      return hotels;

    } catch (error) {
      console.error('Error scraping property URL:', error.message);
      throw error;
    }
  }

  async handleCookieConsent() {
    try {
      // Try to find and click the accept button
      const acceptButton = await this.page.$('button[id*="accept"]');
      if (acceptButton) {
        await acceptButton.click();
        await this.page.waitForTimeout(1000);
      }
    } catch (error) {
      // Ignore if cookie consent not found
    }
  }

  async extractHotels() {
    return await this.page.evaluate(() => {
      const hotels = [];

      // Try multiple selectors for property cards
      let propertyCards = document.querySelectorAll('[data-testid="property-card"]');
      if (propertyCards.length === 0) {
        propertyCards = document.querySelectorAll('[data-testid="property-card-container"]');
      }
      if (propertyCards.length === 0) {
        propertyCards = document.querySelectorAll('.sr_property_block');
      }

      propertyCards.forEach((card) => {
        try {
          const hotel = {};

          // Name - try multiple selectors
          let nameEl = card.querySelector('[data-testid="title"]');
          if (!nameEl) nameEl = card.querySelector('h3');
          if (!nameEl) nameEl = card.querySelector('.sr-hotel__name');
          hotel.name = nameEl ? nameEl.textContent.trim() : 'N/A';

          // Link
          let linkEl = card.querySelector('a[data-testid="title-link"]');
          if (!linkEl) linkEl = card.querySelector('a[href*="/hotel/"]');
          if (linkEl && linkEl.getAttribute('href')) {
            const href = linkEl.getAttribute('href');
            hotel.url = href.startsWith('http') ? href : 'https://www.booking.com' + href;
          } else {
            hotel.url = 'N/A';
          }

          // Price - try multiple selectors
          let priceEl = card.querySelector('[data-testid="price-and-discounted-price"]');
          if (!priceEl) priceEl = card.querySelector('[data-testid="price"]');
          if (!priceEl) priceEl = card.querySelector('.prco-valign-middle-helper');

          if (priceEl) {
            const priceText = priceEl.textContent.trim();
            hotel.price = priceText;
            // Extract numeric value for sorting
            const priceMatch = priceText.match(/[\d,]+/);
            hotel.priceNumeric = priceMatch ? parseFloat(priceMatch[0].replace(/,/g, '')) : 0;
          } else {
            hotel.price = 'N/A';
            hotel.priceNumeric = 0;
          }

          // Discount
          const discountEl = card.querySelector('[data-testid="price-and-discounted-price"] span[style*="text-decoration"]');
          if (discountEl) {
            hotel.originalPrice = discountEl.textContent.trim();
            hotel.hasDiscount = true;
          } else {
            hotel.originalPrice = null;
            hotel.hasDiscount = false;
          }

          // Rating
          let ratingEl = card.querySelector('[data-testid="review-score"] div[aria-label*="Scored"]');
          if (!ratingEl) ratingEl = card.querySelector('.bui-review-score__badge');
          hotel.rating = ratingEl ? ratingEl.textContent.trim() : 'N/A';

          // Number of reviews
          let reviewsEl = card.querySelector('[data-testid="review-score"] div:nth-child(2)');
          if (!reviewsEl) reviewsEl = card.querySelector('.bui-review-score__text');
          if (reviewsEl) {
            const reviewText = reviewsEl.textContent.trim();
            const reviewMatch = reviewText.match(/([\d,]+)/);
            hotel.reviewCount = reviewMatch ? reviewMatch[1] : 'N/A';
          } else {
            hotel.reviewCount = 'N/A';
          }

          // Distance from center
          let distanceEl = card.querySelector('[data-testid="distance"]');
          if (!distanceEl) distanceEl = card.querySelector('.sr_card_address_line');
          if (distanceEl) {
            const distanceText = distanceEl.textContent.trim();
            hotel.distanceFromCenter = distanceText;
            // Extract numeric value for sorting
            const distMatch = distanceText.match(/[\d.]+/);
            hotel.distanceNumeric = distMatch ? parseFloat(distMatch[0]) : 999;
          } else {
            hotel.distanceFromCenter = 'N/A';
            hotel.distanceNumeric = 999;
          }

          // Address/Location
          let addressEl = card.querySelector('[data-testid="address"]');
          if (!addressEl) addressEl = card.querySelector('.sr_card_address');
          hotel.address = addressEl ? addressEl.textContent.trim() : 'N/A';

          // Image
          let imageEl = card.querySelector('img[data-testid="image"]');
          if (!imageEl) imageEl = card.querySelector('img');
          hotel.image = imageEl ? (imageEl.getAttribute('src') || imageEl.getAttribute('data-src') || 'N/A') : 'N/A';

          // Only add if we got at least a name
          if (hotel.name !== 'N/A') {
            hotels.push(hotel);
          }
        } catch (error) {
          console.error('Error extracting hotel data:', error);
        }
      });

      return hotels;
    });
  }

  sortHotels(hotels, sortBy = 'price', order = 'asc') {
    const sorted = [...hotels];

    sorted.sort((a, b) => {
      let valueA, valueB;

      switch (sortBy) {
        case 'price':
          valueA = a.priceNumeric;
          valueB = b.priceNumeric;
          break;
        case 'distance':
          valueA = a.distanceNumeric;
          valueB = b.distanceNumeric;
          break;
        case 'rating':
          valueA = parseFloat(a.rating) || 0;
          valueB = parseFloat(b.rating) || 0;
          break;
        default:
          return 0;
      }

      if (order === 'asc') {
        return valueA - valueB;
      } else {
        return valueB - valueA;
      }
    });

    return sorted;
  }

  filterHotels(hotels, filters = {}) {
    let filtered = [...hotels];

    if (filters.minPrice !== undefined) {
      filtered = filtered.filter(h => h.priceNumeric >= filters.minPrice);
    }

    if (filters.maxPrice !== undefined) {
      filtered = filtered.filter(h => h.priceNumeric <= filters.maxPrice);
    }

    if (filters.maxDistance !== undefined) {
      filtered = filtered.filter(h => h.distanceNumeric <= filters.maxDistance);
    }

    if (filters.minRating !== undefined) {
      filtered = filtered.filter(h => parseFloat(h.rating) >= filters.minRating);
    }

    if (filters.onlyWithDiscount === true) {
      filtered = filtered.filter(h => h.hasDiscount);
    }

    return filtered;
  }

  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Export for use as module
module.exports = BookingScraper;

// CLI usage
if (require.main === module) {
  (async () => {
    const args = process.argv.slice(2);

    if (args.length === 0) {
      console.log('Usage: node scraper.js <city> [--sort=price|distance|rating] [--order=asc|desc] [--discount-only]');
      console.log('Example: node scraper.js "New York" --sort=price --order=asc --discount-only');
      process.exit(1);
    }

    const city = args[0];
    const sortBy = args.find(a => a.startsWith('--sort='))?.split('=')[1] || 'price';
    const order = args.find(a => a.startsWith('--order='))?.split('=')[1] || 'asc';
    const discountOnly = args.includes('--discount-only');

    const scraper = new BookingScraper({ headless: true });

    try {
      await scraper.init();
      let hotels = await scraper.searchCity(city);

      if (discountOnly) {
        hotels = scraper.filterHotels(hotels, { onlyWithDiscount: true });
      }

      hotels = scraper.sortHotels(hotels, sortBy, order);

      console.log('\n' + '='.repeat(80));
      console.log(`Found ${hotels.length} hotels in ${city}`);
      console.log('='.repeat(80) + '\n');

      hotels.forEach((hotel, index) => {
        console.log(`${index + 1}. ${hotel.name}`);
        console.log(`   Price: ${hotel.price}${hotel.hasDiscount ? ` (Original: ${hotel.originalPrice})` : ''}`);
        console.log(`   Rating: ${hotel.rating} (${hotel.reviewCount} reviews)`);
        console.log(`   Distance: ${hotel.distanceFromCenter}`);
        console.log(`   Address: ${hotel.address}`);
        console.log(`   URL: ${hotel.url}`);
        console.log('');
      });

      // Save to JSON
      const fs = require('fs');
      fs.writeFileSync('booking-results.json', JSON.stringify(hotels, null, 2));
      console.log('Results saved to booking-results.json');

    } catch (error) {
      console.error('Error:', error);
    } finally {
      await scraper.close();
    }
  })();
}
