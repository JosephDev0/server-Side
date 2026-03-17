// const express = require("express");
// const axios = require("axios");
// const cors = require("cors");
// const puppeteer = require('puppeteer-extra');
// const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// // Add stealth plugin to avoid detection
// puppeteer.use(StealthPlugin());

// const app = express();
// app.use(cors());

// const PORT = 5000;

// let cookie = "";
// let cookieExpiry = 0;
// let cacheData = null;
// let lastFetch = 0;

// // Cache for different symbols
// const symbolCache = {
//   NIFTY: { data: null, lastFetch: 0 },
//   BANKNIFTY: { data: null, lastFetch: 0 }
// };

// // Function to get cookie with multiple attempts
// async function getCookieWithRetry(maxRetries = 3) {
//   for (let i = 0; i < maxRetries; i++) {
//     try {
//       console.log(`Cookie fetch attempt ${i + 1}/${maxRetries}`);
//       await getCookie();
//       return true;
//     } catch (error) {
//       console.log(`Cookie fetch attempt ${i + 1} failed:`, error.message);
//       if (i === maxRetries - 1) return false;
//       await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
//     }
//   }
//   return false;
// }

// // Simplified cookie fetch function
// async function getCookie() {
//   let browser = null;
//   try {
//     console.log("Launching browser for cookie fetch...");
    
//     browser = await puppeteer.launch({
//       headless: 'new',
//       args: [
//         '--no-sandbox',
//         '--disable-setuid-sandbox',
//         '--disable-web-security',
//         '--disable-features=IsolateOrigins,site-per-process',
//         '--window-size=1920,1080',
//         '--disable-blink-features=AutomationControlled'
//       ],
//       ignoreHTTPSErrors: true,
//     });

//     const page = await browser.newPage();

//     // Set viewport
//     await page.setViewport({
//       width: 1920,
//       height: 1080,
//     });

//     // Navigate to NSE
//     await page.goto('https://www.nseindia.com', {
//       waitUntil: 'networkidle2',
//       timeout: 30000
//     });

//     // Wait a bit for cookies to be set
//     await new Promise(resolve => setTimeout(resolve, 3000));

//     // Get cookies
//     const cookies = await page.cookies();
    
//     if (cookies.length === 0) {
//       throw new Error("No cookies received");
//     }

//     // Format cookies
//     cookie = cookies.map(c => `${c.name}=${c.value}`).join("; ");
    
//     // Set expiry (15 minutes)
//     cookieExpiry = Date.now() + (15 * 60 * 1000);

//     console.log("✅ Cookies obtained successfully");
//     await browser.close();
    
//     return true;
    
//   } catch (error) {
//     console.error("❌ Error in cookie fetch:", error.message);
//     if (browser) {
//       await browser.close();
//     }
    
//     // Try alternative method
//     return await getCookieAlternative();
//   }
// }

// // Alternative cookie fetch using axios
// async function getCookieAlternative() {
//   try {
//     console.log("Trying alternative cookie fetch method...");
    
//     const response = await axios.get('https://www.nseindia.com', {
//       headers: {
//         'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
//         'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
//         'Accept-Language': 'en-US,en;q=0.9',
//         'Accept-Encoding': 'gzip, deflate, br',
//         'Connection': 'keep-alive',
//         'Upgrade-Insecure-Requests': '1'
//       },
//       maxRedirects: 5,
//       timeout: 15000
//     });
    
//     const setCookie = response.headers['set-cookie'];
//     if (setCookie && setCookie.length > 0) {
//       cookie = setCookie.join('; ');
//       cookieExpiry = Date.now() + (10 * 60 * 1000);
//       console.log("✅ Alternative cookie fetch successful");
//       return true;
//     }
    
//     return false;
//   } catch (error) {
//     console.error("❌ Alternative cookie fetch failed:", error.message);
//     return false;
//   }
// }

// // Function to fetch option chain data
// async function fetchOptionChainData(symbol = "NIFTY") {
//   try {
//     const url = `https://www.nseindia.com/api/option-chain-indices?symbol=${symbol}`;
    
//     const response = await axios.get(url, {
//       headers: {
//         "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
//         "Accept": "application/json, text/plain, */*",
//         "Accept-Language": "en-US,en;q=0.9",
//         "Referer": "https://www.nseindia.com/",
//         "Origin": "https://www.nseindia.com",
//         "Connection": "keep-alive",
//         "Cookie": cookie,
//         "Cache-Control": "no-cache",
//         "Pragma": "no-cache"
//       },
//       timeout: 15000,
//       validateStatus: function (status) {
//         return status < 500; // Accept all status codes less than 500
//       }
//     });

//     if (response.status === 200 && response.data) {
//       return { success: true, data: response.data };
//     } else if (response.status === 401 || response.status === 403) {
//       return { success: false, error: "auth_failed", status: response.status };
//     } else {
//       return { success: false, error: "fetch_failed", status: response.status };
//     }
//   } catch (error) {
//     console.log(`Fetch error for ${symbol}:`, error.message);
//     return { success: false, error: error.message };
//   }
// }

// // Option Chain Endpoint
// app.get("/option-chain", async (req, res) => {
//   try {
//     const symbol = req.query.symbol || "NIFTY";
//     const now = Date.now();
//     const cacheTime = 15000; // 15 seconds cache

//     // Check cache for specific symbol
//     const symbolCacheData = symbolCache[symbol];
//     if (symbolCacheData && symbolCacheData.data && (now - symbolCacheData.lastFetch) < cacheTime) {
//       console.log(`Returning cached data for ${symbol}`);
//       return res.json(symbolCacheData.data);
//     }

//     // Check if cookie is valid
//     if (!cookie || now > cookieExpiry) {
//       console.log("Cookie missing or expired, fetching new one...");
//       const cookieSuccess = await getCookieWithRetry(2);
//       if (!cookieSuccess) {
//         // If we have cached data, return it even if expired
//         if (symbolCacheData && symbolCacheData.data) {
//           console.log(`Returning expired cache for ${symbol} due to cookie failure`);
//           return res.json(symbolCacheData.data);
//         }
//       }
//     }

//     // Try to fetch data
//     let retries = 2;
//     let result = null;

//     while (retries > 0) {
//       result = await fetchOptionChainData(symbol);
      
//       if (result.success) {
//         // Update cache
//         if (!symbolCache[symbol]) {
//           symbolCache[symbol] = { data: null, lastFetch: 0 };
//         }
//         symbolCache[symbol].data = result.data;
//         symbolCache[symbol].lastFetch = now;
        
//         console.log(`✅ Successfully fetched ${symbol} data`);
//         return res.json(result.data);
//       }
      
//       // If auth failed, try to refresh cookie
//       if (result.error === "auth_failed") {
//         console.log("Auth failed, refreshing cookie...");
//         await getCookie();
//       }
      
//       retries--;
//       if (retries > 0) {
//         await new Promise(resolve => setTimeout(resolve, 2000));
//       }
//     }

//     // If all retries failed but we have cache, return it
//     if (symbolCacheData && symbolCacheData.data) {
//       console.log(`Returning cached data for ${symbol} after fetch failure`);
//       return res.json(symbolCacheData.data);
//     }

//     // No data available
//     res.status(503).json({ 
//       success: false,
//       error: "Service temporarily unavailable",
//       message: "Unable to fetch live data",
//       records: { data: [] }
//     });

//   } catch (error) {
//     console.log("Option Chain Error:", error.message);
    
//     // Try to return any cached data
//     const symbol = req.query.symbol || "NIFTY";
//     const symbolCacheData = symbolCache[symbol];
    
//     if (symbolCacheData && symbolCacheData.data) {
//       console.log(`Returning cached data for ${symbol} due to error`);
//       res.json(symbolCacheData.data);
//     } else {
//       res.status(500).json({ 
//         error: "Internal server error",
//         records: { data: [] }
//       });
//     }
//   }
// });

// // Nifty Chart Endpoint
// app.get("/nifty", async (req, res) => {
//   try {
//     const range = req.query.range || "1d";
//     const interval = req.query.interval || "5m";

//     const url = `https://query1.finance.yahoo.com/v8/finance/chart/%5ENSEI?range=${range}&interval=${interval}`;

//     const response = await axios.get(url, {
//       headers: {
//         'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
//         'Accept': 'application/json',
//         'Accept-Language': 'en-US,en;q=0.9'
//       },
//       timeout: 10000
//     });

//     res.json(response.data);
//   } catch (err) {
//     console.log("Error fetching Nifty data:", err.message);
    
//     // Return mock data as fallback
//     const mockData = generateMockNiftyData();
//     res.json(mockData);
//   }
// });

// // Generate mock Nifty data
// function generateMockNiftyData() {
//   const now = Date.now();
//   const interval = 5 * 60 * 1000; // 5 minutes
//   const dataPoints = 12; // 1 hour of data
  
//   const timestamps = [];
//   const prices = [];
//   let basePrice = 22000;
  
//   for (let i = dataPoints - 1; i >= 0; i--) {
//     timestamps.push(now - (i * interval));
//     basePrice += (Math.random() - 0.5) * 100;
//     prices.push(Math.round(basePrice * 100) / 100);
//   }
  
//   return {
//     chart: {
//       result: [{
//         meta: {
//           symbol: "^NSEI",
//           regularMarketPrice: prices[prices.length - 1],
//           previousClose: prices[prices.length - 2] || prices[prices.length - 1]
//         },
//         timestamp: timestamps,
//         indicators: {
//           quote: [{
//             close: prices
//           }]
//         }
//       }]
//     }
//   };
// }

// // Health check endpoint
// app.get("/health", (req, res) => {
//   res.json({
//     status: "healthy",
//     cookiePresent: !!cookie,
//     cookieExpiry: cookieExpiry ? new Date(cookieExpiry).toISOString() : null,
//     cacheStatus: {
//       NIFTY: symbolCache.NIFTY.data ? `${Math.floor((Date.now() - symbolCache.NIFTY.lastFetch) / 1000)}s old` : "empty",
//       BANKNIFTY: symbolCache.BANKNIFTY.data ? `${Math.floor((Date.now() - symbolCache.BANKNIFTY.lastFetch) / 1000)}s old` : "empty"
//     }
//   });
// });

// // Manual cookie refresh endpoint
// app.post("/refresh-cookie", async (req, res) => {
//   try {
//     const success = await getCookieWithRetry(3);
//     if (success) {
//       res.json({ success: true, message: "Cookie refreshed successfully" });
//     } else {
//       res.status(500).json({ success: false, message: "Failed to refresh cookie" });
//     }
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// });

// // Start server
// app.listen(PORT, () => {
//   console.log(`🚀 Server running on http://localhost:${PORT}`);
//   console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  
//   // Initial cookie fetch
//   setTimeout(async () => {
//     console.log("Attempting initial cookie fetch...");
//     const success = await getCookie();
//     if (success) {
//       console.log("✅ Initial cookie fetch successful");
//     } else {
//       console.log("⚠️ Initial cookie fetch failed, will retry on first request");
//     }
//   }, 3000);
// });







// const express = require("express");
// const axios = require("axios");
// const cors = require("cors");

// const app = express();

// // Configure CORS for frontend
// const allowedOrigins = [
//   'http://localhost:5173',  // Vite default
//   'http://localhost:3000',   // React default
//   'https://your-frontend.vercel.app'  // Replace with your actual frontend URL
// ];

// app.use(cors({
//   origin: function(origin, callback) {
//     if (!origin || allowedOrigins.indexOf(origin) !== -1) {
//       callback(null, true);
//     } else {
//       callback(new Error('Not allowed by CORS'));
//     }
//   },
//   credentials: true
// }));

// app.use(express.json());

// // In-memory cache
// const cache = {
//   nifty: { data: null, timestamp: 0 },
//   options: { data: null, timestamp: 0 }
// };

// const CACHE_DURATION = 15000; // 15 seconds

// // Nifty chart data from Yahoo Finance
// app.get("/api/nifty", async (req, res) => {
//   try {
//     const range = req.query.range || "1d";
//     const interval = req.query.interval || "5m";
    
//     // Check cache
//     if (cache.nifty.data && Date.now() - cache.nifty.timestamp < CACHE_DURATION) {
//       return res.json(cache.nifty.data);
//     }
    
//     const response = await axios.get(
//       `https://query1.finance.yahoo.com/v8/finance/chart/%5ENSEI?range=${range}&interval=${interval}`,
//       {
//         headers: {
//           'User-Agent': 'Mozilla/5.0',
//           'Accept': 'application/json',
//         }
//       }
//     );
    
//     cache.nifty = {
//       data: response.data,
//       timestamp: Date.now()
//     };
    
//     res.json(response.data);
//   } catch (error) {
//     console.error("Yahoo Finance Error:", error.message);
//     const mockData = generateMockNiftyData();
//     res.json(mockData);
//   }
// });

// // Option chain data
// app.get("/api/option-chain", async (req, res) => {
//   try {
//     // Check cache
//     if (cache.options.data && Date.now() - cache.options.timestamp < CACHE_DURATION) {
//       return res.json(cache.options.data);
//     }
    
//     // Try to fetch from NSE
//     try {
//       const response = await axios.get(
//         "https://www.nseindia.com/api/option-chain-indices?symbol=NIFTY",
//         {
//           headers: {
//             'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
//             'Accept': 'application/json, text/plain, */*',
//             'Accept-Language': 'en-US,en;q=0.9',
//             'Referer': 'https://www.nseindia.com/',
//             'Origin': 'https://www.nseindia.com',
//           },
//           timeout: 8000
//         }
//       );
      
//       if (response.data && response.data.records) {
//         cache.options = {
//           data: response.data,
//           timestamp: Date.now()
//         };
//         return res.json(response.data);
//       }
//     } catch (nseError) {
//       console.log("NSE fetch failed, using mock data:", nseError.message);
//     }
    
//     // Return mock data if NSE fails
//     const mockData = generateMockOptionChain();
//     cache.options = {
//       data: mockData,
//       timestamp: Date.now()
//     };
//     res.json(mockData);
    
//   } catch (error) {
//     console.error("Option Chain Error:", error);
//     res.json(generateMockOptionChain());
//   }
// });

// // Health check
// app.get("/api/health", (req, res) => {
//   res.json({
//     status: "healthy",
//     timestamp: new Date().toISOString(),
//     environment: process.env.VERCEL_ENV || 'development',
//     cache: {
//       nifty: cache.nifty.data ? 'cached' : 'empty',
//       options: cache.options.data ? 'cached' : 'empty'
//     }
//   });
// });

// // Mock data generators
// function generateMockNiftyData() {
//   const now = Date.now() / 1000;
//   const timestamps = [];
//   const prices = [];
//   let basePrice = 22000;
  
//   for (let i = 11; i >= 0; i--) {
//     timestamps.push(now - (i * 300));
//     basePrice += (Math.random() - 0.5) * 50;
//     prices.push(Math.round(basePrice * 100) / 100);
//   }
  
//   return {
//     chart: {
//       result: [{
//         meta: {
//           symbol: "^NSEI",
//           regularMarketPrice: prices[prices.length - 1],
//           previousClose: prices[prices.length - 2] || prices[prices.length - 1],
//           chartPreviousClose: prices[prices.length - 2] || prices[prices.length - 1]
//         },
//         timestamp: timestamps,
//         indicators: {
//           quote: [{
//             close: prices
//           }]
//         }
//       }]
//     }
//   };
// }

// function generateMockOptionChain() {
//   const strikes = [22000, 22100, 22200, 22300, 22400, 22500, 22600, 22700, 22800, 22900, 23000];
  
//   return {
//     records: {
//       data: strikes.map(strike => ({
//         strikePrice: strike,
//         CE: { 
//           lastPrice: Math.round((Math.random() * 200 + 50) * 100) / 100,
//           openInterest: Math.floor(Math.random() * 50000 + 10000)
//         },
//         PE: { 
//           lastPrice: Math.round((Math.random() * 200 + 50) * 100) / 100,
//           openInterest: Math.floor(Math.random() * 50000 + 10000)
//         }
//       }))
//     }
//   };
// }

// module.exports = app;

// // Start server if running locally
// if (require.main === module) {
//   const PORT = process.env.PORT || 5000;
//   app.listen(PORT, () => {
//     console.log(`Server running on http://localhost:${PORT}`);
//   });
// }






const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();

// Configure CORS
app.use(cors({
  origin: '*',  // Allow all origins for now
  credentials: true
}));

app.use(express.json());

// Add a root route handler
app.get("/", (req, res) => {
  res.json({
    name: "Nifty Options API",
    version: "1.0.0",
    status: "running",
    endpoints: {
      health: "/api/health",
      nifty: "/api/nifty?range=1d&interval=5m",
      optionChain: "/api/option-chain"
    },
    documentation: "Use /api/* endpoints for data"
  });
});

// Rest of your API routes...

// In-memory cache
const cache = {
  nifty: { data: null, timestamp: 0 },
  options: { data: null, timestamp: 0 }
};

const CACHE_DURATION = 15000; // 15 seconds

// Nifty chart data from Yahoo Finance
app.get("/api/nifty", async (req, res) => {
  try {
    const range = req.query.range || "1d";
    const interval = req.query.interval || "5m";
    
    // Check cache
    if (cache.nifty.data && Date.now() - cache.nifty.timestamp < CACHE_DURATION) {
      return res.json(cache.nifty.data);
    }
    
    const response = await axios.get(
      `https://query1.finance.yahoo.com/v8/finance/chart/%5ENSEI?range=${range}&interval=${interval}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Accept': 'application/json',
        }
      }
    );
    
    cache.nifty = {
      data: response.data,
      timestamp: Date.now()
    };
    
    res.json(response.data);
  } catch (error) {
    console.error("Yahoo Finance Error:", error.message);
    const mockData = generateMockNiftyData();
    res.json(mockData);
  }
});

// Option chain data
app.get("/api/option-chain", async (req, res) => {
  try {
    // Check cache
    if (cache.options.data && Date.now() - cache.options.timestamp < CACHE_DURATION) {
      return res.json(cache.options.data);
    }
    
    // Try to fetch from NSE
    try {
      const response = await axios.get(
        "https://www.nseindia.com/api/option-chain-indices?symbol=NIFTY",
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://www.nseindia.com/',
            'Origin': 'https://www.nseindia.com',
          },
          timeout: 8000
        }
      );
      
      if (response.data && response.data.records) {
        cache.options = {
          data: response.data,
          timestamp: Date.now()
        };
        return res.json(response.data);
      }
    } catch (nseError) {
      console.log("NSE fetch failed, using mock data:", nseError.message);
    }
    
    // Return mock data if NSE fails
    const mockData = generateMockOptionChain();
    cache.options = {
      data: mockData,
      timestamp: Date.now()
    };
    res.json(mockData);
    
  } catch (error) {
    console.error("Option Chain Error:", error);
    res.json(generateMockOptionChain());
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    environment: process.env.VERCEL_ENV || 'development',
    cache: {
      nifty: cache.nifty.data ? 'cached' : 'empty',
      options: cache.options.data ? 'cached' : 'empty'
    }
  });
});

// Mock data generators
function generateMockNiftyData() {
  const now = Date.now() / 1000;
  const timestamps = [];
  const prices = [];
  let basePrice = 22000;
  
  for (let i = 11; i >= 0; i--) {
    timestamps.push(now - (i * 300));
    basePrice += (Math.random() - 0.5) * 50;
    prices.push(Math.round(basePrice * 100) / 100);
  }
  
  return {
    chart: {
      result: [{
        meta: {
          symbol: "^NSEI",
          regularMarketPrice: prices[prices.length - 1],
          previousClose: prices[prices.length - 2] || prices[prices.length - 1],
          chartPreviousClose: prices[prices.length - 2] || prices[prices.length - 1]
        },
        timestamp: timestamps,
        indicators: {
          quote: [{
            close: prices
          }]
        }
      }]
    }
  };
}

function generateMockOptionChain() {
  const strikes = [22000, 22100, 22200, 22300, 22400, 22500, 22600, 22700, 22800, 22900, 23000];
  
  return {
    records: {
      data: strikes.map(strike => ({
        strikePrice: strike,
        CE: { 
          lastPrice: Math.round((Math.random() * 200 + 50) * 100) / 100,
          openInterest: Math.floor(Math.random() * 50000 + 10000)
        },
        PE: { 
          lastPrice: Math.round((Math.random() * 200 + 50) * 100) / 100,
          openInterest: Math.floor(Math.random() * 50000 + 10000)
        }
      }))
    }
  };
}

module.exports = app;

// Start server if running locally
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Try: http://localhost:${PORT}/api/health`);
  });
}