// import { json } from "@remix-run/node";
// import shopify from "../shopify.server";

// const CORS_HEADERS = {
//   "Access-Control-Allow-Origin": "*",  
//   "Access-Control-Allow-Methods": "OPTIONS, POST",
//   "Access-Control-Allow-Headers": "Content-Type",
// };

// export const loader = async ({ request }) => {
//   if (request.method === "OPTIONS") {
//     return new Response(null, {
//       status: 204,
//       headers: CORS_HEADERS,
//     });
//   }

//   return json({ error: "Method not allowed" }, { status: 405 });
// };

// export const action = async ({ request }) => {
//   const body = await request.json();
//   const { productId, customerId } = body;

//   if (!productId || !customerId) {
//     return json(
//       { error: "Product ID and Customer ID are required" },
//       { status: 400, headers: CORS_HEADERS },
//     );
//   }

//   try {
//     // Get the session from the requestc
//      console.log("shopify", shopify);
//     console.log("sessionId", shopify.sessionStorage);
//     const sessionId = await shopify.sessionStorage.getSessionId(
//       request.headers,
//     );
//     if (!sessionId) {
//       return json(
//         { error: "Unauthorized: Session not found" },
//         { status: 401, headers: CORS_HEADERS },
//       );
//     }

//     const session = await shopify.sessionStorage.loadSession(sessionId);
//     if (!session || !session.accessToken || !session.shop) {
//       return json(
//         { error: "Unauthorized: Invalid session" },
//         { status: 401, headers: CORS_HEADERS },
//       );
//     }

//     const { shop, accessToken } = session;

//     // Create a REST client using the session
//     const restClient = new shopify.clients.Rest(shop, accessToken);

//     // Create a price rule specific to the customer and product
//     const priceRuleResponse = await restClient.post({
//       path: "price_rules",
//       data: {
//         title: "Exclusive Discount",
//         target_type: "line_item",
//         target_selection: "entitled",
//         entitled_product_ids: [productId],
//         allocation_method: "across",
//         value_type: "fixed_amount",
//         value: "-10.00",
//         customer_selection: "prerequisite",
//         prerequisite_customer_ids: [customerId],
//         once_per_customer: true,
//         starts_at: new Date().toISOString(),
//         ends_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10-minute expiration
//       },
//       type: "application/json",
//     });

//     const priceRule = priceRuleResponse.body.price_rule;

//     // Create a discount code associated with the price rule
//     const discountCodeResponse = await restClient.post({
//       path: `price_rules/${priceRule.id}/discount_codes`,
//       data: {
//         code: `DISCOUNT-${Date.now()}`,
//       },
//       type: "application/json",
//     });

//     const discountCode = discountCodeResponse.body.discount_code;

//     return json(
//       { success: true, discountCode: discountCode.code },
//       { headers: CORS_HEADERS },
//     );
//   } catch (error) {
//     console.error("Error creating discount:", error);
//     return json(
//       { error: "Failed to create discount" },
//       { status: 500, headers: CORS_HEADERS },
//     );
//   }
// };
// app/routes/api/createDiscount.ts

// import { json } from "@remix-run/node";
// import shopify, { sessionStorage, authenticate } from "../shopify.server";

// const CORS_HEADERS = {
//   "Access-Control-Allow-Origin": "*",
//   "Access-Control-Allow-Methods": "OPTIONS, POST",
//   "Access-Control-Allow-Headers": "Content-Type, Authorization",
//   "Access-Control-Allow-Credentials": "true", // Allow credentials to be sent
// };

// export const loader = async ({ request ,response}) => {
//   if (request.method === "OPTIONS") {
//     return new Response(null, {
//       status: 204,
//       headers: CORS_HEADERS,
//     });
//   }

//   return json({ error: "Method not allowed" }, { status: 405, headers: CORS_HEADERS });
// };
// async function getSessionFromStorage(sessionId) {
//   try {
//     const session = await shopify.config.sessionStorage.loadSession(sessionId);
//     return session;
//   } catch (error) {
//     return `Error loading session: ${error}`;
//   }
// }
// export const action = async ({ request }) => {
  
//   if (request.method === "OPTIONS") {
//     return new Response(null, {
//       status: 204,
//       headers: CORS_HEADERS,
//     });
//   }

//   const body = await request.json();
//   const { productId, customerId } = body;

//   if (!productId || !customerId) {
//     return json(
//       { error: "Product ID and Customer ID are required" },
//       { status: 400, headers: CORS_HEADERS },
//     );
//   }

//   try {
//     // console.log("PrismaSessionStorage instance:", shopify.sessionStorage);

//  const cookieHeader = request.headers.get("Cookie");

//  if (!cookieHeader) {
//    return json({ error: "Unauthorized: No session cookie" }, { status: 401 });
//  }

//  const cookies = Object.fromEntries(
//    cookieHeader.split(";").map((cookie) => cookie.trim().split("=")),
//  );

//  const sessionId = cookies["shopify_session"];
 
//      console.log("sessionId :", sessionId);
//   const session = await shopify.sessionStorage.loadSession(sessionId);
//    console.log("sessionFromStorage :", session);
//   const { shop, accessToken } = session;
// console.log("shop",shop);
// console.log("accesToken",accessToken);
//     // Create a REST client using the session
//     const restClient = new shopify.clients.Rest(shop, accessToken);
// console.log("restClient", restClient);
//     // Create a price rule specific to the customer and product
//     const priceRuleResponse = await restClient.post({
//       path: "price_rules",
//       data: {
//         title: "Exclusive Discount",
//         target_type: "line_item",
//         target_selection: "entitled",
//         entitled_product_ids: [productId],
//         allocation_method: "across",
//         value_type: "fixed_amount",
//         value: "-10.00",
//         customer_selection: "prerequisite",
//         prerequisite_customer_ids: [customerId],
//         once_per_customer: true,
//         starts_at: new Date().toISOString(),
//         ends_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10-minute expiration
//       },
//       type: "application/json",
//     });

//     const priceRule = priceRuleResponse.body.price_rule;
//       console.log("priceRule", priceRule);
//     // Create a discount code associated with the price rule
//     const discountCodeResponse = await restClient.post({
//       path: `price_rules/${priceRule.id}/discount_codes`,
//       data: {
//         code: `DISCOUNT-${Date.now()}`,
//       },
//       type: "application/json",
//     });

//     const discountCode = discountCodeResponse.body.discount_code;

//     return json(
//       { success: true, discountCode: discountCode.code },
//       { headers: CORS_HEADERS },
//     );
//   } catch (error) {
//     console.error("EEError creating discount:", error);
//     return json(
//       { error: "Failed to create discount" },
//       { status: 500, headers: CORS_HEADERS },
//     );
//   }
// };






// import { json } from "@remix-run/node";
// import shopify from "../shopify.server";
// const CORS_HEADERS = {
//   "Access-Control-Allow-Origin": "*",
//   "Access-Control-Allow-Methods": "OPTIONS, POST",
//   "Access-Control-Allow-Headers": "Content-Type, Authorization",
//   "Access-Control-Allow-Credentials": "true",
// };

// // Handle OPTIONS requests
// export const loader = async ({ request }) => {
//   if (request.method === "OPTIONS") {
//     return new Response(null, {
//       status: 204,
//       headers: CORS_HEADERS,
//     });
//   }

//   // If the request is not OPTIONS, return an error
//   return json(
//     { error: "Method not allowed" },
//     { status: 405, headers: CORS_HEADERS },
//   );
// };
// export async function action({ request }) {
//    if (request.method === "OPTIONS") {
//      return new Response(null, {
//        status: 204,
//        headers: CORS_HEADERS,
//      });
//    }
//   try {
//     // Authenticate the App Proxy request
//     const { admin, session } =
//       await shopify.authenticate.public.appProxy(request);
//  console.log("Authenticated admin:", admin);
//     // Extract request body
//     const body = await request.json();
//     const { productId, customerId } = body;
//  console.log("productId productId:", productId);
//   console.log("customerId customerId:", customerId);
//     if (!productId || !customerId) {
//       return json(
//         { error: "Product ID and Customer ID are required" },
//         { status: 400 },
//       );
//     }

//     console.log("Authenticated session:", session);

//     // Use the session to create a REST client
//     const restClient = new shopify.clients.Rest(
//       session.shop,
//       session.accessToken,
//     );

//     // Create a price rule specific to the customer and product
//     const priceRuleResponse = await restClient.post({
//       path: "price_rules",
//       data: {
//         title: "Exclusive Discount",
//         target_type: "line_item",
//         target_selection: "entitled",
//         entitled_product_ids: [productId],
//         allocation_method: "across",
//         value_type: "fixed_amount",
//         value: "-10.00",
//         customer_selection: "prerequisite",
//         prerequisite_customer_ids: [customerId],
//         once_per_customer: true,
//         starts_at: new Date().toISOString(),
//         ends_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10-minute expiration
//       },
//       type: "application/json",
//     });

//     const priceRule = priceRuleResponse.body.price_rule;

//     // Create a discount code associated with the price rule
//     const discountCodeResponse = await restClient.post({
//       path: `price_rules/${priceRule.id}/discount_codes`,
//       data: {
//         code: `DISCOUNT-${Date.now()}`,
//       },
//       type: "application/json",
//     });

//     const discountCode = discountCodeResponse.body.discount_code;

//     return json(
//       { success: true, discountCode: discountCode.code },
//       { status: 200 },
//     );
//   } catch (error) {
//     console.error("Error creating discount:", error);
//     return json({ error: "Failed to create discount" }, { status: 500 });
//   }
// }







// import { json } from "@remix-run/node";
// import shopify from "../shopify.server";

// const CORS_HEADERS = {
//   "Access-Control-Allow-Origin": "*",
//   "Access-Control-Allow-Methods": "OPTIONS, POST",
//   "Access-Control-Allow-Headers": "Content-Type, Authorization",
//   "Access-Control-Allow-Credentials": "true",
// };

// export const loader = async ({ request }) => {
//   if (request.method === "OPTIONS") {
//     return new Response(null, {
//       status: 204,
//       headers: CORS_HEADERS,
//     });
//   }
//   return json({ error: "Method not allowed" }, { status: 405 });
// };


// export const action = async ({ request }) => {
//   if (request.method === "OPTIONS") {
//     return new Response(null, {
//       status: 204,
//       headers: CORS_HEADERS,
//     });
//   }

//   try {
//     const body = await request.json();
//     const { productId, customerId } = body;
// const { admin, session } = await shopify.authenticate.public.appProxy(request);
// console.log("session", session);
// console.log("admin", admin);
//     if (!productId || !customerId) {
//       return json(
//         { error: "Product ID and Customer ID are required" },
//         { status: 400, headers: CORS_HEADERS },
//       );
//     }

//     // Authenticate App Proxy request
    
//     // Step 1: Create a Price Rule
//     //const priceRule = new  shopify.rest.PriceRule({ session })();
//     const price_rule = new admin.rest.resources.PriceRule({ session });
//     price_rule.title = "Exclusive 5% Discount";
//     price_rule.value_type = "percentage"; // Percentage-based discount
//     price_rule.value = "-5.0"; // 5% discount (negative value)
//     price_rule.customer_selection = "prerequisite"; // Applies to specific customers
//     price_rule.target_type = "line_item"; // Applies to specific line items
//     price_rule.target_selection = "entitled"; // Applies to entitled products
//     price_rule.allocation_method = "across"; // Evenly distribute discount across items
//     price_rule.starts_at = new Date().toISOString(); // Starts now
//     price_rule.ends_at = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // Expires in 10 minutes
//     price_rule.once_per_customer = true; // Each customer can use it once
//     price_rule.prerequisite_customer_ids = [parseInt(customerId, 10)]; // Restrict to the specific customer
//     price_rule.entitled_product_ids = [parseInt(productId, 10)]; // Restrict to the specific product

//     const savedPriceRule = await price_rule.save({
//       update: true,
//     });

//     console.log("Price Rule Created:", price_rule);

//     console.log("savedPriceRule", savedPriceRule);

//     const discount_code = new admin.rest.resources.DiscountCode({
//        session
//     });

//     discount_code.price_rule_id = savedPriceRule.id;
//     discountCode.code = `DISCOUNT-${Date.now()}`;
//     const savedcode = await discount_code.save({
//       update: true,
//     });

//     console.log("Discount Code Created:", savedcode.code);

//     // Return the generated discount code
//     return json(
//       { success: true, discountCode: discountCode.code },
//       { headers: CORS_HEADERS },
//     );
//   } catch (error) {
//     console.error("Error creating discount code:", error);
//     return json(
//       { error: "Failed to create discount code" },
//       { status: 500, headers: CORS_HEADERS },
//     );
//   }
// };

















// export const action = async ({ request }) => {
//   if (request.method === "OPTIONS") {
//     return new Response(null, {
//       status: 204,
//       headers: CORS_HEADERS,
//     });
//   }

//   try {
//     const body = await request.json();
//     const { productId, customerId } = body;

//     const { admin,session } = await shopify.authenticate.public.appProxy(request);
//     const admin1 = await admin.json();
//     console.log("session", session);
//    console.log("shopify", admin1);
//     if (!productId || !customerId) {
//       return json(
//         { error: "Product ID and Customer ID are required" },
//         { status: 400, headers: CORS_HEADERS },
//       );
//     }

//     // Initialize Shopify REST client
//    const client = new admin1.clients.Rest(session.shop, session.accessToken);

//     // Step 1: Create a Price Rule
//     const priceRuleData = {
//       price_rule: {
//         title: "Exclusive 5% Discount",
//         value_type: "percentage",
//         value: "-5.0",
//         customer_selection: "prerequisite",
//         target_type: "line_item",
//         target_selection: "entitled",
//         allocation_method: "across",
//         starts_at: new Date().toISOString(),
//         ends_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
//         once_per_customer: true,
//         prerequisite_customer_ids: [parseInt(customerId, 10)],
//         entitled_product_ids: [parseInt(productId, 10)],
//       },
//     };

//     const priceRuleResponse = await client.post({
//       path: "price_rules",
//       data: priceRuleData,
//       type: "application/json",
//     });

//     const priceRuleId = priceRuleResponse.body.price_rule.id;
//     console.log("Price Rule Created:", priceRuleResponse.body.price_rule);

//     // Step 2: Create a Discount Code
//     const discountCodeData = {
//       discount_code: {
//         code: `DISCOUNT-${Date.now()}`,
//       },
//     };

//     const discountCodeResponse = await client.post({
//       path: `price_rules/${priceRuleId}/discount_codes`,
//       data: discountCodeData,
//       type: "application/json",
//     });

//     const discountCode = discountCodeResponse.body.discount_code.code;
//     console.log("Discount Code Created:", discountCode);

//     // Return the generated discount code
//     return json({ success: true, discountCode }, { headers: CORS_HEADERS });
//   } catch (error) {
//     console.error("Error creating discount code:", error);
//     return json(
//       { error: "Failed to create discount code" },
//       { status: 500, headers: CORS_HEADERS },
//     );
//   }
// };


import { json } from "@remix-run/node";
import shopify from "../shopify.server";
import axios from "axios";


const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "OPTIONS, POST",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Credentials": "true",
};

export const loader = async ({ request }) => {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: CORS_HEADERS,
    });
  }
  return json({ error: "Method not allowed" }, { status: 405 });
};

export const action = async ({ request }) => {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: CORS_HEADERS,
    });
  }

  try {
    const body = await request.json();
    const { productId, customerId } = body;

    // Authenticate via app proxy
    const { session } = await shopify.authenticate.public.appProxy(request);
    console.log("session",session);
    const shop = session.shop;
    const accessToken = session.accessToken;
 console.log("session.accessToken", session.accessToken);
    if (!productId || !customerId) {
      return json(
        { error: "Product ID and Customer ID are required" },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    // Step 1: Create a Price Rule
    const priceRuleData = {
      price_rule: {
        title: "Exclusive 5% Discount",
        value_type: "percentage",
        value: "-5.0",
        customer_selection: "prerequisite",
        target_type: "line_item",
        target_selection: "entitled",
        allocation_method: "across",
        starts_at: new Date().toISOString(),
        ends_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes validity
        once_per_customer: true,
        prerequisite_customer_ids: [parseInt(customerId, 10)],
        entitled_product_ids: [parseInt(productId, 10)],
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
    console.log("Price Rule Created:", priceRuleResponse.data.price_rule);

    // Step 2: Create a Discount Code
    const discountCodeData = {
      discount_code: {
        code: `DISCOUNT-${Date.now()}`,
      },
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

    const discountCode = discountCodeResponse.data.discount_code.code;
    console.log("Discount Code Created:", discountCode);

// Return the checkout URL
return json({ success: true, discountCode }, { headers: CORS_HEADERS });

  } catch (error) {
    console.error(
      "Error creating discount code:",
      error.response?.data || error.message,
    );
    return json(
      { error: "Failed to create discount code" },
      { status: 500, headers: CORS_HEADERS },
    );
  }
};

