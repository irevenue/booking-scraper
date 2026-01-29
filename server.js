const express = require('express');
const BookingScraper = require('./scraper');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Search by city endpoint
app.post('/api/scrape/city', async (req, res) => {
  let scraper = null;
  
  try {
    const { 
      city, 
      checkIn, 
      checkOut, 
      adults = 2,
      sortBy = 'price',
      order = 'asc',
      filters = {}
    } = req.body;
    
    if (!city) {
      return res.status(400).json({ 
        error: 'City parameter is required',
        example: {
          city: "New York",
          checkIn: "2025-02-15",
          checkOut: "2025-02-17",
          adults: 2,
          sortBy: "price",
          order: "asc",
          filters: {
            maxPrice: 200,
            minRating: 8.0,
            onlyWithDiscount: true
          }
        }
      });
    }
    
    scraper = new BookingScraper({ headless: true });
    await scraper.init();
    
    // Parse dates if provided
    const checkInDate = checkIn ? new Date(checkIn) : null;
    const checkOutDate = checkOut ? new Date(checkOut) : null;
    
    // Search for hotels
    let hotels = await scraper.searchCity(city, checkInDate, checkOutDate, adults);
    
    // Apply filters
    if (Object.keys(filters).length > 0) {
      hotels = scraper.filterHotels(hotels, filters);
    }
    
    // Sort results
    hotels = scraper.sortHotels(hotels, sortBy, order);
    
    res.json({
      success: true,
      query: { city, checkIn, checkOut, adults, sortBy, order },
      count: hotels.length,
      hotels
    });
    
  } catch (error) {
    console.error('Error in /api/scrape/city:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  } finally {
    if (scraper) {
      await scraper.close();
    }
  }
});

// Search by property URL endpoint
app.post('/api/scrape/property', async (req, res) => {
  let scraper = null;
  
  try {
    const { 
      url,
      sortBy = 'price',
      order = 'asc',
      filters = {}
    } = req.body;
    
    if (!url) {
      return res.status(400).json({ 
        error: 'URL parameter is required',
        example: {
          url: "https://www.booking.com/searchresults.html?ss=New+York",
          sortBy: "price",
          order: "asc"
        }
      });
    }
    
    scraper = new BookingScraper({ headless: true });
    await scraper.init();
    
    // Scrape property URL
    let hotels = await scraper.scrapePropertyUrl(url);
    
    // Apply filters
    if (Object.keys(filters).length > 0) {
      hotels = scraper.filterHotels(hotels, filters);
    }
    
    // Sort results
    hotels = scraper.sortHotels(hotels, sortBy, order);
    
    res.json({
      success: true,
      query: { url, sortBy, order },
      count: hotels.length,
      hotels
    });
    
  } catch (error) {
    console.error('Error in /api/scrape/property:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  } finally {
    if (scraper) {
      await scraper.close();
    }
  }
});

// API documentation endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Booking.com Scraper API',
    version: '1.0.0',
    endpoints: {
      'GET /health': 'Health check',
      'POST /api/scrape/city': 'Search hotels by city name',
      'POST /api/scrape/property': 'Scrape hotels from Booking.com URL'
    },
    examples: {
      searchCity: {
        endpoint: '/api/scrape/city',
        method: 'POST',
        body: {
          city: 'New York',
          checkIn: '2025-02-15',
          checkOut: '2025-02-17',
          adults: 2,
          sortBy: 'price',
          order: 'asc',
          filters: {
            maxPrice: 200,
            minRating: 8.0,
            maxDistance: 5,
            onlyWithDiscount: true
          }
        }
      },
      searchByUrl: {
        endpoint: '/api/scrape/property',
        method: 'POST',
        body: {
          url: 'https://www.booking.com/searchresults.html?ss=Paris',
          sortBy: 'distance',
          order: 'asc'
        }
      }
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Booking.com Scraper API running on http://localhost:${PORT}`);
  console.log(`📖 Documentation: http://localhost:${PORT}/`);
  console.log(`❤️  Health check: http://localhost:${PORT}/health`);
});
