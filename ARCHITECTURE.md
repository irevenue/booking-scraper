# System Architecture - Booking.com Scraper

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         n8n Workflow                         │
│  (Trigger → Set Params → HTTP Request → Process → Output)   │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP POST
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Express API Server                        │
│  - /api/scrape/city (Search by city name)                   │
│  - /api/scrape/property (Search by URL)                     │
│  - /health (Health check)                                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   BookingScraper Class                       │
│  - Browser initialization                                    │
│  - Search & navigation logic                                │
│  - Data extraction                                           │
│  - Filtering & sorting                                       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Playwright Browser                          │
│  - Chromium automation                                       │
│  - Page navigation                                           │
│  - DOM interaction                                           │
│  - Screenshot capability                                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      Booking.com                             │
│  - Hotel search results                                      │
│  - Property listings                                         │
│  - Price & discount data                                     │
└─────────────────────────────────────────────────────────────┘
```

## 📦 Component Breakdown

### 1. Express API Server (server.js)
**Purpose:** RESTful API interface for external integrations

**Endpoints:**
- `POST /api/scrape/city` - Search hotels by city
- `POST /api/scrape/property` - Scrape specific URL
- `GET /health` - Service health check
- `GET /` - API documentation

**Features:**
- Request validation
- Error handling
- JSON response formatting
- Automatic browser lifecycle management

### 2. BookingScraper Class (scraper.js)
**Purpose:** Core scraping logic and data processing

**Key Methods:**
- `init()` - Initialize browser with anti-detection
- `searchCity()` - Search by city name and dates
- `scrapePropertyUrl()` - Scrape specific URLs
- `extractHotels()` - Parse HTML and extract data
- `sortHotels()` - Sort results by criteria
- `filterHotels()` - Apply filters to results
- `handleCookieConsent()` - Auto-dismiss cookie popups

**Features:**
- Realistic user agent
- Cookie consent handling
- Robust error handling
- Data normalization
- Multiple sorting options

### 3. Data Extraction Pipeline

```
Page Load → Cookie Consent → Wait for Results → Extract Data → Parse & Normalize → Filter → Sort → Return JSON
```

**Extracted Fields:**
- name (string)
- url (string)
- price (string, display)
- priceNumeric (number, for sorting)
- originalPrice (string, if discounted)
- hasDiscount (boolean)
- rating (string)
- reviewCount (string)
- distanceFromCenter (string, display)
- distanceNumeric (number, for sorting)
- address (string)
- image (string, URL)

## 🔄 Data Flow

### Search by City Flow
```
User Request
    ↓
API Endpoint receives: {city, checkIn, checkOut, adults, filters, sortBy}
    ↓
Initialize Browser
    ↓
Build Search URL with parameters
    ↓
Navigate to Booking.com
    ↓
Handle Cookie Consent
    ↓
Wait for Property Cards to Load
    ↓
Extract Data from DOM (evaluate in browser context)
    ↓
Apply Filters (price, rating, distance, discount)
    ↓
Sort Results (price/distance/rating, asc/desc)
    ↓
Close Browser
    ↓
Return JSON Response
```

### Search by URL Flow
```
User Request
    ↓
API Endpoint receives: {url, filters, sortBy}
    ↓
Initialize Browser
    ↓
Navigate to Provided URL
    ↓
[Same extraction, filtering, sorting flow as above]
    ↓
Return JSON Response
```

## 🛡️ Anti-Detection Features

1. **Realistic User Agent**
   - Windows 10, Chrome 120
   - Desktop viewport (1920x1080)

2. **Human-like Behavior**
   - Waits for network idle
   - Cookie consent handling
   - No rapid-fire requests

3. **Browser Configuration**
   - Disabled automation flags
   - Standard browser profile
   - No headless detection patterns

## 🎯 Filtering System

**Filter Types:**
- Price Range (minPrice, maxPrice)
- Distance (maxDistance from center)
- Rating (minRating)
- Discount Status (onlyWithDiscount)

**Filter Logic:**
```javascript
filters = {
  minPrice: 50,        // >= 50
  maxPrice: 200,       // <= 200
  maxDistance: 5,      // <= 5 km
  minRating: 8.0,      // >= 8.0
  onlyWithDiscount: true  // hasDiscount === true
}
```

## 🔢 Sorting System

**Sort Criteria:**
1. **Price** - Uses `priceNumeric` field
2. **Distance** - Uses `distanceNumeric` field (km from center)
3. **Rating** - Uses parsed rating value

**Sort Orders:**
- `asc` - Ascending (low to high)
- `desc` - Descending (high to low)

## 🚀 Deployment Options

### Option 1: Local Development
```
npm install → npm run install-browser → npm start
```
- Best for: Development, testing
- Cost: FREE
- Requires: Node.js 16+

### Option 2: Docker Container
```
docker-compose up -d
```
- Best for: Production, consistent environments
- Cost: FREE (self-hosted)
- Requires: Docker

### Option 3: Cloud Platforms

**Railway.app**
- Auto-deploys from Git
- Free tier: 500 hours/month
- Persistent storage
- HTTPS included

**Render.com**
- Free tier: 750 hours/month
- Auto-sleep when inactive
- Build from Dockerfile
- HTTPS included

**Your Own VPS**
- Full control
- Any Linux server
- Deploy with Docker
- Reverse proxy with Nginx

## 🔌 n8n Integration Patterns

### Pattern 1: Simple Search
```
Trigger → HTTP Request → Done
```

### Pattern 2: Filter & Process
```
Trigger → HTTP Request → Split In Batches → Filter → Output
```

### Pattern 3: Multi-City Comparison
```
Trigger → Loop Cities → HTTP Request Each → Merge → Compare → Output
```

### Pattern 4: Price Monitoring
```
Schedule → HTTP Request → Compare with Previous → If Changed → Alert
```

### Pattern 5: Travel Planning
```
Webhook → Parse Dates → HTTP Request → Filter Budget → Send Email
```

## 📊 Performance Metrics

**Typical Response Times:**
- Browser initialization: 2-3 seconds
- Page load: 3-5 seconds
- Data extraction: 1-2 seconds
- Total: 6-10 seconds per request

**Resource Usage:**
- Memory: ~200-300 MB per browser instance
- CPU: Low (mostly I/O bound)
- Network: Depends on page size

**Scalability:**
- Single instance: 1 request at a time
- Multiple instances: Deploy multiple containers
- Queue system: Add Redis + Bull for job queue

## 🔐 Security Considerations

1. **Rate Limiting**
   - Implement in production
   - Prevent abuse
   - Respect Booking.com servers

2. **Input Validation**
   - Sanitize city names
   - Validate dates
   - Check URL formats

3. **Error Handling**
   - Graceful failures
   - Informative error messages
   - No sensitive data leaks

4. **CORS**
   - Configure for n8n integration
   - Whitelist allowed origins
   - Secure API access

## 🔮 Future Enhancements

### Planned Features
- [ ] Caching layer (Redis)
- [ ] Rate limiting per client
- [ ] Webhook notifications
- [ ] Batch processing
- [ ] Multiple cities in one request
- [ ] Historical price tracking
- [ ] PDF report generation
- [ ] Email digest subscriptions

### Advanced Features
- [ ] Proxy rotation support
- [ ] CAPTCHA solving integration
- [ ] Room type filtering
- [ ] Amenities extraction
- [ ] Availability checking
- [ ] Multi-language support

## 📈 Monitoring & Logging

**Recommended Setup:**
- Logging: Winston or Pino
- Monitoring: PM2 for process management
- Metrics: Prometheus + Grafana
- Alerts: n8n workflow or PagerDuty

**Key Metrics to Track:**
- Request count
- Success/failure rate
- Average response time
- Browser crashes
- Memory usage

## 🤝 Integration Examples

### Google Sheets
```
n8n: HTTP Request → Google Sheets (Append Row)
```

### Slack Notifications
```
n8n: HTTP Request → Filter → Format → Slack Message
```

### Email Digest
```
n8n: Schedule → HTTP Request → Group → Email (HTML Table)
```

### Airtable Database
```
n8n: HTTP Request → Transform → Airtable (Create Records)
```

---

**Built for reliability, scalability, and ease of integration** 🚀
