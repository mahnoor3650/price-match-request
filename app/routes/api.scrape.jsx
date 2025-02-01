// import puppeteer from "puppeteer";  

// export async function action({ request }) {
//   const { url } = await request.json();

//   if (!url) {
//     return new Response(
//       JSON.stringify({ success: false, error: "URL is required" }),
//       {
//         status: 400,
//         headers: { "Content-Type": "application/json" },
//       },
//     );
//   }

//   try {
//     // Launch Puppeteer for web scraping
//     const browser = await puppeteer.launch();
//     const page = await browser.newPage();
//     await page.goto(url, { waitUntil: "domcontentloaded" });

//     // Example scraping logic: Extract title and price
//     const productDetails = await page.evaluate(() => {
//       const title = document.querySelector("h1")?.textContent || "No Title";
//       const price = document.querySelector(".price")?.textContent || "No Price";
//       return { title, price };
//     });

//     await browser.close();

//     // Return the scraped product details
//     return new Response(
//       JSON.stringify({ success: true, data: productDetails }),
//       {
//         status: 200,
//         headers: { "Content-Type": "application/json" },
//       },
//     );
//   } catch (error) {
//     console.error("Error during scraping:", error);
//     return new Response(
//       JSON.stringify({ success: false, error: "Failed to scrape the URL." }),
//       { status: 500, headers: { "Content-Type": "application/json" } },
//     );
//   }
// }













// import puppeteer from "puppeteer";

// import OpenAI from "openai";


// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY, // Add your OpenAI API key in .env
// });
// function normalizeTitle(title) {
//   return title
//     .toLowerCase()
//     .replace(/[^a-z0-9\s]/g, "") 
//     .replace(/\s+/g, " ") 
//     .trim();
// }
// async function fetchProductData(url) {
//   console.log("Fetching data from URL:", url);

//   const browser = await puppeteer.launch({ headless: true });
//   const page = await browser.newPage();

//   try {
//     await page.goto(url, { waitUntil: "domcontentloaded" });
//     console.log(`Successfully loaded page: ${url}`);

//     const productDetails = await page.evaluate(() => {
//       const title =
//         // document.querySelector("meta[property='og:title']")?.content ||
//          document.querySelector("h1")?.textContent || "No Title"||
//         "No Title";

//       let currentPrice = "No Price";
//       let originalPrice = null;
//       let currency = "";

//       // Try multiple price selectors for common platforms
//       const currentPriceElement = document.querySelector(
//         ".price .current, .current-price, .product__price, .product-price, [itemprop='price'], .woocommerce-Price-amount",
//       );

//       const originalPriceElement = document.querySelector(
//         ".price .original, .old-price, .regular-price, .woocommerce-Price-amount--original",
//       );

//       if (currentPriceElement) {
//         const priceText = currentPriceElement.textContent.trim();
//         currentPrice = priceText.match(/[\d.,]+/g)?.[0] || "No Price";
//         currency = priceText.match(/[^\d.,\s]+/g)?.[0] || "";
//       }

//       if (originalPriceElement) {
//         const originalPriceText = originalPriceElement.textContent.trim();
//         originalPrice = originalPriceText.match(/[\d.,]+/g)?.[0] || null;
//       }

//       return { title, currentPrice, originalPrice, currency };
//     });

//     console.log("Extracted Product Data:", productDetails);

//     const normalizedTitle = normalizeTitle(productDetails.title);
//     const parsedCurrentPrice =
//       parseFloat(productDetails.currentPrice.replace(/[^\d.]/g, "")) || 0;
//     const parsedOriginalPrice = productDetails.originalPrice
//       ? parseFloat(productDetails.originalPrice.replace(/[^\d.]/g, ""))
//       : null;

//     await browser.close();
//     return {
//       title: normalizedTitle,
//       currentPrice: parsedCurrentPrice,
//       originalPrice: parsedOriginalPrice,
//       currency: productDetails.currency,
//     };
//   } catch (error) {
//     console.error("Error scraping URL:", url, error);
//     await browser.close();
//     return null;
//   }
// }

// async function compareStringsWithOpenAI(string1, string2) {
//   try {
//     const response = await openai.chat.completions.create({
//       model: "gpt-4o-mini", // Use your desired model
//       messages: [
//         {
//           role: "system",
//           content:
//             "You are an AI that compares two product titles to determine if they refer to the same product. The comparison should focus on the core product identifiers (e.g., brand, model, type) and consider that additional details in one title (like specifications or promotional text) do not necessarily make the products different. Provide a JSON response with 'areSameProduct', 'confidenceScore', and 'reason' fields.",
//         },
//         {
//           role: "user",
//           content: `Compare the following product titles and provide a structured JSON response:\n\n1. "${string1}"\n2. "${string2}"`,
//         },
//       ],
//       temperature: 0, // Deterministic response
//       store: true,
//       stream: false,
//     });

//     const rawResponse = response.choices[0]?.message?.content;
//     console.log("OpenAI Raw Response:", rawResponse);

//     // Clean and parse the JSON response
//     const cleanedResponse = rawResponse.replace(/```json|```/g, "").trim();
//     const parsedResult = JSON.parse(cleanedResponse);
//     return parsedResult;
//   } catch (error) {
//     console.error("Error using OpenAI API:", error);
//     throw new Error("Failed to compare strings with OpenAI.");
//   }
// }

// export async function action({ request }) {
//   console.log("Starting action handler for product comparison...");

//   const { url1, url2 } = await request.json();
//   console.log("Received URLs:", { url1, url2 });

//   if (!url1 || !url2) {
//     console.error("Missing one or both URLs.");
//     return new Response(
//       JSON.stringify({ success: false, error: "Both URLs are required." }),
//       { status: 400, headers: { "Content-Type": "application/json" } },
//     );
//   }

//   const product1 = await fetchProductData(url1);
//   const product2 = await fetchProductData(url2);

//   if (!product1 || !product2) {
//     console.error("Failed to fetch product data from one or both URLs.");
//     return new Response(
//       JSON.stringify({
//         success: false,
//         error: "Failed to fetch product data from one or both URLs.",
//       }),
//       { status: 500, headers: { "Content-Type": "application/json" } },
//     );
//   }
//   try {
     
//     const openAIComparison = await compareStringsWithOpenAI(
//       product1.title,
//       product2.title,
//     );

//     return new Response(
//       JSON.stringify({
//         success: true,
//         product1,
//         product2,
//          openAIComparison,
//       }),
//       { status: 200, headers: { "Content-Type": "application/json" } },
//     );
//   } catch (error) {
//     return new Response(
//       JSON.stringify({ success: false, error: "Failed to compare titles." }),
//       { status: 500, headers: { "Content-Type": "application/json" } },
//     );
//   }
// }







import puppeteer from "puppeteer";

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,  
});

async function scrapeBodyContent(url) {
  console.log("Scraping body content from URL:", url);

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: "domcontentloaded" });
    console.log(`Successfully loaded page: ${url}`);

    // Extract the HTML content of the <body>
    const bodyHtml = await page.evaluate(() => {
      return document.body.innerHTML;
    });

    
    const bodyText = await page.evaluate(() => {
      return document.body.innerText; 
    });

    await browser.close();

    return {
      bodyHtml,
      bodyText,
    };
  } catch (error) {
    console.error("Error scraping body content:", error);
    await browser.close();
    return null;
  }
}

async function compareBodyContentsWithOpenAI(bodyContent1, bodyContent2) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", 
      messages: [
        {
          role: "system",
          content: `
          You are an AI that compares product information extracted from two webpage contents. Analyze the content, extract key product details such as title and price, and determine if both contents refer to the same product. Consider additional details (like promotional text or specifications) in one content but focus on the core identifiers (e.g., product name, brand, and model). If the products are the same and the price of product 2 (your store) is higher than product 1 (competitor), compare their prices, calculate the price difference, and determine the discount percentage required to match the competitor's price. Return a JSON response with the following structure:
          {
            "areSameProduct": true/false,
            "confidenceScore": number,  
            "product1": {
              "title": "string",
              "price": "number"
            },
            "product2": {
              "title": "string",
              "price": "number"
            },
            "reason": "string",
            "priceComparison": {
              "priceDifference": "number or null",  // Difference in price if applicable
              "discountRequired": "number or null", // Discount percentage required to match the competitor's price
              "discountPercentage": "number or null" // Discount offered as a percentage of the original price
            }
          }
          `,
        },
        {
          role: "user",
          content: `Here are the webpage contents of two products:\n\nPage 1:\n${bodyContent1}\n\nPage 2:\n${bodyContent2}\n\nCompare the products, and if they are the same and product 2's price is higher, perform the price comparison as described.`,
        },
      ],
      temperature: 0, // Deterministic response
      store: true,
      stream: false,
    });

    const rawResponse = response.choices[0]?.message?.content;
    console.log("OpenAI Raw Response:", rawResponse);

    // Clean and parse the JSON response
    const cleanedResponse = rawResponse.replace(/```json|```/g, "").trim();
    const parsedResult = JSON.parse(cleanedResponse);

    // Additional logic to compare prices only if products are the same and product 2 price > product 1 price
    if (parsedResult.areSameProduct) {
      const price1 = parsedResult.product1.price; // Competitor's price
      const price2 = parsedResult.product2.price; // Your store price

      if (price2 > price1) {
        const priceDifference = price2 - price1;
        const discountRequired = ((price2 - price1) / price2) * 100;
        const discountPercentage = ((price2 - price1) / price1) * 100;

        parsedResult.priceComparison = {
          priceDifference: parseFloat(priceDifference.toFixed(2)),
          discountRequired: parseFloat(discountRequired.toFixed(2)),
          discountPercentage: parseFloat(discountPercentage.toFixed(2)),
        };
      } else {
        parsedResult.priceComparison = {
          priceDifference: 0,
          discountRequired: 0,
          discountPercentage: 0,
        };
      }
    } else {
      parsedResult.priceComparison = {
        priceDifference: null,
        discountRequired: null,
        discountPercentage: null,
      };
    }

    return parsedResult;
  } catch (error) {
    console.error("Error using OpenAI API:", error);
    throw new Error("Failed to compare webpage contents with OpenAI.");
  }
}

export async function action({ request }) {
  console.log("Starting action handler for product comparison...");

  const { url1, url2 } = await request.json();
  console.log("Received URLs:", { url1, url2 });

  if (!url1 || !url2) {
    console.error("Missing one or both URLs.");
    return new Response(
      JSON.stringify({ success: false, error: "Both URLs are required." }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const product1 = await scrapeBodyContent(url1);
  const product2 = await scrapeBodyContent(url2);

  if (!product1 || !product2) {
    console.error("Failed to fetch product data from one or both URLs.");
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to fetch product data from one or both URLs.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
  try {
const result = await compareBodyContentsWithOpenAI(
  product1.bodyText,
  product2.bodyText,
);

console.log("Comparison Result:", result);
    return new Response(
      JSON.stringify({
        success: true,
        result,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: "Failed to compare titles." }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}






