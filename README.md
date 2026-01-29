# Booking.com Full Scraper with n8n Integration

A comprehensive, production-ready Booking.com hotel scraper that extracts hotel data including **applied discounts**, prices, ratings, and distance from center. Built with Playwright for reliable browser automation and Express API for seamless n8n integration.

## ✨ Features

- 🏨 **Search by City Name** or **Property URL**
- 💰 **Captures Applied Discounts** - Shows original and discounted prices
- 📊 **Multiple Sorting Options** - Sort by price, distance, or rating
- 🔍 **Advanced Filtering** - Filter by price range, rating, distance, discount availability
- 🚀 **RESTful API** - Easy integration with n8n and other automation tools
- 🐳 **Docker Support** - Deploy anywhere with Docker
- 💵 **100% Free** - No API costs, uses browser automation
- 📝 **JSON Export** - Save results for later processing

## 🚀 Quick Start

### Option 1: Local Installation

1. **Install Dependencies**
```bash
npm install
npm run install-browser
```

2. **Start the API Server**
```bash
npm start
```

The server will be running at `http://localhost:3000`

### Option 2: Docker Deployment

```bash
docker-compose up -d
```

## 📖 API Endpoints

### Health Check
```
GET /health
```

### Search Hotels by City
```
POST /api/scrape/city
```

**Request Body:**
```json
{
  "city": "New York",
  "checkIn": "2025-02-15",
  "checkOut": "2025-02-17",
  "adults": 2,
  "sortBy": "price",
  "order": "asc",
  "filters": {
    "maxPrice": 200,
    "minRating": 8.0,
    "maxDistance": 5,
    "onlyWithDiscount": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "query": {
    "city": "New York",
    "checkIn": "2025-02-15",
    "checkOut": "2025-02-17",
    "adults": 2,
    "sortBy": "price",
    "order": "asc"
  },
  "count": 25,
  "hotels": [
    {
      "name": "Hotel Example",
      "url": "https://www.booking.com/hotel/...",
      "price": "$150",
      "priceNumeric": 150,
      "originalPrice": "$200",
      "hasDiscount": true,
      "rating": "8.5",
      "reviewCount": "1,234",
      "distanceFromCenter": "0.5 km from center",
      "distanceNumeric": 0.5,
      "address": "123 Main St, New York",
      "image": "https://..."
    }
  ]
}
```

### Search by Property URL
```
POST /api/scrape/property
```

**Request Body:**
```json
{
  "url": "https://www.booking.com/searchresults.html?ss=Paris",
  "sortBy": "distance",
  "order": "asc",
  "filters": {
    "onlyWithDiscount": true
  }
}
```

## 🎯 Sorting Options

- `price` - Sort by hotel price (default)
- `distance` - Sort by distance from city center
- `rating` - Sort by guest rating

**Order:** `asc` (ascending) or `desc` (descending)

## 🔍 Filter Options

```javascript
{
  "minPrice": 50,           // Minimum price per night
  "maxPrice": 200,          // Maximum price per night
  "maxDistance": 5,         // Maximum distance from center (km)
  "minRating": 8.0,         // Minimum guest rating (0-10)
  "onlyWithDiscount": true  // Only show hotels with active discounts
}
```

## 🔗 n8n Integration Guide

### Method 1: HTTP Request Node (Recommended)

1. Add an **HTTP Request** node to your workflow
2. Configure the node:
   - **Method:** POST
   - **URL:** `http://localhost:3000/api/scrape/city`
   - **Body Content Type:** JSON
   - **Body:**
   ```json
   {
     "city": "{{$json.city}}",
     "checkIn": "{{$json.checkIn}}",
     "checkOut": "{{$json.checkOut}}",
     "sortBy": "price",
     "order": "asc",
     "filters": {
       "onlyWithDiscount": true
     }
   }
   ```

3. The response will contain all hotel data in `{{$json.hotels}}`

### Method 2: Split Into Individual Hotels

Add a **Split In Batches** node after the HTTP Request:
- **Batch Size:** 1
- **Field Name:** `hotels`

This allows you to process each hotel individually in subsequent nodes.

### Example n8n Workflow

```
[Webhook/Manual Trigger] 
    → [Set City & Dates] 
    → [HTTP Request to Scraper API] 
    → [Split In Batches] 
    → [Filter Best Deals] 
    → [Send to Slack/Email/Google Sheets]
```

### Sample n8n Workflow JSON

```json
{
  "nodes": [
    {
      "name": "Manual Trigger",
      "type": "n8n-nodes-base.manualTrigger",
      "position": [240, 300]
    },
    {
      "name": "Set Search Parameters",
      "type": "n8n-nodes-base.set",
      "parameters": {
        "values": {
          "string": [
            {
              "name": "city",
              "value": "Paris"
            },
            {
              "name": "checkIn",
              "value": "2025-03-01"
            },
            {
              "name": "checkOut",
              "value": "2025-03-03"
            }
          ]
        }
      },
      "position": [440, 300]
    },
    {
      "name": "Scrape Booking.com",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "POST",
        "url": "http://localhost:3000/api/scrape/city",
        "options": {
          "bodyContentType": "json"
        },
        "bodyParametersJson": "={\"city\": \"{{$json.city}}\", \"checkIn\": \"{{$json.checkIn}}\", \"checkOut\": \"{{$json.checkOut}}\", \"sortBy\": \"price\", \"order\": \"asc\", \"filters\": {\"onlyWithDiscount\": true}}"
      },
      "position": [640, 300]
    }
  ]
}
```

## 🎬 Command Line Usage

You can also use the scraper directly from the command line:

```bash
# Basic search
node scraper.js "New York"

# Sort by price (ascending)
node scraper.js "Paris" --sort=price --order=asc

# Sort by distance from center
node scraper.js "London" --sort=distance --order=asc

# Only hotels with discounts
node scraper.js "Barcelona" --discount-only

# Combine options
node scraper.js "Rome" --sort=price --order=asc --discount-only
```

Results are saved to `booking-results.json`

## 💾 Data Fields Captured

Each hotel includes:

- `name` - Hotel name
- `url` - Direct link to hotel page
- `price` - Current price (as displayed)
- `priceNumeric` - Numeric price for sorting
- `originalPrice` - Original price if discounted
- `hasDiscount` - Boolean indicating if discount is active
- `rating` - Guest rating (0-10)
- `reviewCount` - Number of reviews
- `distanceFromCenter` - Distance text
- `distanceNumeric` - Distance in km for sorting
- `address` - Hotel address/location
- `image` - Main hotel image URL

## 🚀 Deployment Options

### Deploy on Railway (Free tier available)
1. Fork this repository
2. Connect to Railway
3. Deploy - Railway will auto-detect the Dockerfile
4. Use the provided URL in n8n

### Deploy on Render (Free tier available)
1. Create new Web Service
2. Connect your repository
3. Use Docker deployment
4. Free tier includes 750 hours/month

### Deploy on Your Own Server
```bash
git clone <your-repo>
cd booking-scraper
docker-compose up -d
```

## ⚙️ Configuration

### Environment Variables

- `PORT` - API server port (default: 3000)
- `NODE_ENV` - Environment (development/production)

### Browser Options

Edit `scraper.js` to customize:
```javascript
const scraper = new BookingScraper({
  headless: true,    // Run browser in background
  timeout: 30000     // Timeout in milliseconds
});
```

## 🛠️ Advanced Usage

### Use as a Module

```javascript
const BookingScraper = require('./scraper');

(async () => {
  const scraper = new BookingScraper();
  await scraper.init();
  
  // Search for hotels
  let hotels = await scraper.searchCity('Tokyo');
  
  // Filter hotels with discounts under $150
  hotels = scraper.filterHotels(hotels, {
    maxPrice: 150,
    onlyWithDiscount: true
  });
  
  // Sort by rating
  hotels = scraper.sortHotels(hotels, 'rating', 'desc');
  
  console.log(hotels);
  
  await scraper.close();
})();
```

## 📊 Example Use Cases with n8n

### 1. Daily Hotel Deal Alerts
- Schedule workflow to run daily
- Scrape hotels with discounts
- Filter best deals
- Send email/Slack notification

### 2. Price Monitoring
- Check specific hotel prices daily
- Compare with historical data
- Alert when price drops below threshold

### 3. Travel Planning Assistant
- User submits city and dates via webhook
- Scrape available hotels
- Filter by budget and preferences
- Return personalized recommendations

### 4. Competitor Analysis
- Track competitor hotel prices
- Monitor discount patterns
- Export to Google Sheets for analysis

## 🐛 Troubleshooting

### Scraper timing out
- Increase timeout in `scraper.js`: `timeout: 60000`
- Check your internet connection
- Booking.com might be slow - retry

### Bot detection
- Use residential proxy (requires modification)
- Add random delays between requests
- Don't make too many requests in short time

### Missing data
- Some hotels might not have all fields
- Script handles missing data gracefully
- Check if Booking.com changed their HTML structure

## 📝 Notes

- **Rate Limiting:** Be respectful - don't make too many requests
- **Legal:** For personal/research use only - check Booking.com's ToS
- **Maintenance:** Booking.com may update their website, requiring selector updates
- **Accuracy:** Prices and availability are scraped in real-time but may change

## 🤝 Contributing

Contributions welcome! Areas for improvement:
- Add more filter options
- Support for additional Booking.com features (amenities, meal plans)
- Proxy rotation support
- Caching layer
- Rate limiting

## 📄 License

MIT License - Use freely for personal and commercial projects

## 🔗 Resources

- [n8n Documentation](https://docs.n8n.io/)
- [Playwright Documentation](https://playwright.dev/)
- [Express.js Documentation](https://expressjs.com/)

---

**Made with ❤️ for automated travel planning**
