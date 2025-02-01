import { json } from "@remix-run/node";
import axios from "axios";
import { PrismaClient } from "@prisma/client";
import shopify from "../shopify.server";
import sendEmail from "../emailService";

const prisma = new PrismaClient();
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "OPTIONS, POST",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Credentials": "true",
};

export const action = async ({ request }) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  try {
    // 1️⃣ Parse incoming JSON request
    const { requestId, offerDiscount, discountPercentage } =
      await request.json();

    if (!requestId) {
      return json(
        { success: false, error: "Missing required fields: requestId" },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    // 2️⃣ Fetch the existing request from the database
    const priceMatchRequest = await prisma.priceMatchRequest.findUnique({
      where: { id: requestId },
    });

    if (!priceMatchRequest) {
      return json(
        { success: false, error: "Request not found." },
        { status: 404, headers: CORS_HEADERS },
      );
    }

    const {
      shop,
      customerEmail,
      customerId,
      productId,
      competitorPrice,
      ourPrice,
    } = priceMatchRequest;

    // 3️⃣ Get the Shopify session
    const { session } = await shopify.authenticate.admin(request);
    const accessToken = session.accessToken;

    let discountCode = null;
    let status = offerDiscount ? "approved" : "denied"; 

    // 4️⃣ If admin offers a discount, generate a Shopify discount code
    if (offerDiscount && discountPercentage > 0) {
      // Shopify Discount Code Logic
      const priceRuleData = {
        price_rule: {
          title: `Admin Approved ${discountPercentage}% Discount`,
          value_type: "percentage",
          value: `-${discountPercentage}`,
          customer_selection: "prerequisite",
          target_type: "line_item",
          target_selection: "entitled",
          allocation_method: "across",
          starts_at: new Date().toISOString(),
          ends_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
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

      const discountCodeData = {
        discount_code: { code: `ADMIN-DISCOUNT-${Date.now()}` },
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
    }

    // 5️⃣ Update the price match request in the database
    const updatedRequest = await prisma.priceMatchRequest.update({
      where: { id: requestId },
      data: {
        status,
        discountCode: discountCode || null, // Store the discount code if applicable
      },
    });

    // 6️⃣ Send email notification to the customer
    let emailSubject = "";
    let emailBody = "";

    if (offerDiscount && discountCode) {
      emailSubject = "Your Price Match Request Has Been Approved!";
      emailBody = `Hello,\n\nGreat news! Your price match request has been approved. You can use the following discount code at checkout:\n\n**Discount Code:** ${discountCode}\n\nThis code gives you a ${discountPercentage}% discount on your purchase.\n\nThank you for shopping with us!\n\nBest regards`;
    } else {
      emailSubject = "Your Price Match Request Was Denied";
      emailBody = `Hello,\n\nAfter reviewing your request, we are unable to offer a discount at this time. If you have any questions, please reach out to our support team.\n\nThank you for your understanding!\n\nBest regards`;
    }

    await sendEmail(customerEmail, emailSubject, emailBody);

    // 7️⃣ Return success response
    return json(
      {
        success: true,
        message: offerDiscount
          ? `Discount code ${discountCode} has been sent to the customer.`
          : "Request was denied, and customer has been notified.",
      },
      { status: 200, headers: CORS_HEADERS },
    );
  } catch (error) {
    console.error("Error in approving price match:", error);
    return json(
      { success: false, error: error.message || "Server error" },
      { status: 500, headers: CORS_HEADERS },
    );
  }
};
