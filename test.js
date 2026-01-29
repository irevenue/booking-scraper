const BookingScraper = require('./scraper');

async function testScraper() {
  console.log('🧪 Starting Booking.com Scraper Tests...\n');
  
  const scraper = new BookingScraper({ headless: true });
  
  try {
    console.log('1️⃣ Initializing browser...');
    await scraper.init();
    console.log('✅ Browser initialized\n');
    
    console.log('2️⃣ Testing city search (Paris)...');
    let hotels = await scraper.searchCity('Paris');
    console.log(`✅ Found ${hotels.length} hotels\n`);
    
    if (hotels.length > 0) {
      console.log('📊 Sample hotel data:');
      console.log(JSON.stringify(hotels[0], null, 2));
      console.log('');
    }
    
    console.log('3️⃣ Testing filters (only with discounts)...');
    const discountedHotels = scraper.filterHotels(hotels, { onlyWithDiscount: true });
    console.log(`✅ Found ${discountedHotels.length} hotels with discounts\n`);
    
    console.log('4️⃣ Testing sorting (by price, ascending)...');
    const sortedHotels = scraper.sortHotels(hotels, 'price', 'asc');
    console.log('✅ Hotels sorted by price\n');
    
    if (sortedHotels.length > 0) {
      console.log('💰 Top 3 cheapest hotels:');
      sortedHotels.slice(0, 3).forEach((hotel, i) => {
        console.log(`${i + 1}. ${hotel.name} - ${hotel.price}`);
      });
      console.log('');
    }
    
    console.log('5️⃣ Testing distance sorting...');
    const distanceSorted = scraper.sortHotels(hotels, 'distance', 'asc');
    console.log('✅ Hotels sorted by distance\n');
    
    if (distanceSorted.length > 0) {
      console.log('📍 Top 3 closest to center:');
      distanceSorted.slice(0, 3).forEach((hotel, i) => {
        console.log(`${i + 1}. ${hotel.name} - ${hotel.distanceFromCenter}`);
      });
      console.log('');
    }
    
    console.log('✨ All tests passed!\n');
    console.log('📝 Summary:');
    console.log(`   Total hotels: ${hotels.length}`);
    console.log(`   With discounts: ${discountedHotels.length}`);
    console.log(`   Percentage with discounts: ${((discountedHotels.length / hotels.length) * 100).toFixed(1)}%`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await scraper.close();
    console.log('\n🏁 Tests completed');
  }
}

// Run tests
testScraper();
