import { json } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const loader = async ({ request }) => {
  try {
    // Fetch all price match requests
    const requests = await prisma.priceMatchRequest.findMany({
      orderBy: { createdAt: "desc" }, // Show latest requests first
    });

    return json({ success: true, requests });
  } catch (error) {
    console.error("Error fetching price match requests:", error);
    return json(
      { success: false, error: "Failed to fetch requests." },
      { status: 500 },
    );
  }
};
