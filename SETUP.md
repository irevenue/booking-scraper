# 🚀 Quick Setup Guide - Booking.com Scraper

## Option 1: Quick Local Setup (5 minutes)

### Prerequisites
- Node.js 16+ installed
- npm or yarn

### Steps

1. **Install dependencies**
```bash
npm install
```

2. **Install Playwright browser**
```bash
npm run install-browser
```

3. **Start the API server**
```bash
npm start
```

4. **Test it works**
Open http://localhost:3000 in your browser - you should see API documentation.

5. **Make your first request**
```bash
curl -X POST http://localhost:3000/api/scrape/city \
  -H "Content-Type: application/json" \
  -d '{
    "city": "Paris",
    "sortBy": "price",
    "order": "asc",
    "filters": {
      "onlyWithDiscount": true
    }
  }'
```

## Option 2: Docker Setup (3 minutes)

### Prerequisites
- Docker installed
- Docker Compose installed

### Steps

1. **Start the container**
```bash
docker-compose up -d
```

2. **Check it's running**
```bash
docker-compose logs -f
```

3. **Test the API**
```bash
curl http://localhost:3000/health
```

## Option 3: Command Line Usage (No Server)

```bash
# Install dependencies first
npm install
npm run install-browser

# Then run directly
node scraper.js "New York" --sort=price --discount-only
```

Results will be saved to `booking-results.json`

## 🔗 Connect to n8n

### In n8n, create an HTTP Request node:

**Settings:**
- Method: POST
- URL: `http://localhost:3000/api/scrape/city`
- Body Content Type: JSON
- Body:
```json
{
  "city": "Paris",
  "checkIn": "2025-03-01",
  "checkOut": "2025-03-03",
  "sortBy": "price",
  "order": "asc",
  "filters": {
    "onlyWithDiscount": true
  }
}
```

**Access the results:**
- All hotels: `{{$json.hotels}}`
- Hotel count: `{{$json.count}}`
- First hotel name: `{{$json.hotels[0].name}}`

## 📊 Example n8n Workflow

1. **Import the workflow**
   - Open n8n
   - Go to Workflows → Import from File
   - Select `n8n-workflow-example.json`

2. **Configure**
   - Update the API URL if needed
   - Add your Slack webhook (optional)
   - Customize the search parameters

3. **Run**
   - Click "Execute Workflow"
   - Watch the hotels appear!

## 🐛 Troubleshooting

### "Cannot find module 'playwright'"
```bash
npm install
```

### "Browser not found"
```bash
npm run install-browser
```

### "Port 3000 already in use"
```bash
# Use a different port
PORT=3001 npm start
```

### n8n can't connect
- Make sure the server is running: `http://localhost:3000/health`
- Check firewall settings
- If using Docker, ensure containers are on same network

## 🎯 What's Next?

- Read the full [README.md](README.md) for advanced features
- Check out [n8n-workflow-example.json](n8n-workflow-example.json) for inspiration
- Customize filters and sorting options
- Deploy to a cloud service (Railway, Render, etc.)

## 💡 Pro Tips

1. **Slow internet?** Increase timeout in scraper.js: `timeout: 60000`
2. **Need more data?** Modify the `extractHotels()` function
3. **Want to scrape multiple cities?** Use n8n's loop node
4. **Save results?** Connect to Google Sheets or Airtable in n8n

## 📞 Need Help?

- Check the README.md for detailed documentation
- Review the example workflow
- Test with `node test.js` to verify setup

---

**Ready to find the best hotel deals? Let's go! 🎉**
