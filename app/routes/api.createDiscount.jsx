import { json } from "@remix-run/node";
import puppeteer from "puppeteer";
import OpenAI from "openai";
import axios from "axios";
import shopify from "../shopify.server";
import { PrismaClient } from "@prisma/client";
import sendEmail from "../emailService";
const prisma = new PrismaClient();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Optional CORS headers (if needed)
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "OPTIONS, POST",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Credentials": "true",
};
async function scrapeBodyContent(url) {
  console.log("Scraping body content from URL:", url);
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: "domcontentloaded" });
    console.log(`Successfully loaded page: ${url}`);

    // Extract plain text or HTML
    const bodyText = await page.evaluate(() => document.body.innerText);

    await browser.close();
    return bodyText;
  } catch (error) {
    console.error("Error scraping body content:", error);
    await browser.close();
    return null;
  }
}
async function compareBodyContentsWithOpenAI1(bodyContent1, bodyContent2) {
  try {
    // Call GPT
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // or "gpt-4", "gpt-3.5-turbo", etc.
      messages: [
        {
          role: "system",
          content: `
You are an AI that compares product information extracted from two webpage contents. 
Analyze the content, extract key product details such as title and price, and determine if both contents refer to the same product. 
If the products are the same and the price of product2 (our store) is higher than product1 (competitor), compare their prices, 
calculate the difference, and determine the discount percentage required to match. 

Return JSON in this shape:

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
    "priceDifference": "number or null",
    "discountRequired": "number or null",
    "discountPercentage": "number or null"
  }
}
          `,
        },
        {
          role: "user",
          content: `Page 1:\n${bodyContent1}\n\nPage 2:\n${bodyContent2}\n`,
        },
      ],
      temperature: 0,
      store: true,
      stream: false,
    });

    const rawResponse = response.choices[0]?.message?.content;
    console.log("OpenAI Raw Response:", rawResponse);

    // Clean JSON from code blocks if present
    const cleanedResponse = rawResponse.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleanedResponse);

    // Optionally refine or fill any missing fields
    if (!parsed.priceComparison) {
      parsed.priceComparison = {
        priceDifference: null,
        discountRequired: null,
        discountPercentage: null,
      };
    }

    // If 'areSameProduct' is true, check if price2 > price1
    if (parsed.areSameProduct) {
      const p1 = parsed.product1?.price || 0;
      const p2 = parsed.product2?.price || 0;
      if (p2 > p1) {
        const diff = p2 - p1;
        const discountRequired = ((p2 - p1) / p2) * 100;
        const discountPercentage = ((p2 - p1) / p1) * 100;
        parsed.priceComparison.priceDifference = parseFloat(diff.toFixed(2));
        parsed.priceComparison.discountRequired = parseFloat(
          discountRequired.toFixed(2),
        );
        parsed.priceComparison.discountPercentage = parseFloat(
          discountPercentage.toFixed(2),
        );
      }
    }

    return parsed;
  } catch (error) {
    console.error("Error using OpenAI API:", error);
    throw new Error("Failed to compare webpage contents with OpenAI.");
  }
}

async function compareBodyContentsWithOpenAI(bodyContent1, bodyContent2) {
  try {
    // 1) Call GPT
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // or "gpt-4", "gpt-3.5-turbo", etc.
      messages: [
        {
          role: "system",
          content: `
You are an AI that compares product information extracted from two webpage contents:
- Page 1: Competitor product (bodyContent1).
- Page 2: Our store product (bodyContent2).

1) Extract key details for each product.Analyze the content, extract key product details such as title and price, and determine if both contents refer to the same product.
2) Decide if they refer to the **same** product (areSameProduct).
3) If they are the same product:
   - Compare the competitor’s price (price1) to our store’s price (price2).
   - If price2 > price1:
       * This means the competitor has a lower price, so we need a discount.
       * Calculate the difference (price2 - price1).
       * Determine discount percentage to match competitor.
   - If price2 <= price1:
       * No discount is required because our price is lower or equal.
       * Set the discount fields to null or zero, and explain the reason.
4) Return your analysis in **JSON** in the following shape:

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
    "priceDifference": "number or null",
    "discountRequired": "number or null",
    "discountPercentage": "number or null"
  }
}
      `,
        },
        {
          role: "user",
          content: `Page 1:\n${bodyContent1}\n\nPage 2:\n${bodyContent2}\n`,
        },
      ],
      temperature: 0,
      store: true,
      stream: false,
    });

    // 2) Parse the response
    const rawResponse = response.choices[0]?.message?.content;
    console.log("OpenAI Raw Response:", rawResponse);

    // Remove ```json code blocks, if present
    const cleanedResponse = rawResponse.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleanedResponse);

    // 3) Fill in missing fields if needed
    if (!parsed.priceComparison) {
      parsed.priceComparison = {
        priceDifference: null,
        discountRequired: null,
        discountPercentage: null,
      };
    }

    // 4) (Optional) Additional safety check in code
    // If AI says areSameProduct but fails to handle the logic, we can still correct it:
    if (parsed.areSameProduct) {
      const p1 = parsed.product1?.price || 0; // competitor
      const p2 = parsed.product2?.price || 0; // our store
      if (p2 > p1) {
        // discount needed
        const diff = p2 - p1;
        const discountRequired = ((p2 - p1) / p2) * 100;
        const discountPercentage = ((p2 - p1) / p1) * 100;
        parsed.priceComparison.priceDifference = parseFloat(diff.toFixed(2));
        parsed.priceComparison.discountRequired = parseFloat(
          discountRequired.toFixed(2),
        );
        parsed.priceComparison.discountPercentage = parseFloat(
          discountPercentage.toFixed(2),
        );
      } else {
        // p2 <= p1 -> No discount
        parsed.priceComparison.priceDifference = 0;
        parsed.priceComparison.discountRequired = 0;
        parsed.priceComparison.discountPercentage = 0;
        parsed.reason = parsed.reason
          ? parsed.reason + " Our store price is already lower or equal."
          : "No discount needed. Our store price is already lower or equal.";
      }
    }

    return parsed;
  } catch (error) {
    console.error("Error using OpenAI API:", error);
    throw new Error("Failed to compare webpage contents with OpenAI.");
  }
}

export const loader = async ({ request }) => {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: CORS_HEADERS,
    });
  }
  return json({ error: "Method not allowed" }, { status: 405 });
};
function decodeBase64ToHtml(base64Str) {
  const decoded = Buffer.from(base64Str, "base64").toString("utf-8");
  return decoded;
}
// export const action = async ({ request }) => {
//   if (request.method === "OPTIONS") {
//     return new Response(null, {
//       status: 204,
//       headers: CORS_HEADERS,
//     });
//   }

//   try {
//     // 1) Parse incoming JSON
//     const body = await request.json();
//     const {
//       productId,
//       customerId,
//       name,
//       email,
//       notes,
//       competitorUrl,
//       storeBodyContent,
//     } = body;
//     let SoreBodyContent = decodeBase64ToHtml(storeBodyContent);

//     // Basic validation
//     if (!productId || !customerId || !competitorUrl) {
//       return json(
//         {
//           success: false,
//           error:
//             "Missing required fields: productId, customerId, competitorUrl, storeBodyContent",
//         },
//         { status: 400, headers: CORS_HEADERS },
//       );
//     }

//     // 2) Scrape competitor URL
//     const competitorContent = await scrapeBodyContent(competitorUrl);
//     if (!competitorContent) {
//       return json(
//         { success: false, error: "Failed to scrape competitor URL." },
//         { status: 500, headers: CORS_HEADERS },
//       );
//     }

//     // 3) Compare with OpenAI
//     const comparisonResult = await compareBodyContentsWithOpenAI(
//       competitorContent,
//       SoreBodyContent,
//     );

//     console.log("Comparison Result:", comparisonResult);

//     // 4) Decide if we need a discount
//     let discountCode = null;
//     let discountPercentage = 0; // or 5, 10, etc.
//     if (comparisonResult.areSameProduct) {
//       // The GPT logic: price2 = your store's price, price1 = competitor's
//       const priceDiff = comparisonResult.priceComparison.discountPercentage;
//       // If there's a price difference that suggests a discount
//       if (priceDiff && priceDiff > 0) {
//         discountPercentage = priceDiff;
//         // Cap discount at 20%
//         if (discountPercentage > 20) {
//           discountPercentage = 20;
//         }

//         // 5) Create discount code in Shopify
//         // Use your existing shopify auth
//         const { session } = await shopify.authenticate.public.appProxy(request);
//         const shop = session.shop;
//         const accessToken = session.accessToken;

//         // Price Rule Data
//         const priceRuleData = {
//           price_rule: {
//             title: `Exclusive ${discountPercentage}% Discount`,
//             value_type: "percentage",
//             value: `-${discountPercentage}`,
//             customer_selection: "prerequisite",
//             target_type: "line_item",
//             target_selection: "entitled",
//             allocation_method: "across",
//             starts_at: new Date().toISOString(),
//             ends_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 min
//             once_per_customer: true,
//             prerequisite_customer_ids: [parseInt(customerId, 10)],
//             entitled_variant_ids: [parseInt(productId, 10)],
//           },
//         };

//         // Create Price Rule
//         const priceRuleResponse = await axios.post(
//           `https://${shop}/admin/api/2023-10/price_rules.json`,
//           priceRuleData,
//           {
//             headers: {
//               "X-Shopify-Access-Token": accessToken,
//               "Content-Type": "application/json",
//             },
//           },
//         );
//         const priceRuleId = priceRuleResponse.data.price_rule.id;

//         // Create a Discount Code
//         const discountCodeData = {
//           discount_code: {
//             code: `DISCOUNT-${Date.now()}`,
//           },
//         };
//         const discountCodeResponse = await axios.post(
//           `https://${shop}/admin/api/2023-10/price_rules/${priceRuleId}/discount_codes.json`,
//           discountCodeData,
//           {
//             headers: {
//               "X-Shopify-Access-Token": accessToken,
//               "Content-Type": "application/json",
//             },
//           },
//         );
//         discountCode = discountCodeResponse.data.discount_code.code;
//         console.log("Discount Code Created:", discountCode);
//       }
//     }

//     // 6) Return final result
//     return json(
//       {
//         success: true,
//         comparisonResult,
//         discountCode,
//         discountPercentage,
//         message: discountCode
//           ? `Discount code ${discountCode} created with ${discountPercentage}% off.`
//           : comparisonResult.reason,
//       },
//       { status: 200, headers: CORS_HEADERS },
//     );
//   } catch (error) {
//     console.error("Error in unified endpoint:", error);
//     return json(
//       { success: false, error: error.message || "Server error" },
//       { status: 500, headers: CORS_HEADERS },
//     );
//   }
// };


export const action = async ({ request }) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  try {
    // 1) Parse incoming JSON
    const body = await request.json();
    const {
      productId,
      customerId,
      name,
      email,
      notes,
      competitorUrl,
      storeBodyContent,
      competitorPrice,
    } = body;

    let decodedStoreBodyContent = decodeBase64ToHtml(storeBodyContent);

    // Validate required fields
    if (!productId || !customerId || !competitorUrl || !competitorPrice) {
      return json(
        { success: false, error: "Missing required fields." },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    // 2) Scrape competitor URL
    const competitorContent = await scrapeBodyContent(competitorUrl);
    if (!competitorContent) {
      return json(
        { success: false, error: "Failed to scrape competitor URL." },
        { status: 500, headers: CORS_HEADERS },
      );
    }

    // 3) Compare with OpenAI
    const comparisonResult = await compareBodyContentsWithOpenAI(
      competitorContent,
      decodedStoreBodyContent,
    );

    console.log("Comparison Result:", comparisonResult);

    // Get the store session
    const { session } = await shopify.authenticate.public.appProxy(request);
    const shop = session.shop;
    const accessToken = session.accessToken;

    // 4) Decide if we need to create a discount
    let discountCode = null;
    let discountPercentage = 0;
    let requestStatus = "pending"; // Default status is "pending"

    if (comparisonResult.areSameProduct) {
      const competitorProductPrice = parseFloat(
        comparisonResult.product1.price,
      );
      const storeProductPrice = parseFloat(comparisonResult.product2.price);

      // If our price is already lower, reject the request
      if (storeProductPrice <= competitorProductPrice) {
        return json(
          {
            success: false,
            message: "Our product already has the lowest price.",
          },
          { status: 200, headers: CORS_HEADERS },
        );
      }

      // Calculate required discount
      const requiredDiscountPercentage =
        ((storeProductPrice - competitorProductPrice) / storeProductPrice) *
        100;
      console.log(
        "requiredDiscountPercentage Result:",
        requiredDiscountPercentage,
      );
      if (requiredDiscountPercentage > 0) {
        discountPercentage = requiredDiscountPercentage;

        if (discountPercentage > 20) {
          discountCode = null;
          requestStatus = "pending";
          console.log("discountPercentage > 20");
          await sendEmail(
            email,
            "Your Price Match Request is Under Review",
            `Hello ${name},\n\nYour price match request has been received and is currently under review. Our team will review it and get back to you shortly.\n\nCompetitor Price: ${competitorPrice}\nOur Price: ${storeProductPrice}\nRequested Discount: ${discountPercentage.toFixed(2)}%\n\nThank you for your patience!\n\nBest regards,\n`,
          );
        } else {
          requestStatus = "approved";
          console.log("discountPercentage < 20");

          const priceRuleData = {
            price_rule: {
              title: `Exclusive ${discountPercentage.toFixed(2)}% Discount`,
              value_type: "percentage",
              value: `-${discountPercentage.toFixed(2)}`,
              customer_selection: "prerequisite",
              target_type: "line_item",
              target_selection: "entitled",
              allocation_method: "across",
              starts_at: new Date().toISOString(),
              ends_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 min validity
              once_per_customer: true,
              prerequisite_customer_ids: [parseInt(customerId, 10)],
              entitled_variant_ids: [parseInt(productId, 10)],
            },
          };

          const priceRuleResponse = await axios.post(
            `https://${shop}/admin/api/2023-10/price_rules.json`,
            priceRuleData,
            {
              headers: {
                "X-Shopify-Access-Token": accessToken,
                "Content-Type": "application/json",
              },
            },
          );

          const priceRuleId = priceRuleResponse.data.price_rule.id;

          // Create Discount Code
          const discountCodeData = {
            discount_code: { code: `DISCOUNT-${Date.now()}` },
          };
          const discountCodeResponse = await axios.post(
            `https://${shop}/admin/api/2023-10/price_rules/${priceRuleId}/discount_codes.json`,
            discountCodeData,
            {
              headers: {
                "X-Shopify-Access-Token": accessToken,
                "Content-Type": "application/json",
              },
            },
          );

          discountCode = discountCodeResponse.data.discount_code.code;
          console.log("Discount Code Created:", discountCode);
        }
      }
      if (requestStatus === "approved" || requestStatus === "pending") {
        console.log("Prisma models available:", Object.keys(prisma));

        const newRequest = await prisma.priceMatchRequest.create({
          data: {
            shop,
            sessionId: session.id,
            productId,
            customerId,
            customerEmail: email,
            customerName: name || null,
            competitorUrl,
            competitorPrice: parseFloat(competitorPrice),
            ourPrice: parseFloat(comparisonResult.product2.price),
            status: requestStatus,
            discountCode: requestStatus === "approved" ? discountCode : null,
            notes: notes || null,
          },
        });

        console.log("Price Match Request Saved:", newRequest);
        return json(
          {
            success: true,
            comparisonResult,
            discountCode,
            discountPercentage,
            message:
              requestStatus === "approved"
                ? `Discount code ${discountCode} created with ${discountPercentage.toFixed(2)}% off.`
                : "Request submitted for manual review.",
          },
          { status: 200, headers: CORS_HEADERS },
        );
      }
    } else {
      return json(
        {
          success: true,
          message: `Products do not match.${comparisonResult.reason}`,
        },
        { status: 200, headers: CORS_HEADERS },
      );
    }
   
  } catch (error) {
    console.error("Error in unified endpoint:", error);
    return json(
      { success: false, error: error.message || "Server error" },
      { status: 500, headers: CORS_HEADERS },
    );
  }
};
