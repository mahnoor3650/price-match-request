import shopify from "../shopify.server";

export async function getCurrentSession(request) {
  // Retrieve the session ID from the request
  console.log("shopify.session.", shopify.session);
  const sessionId = await shopify.session.getCurrentId({
    isOnline: false, // Set to `true` for online sessions, `false` for offline sessions
    rawRequest: request,
  });
console.log("session id,",sessionId);
  if (!sessionId) {
    return null; // No session ID found
  }

  // Load the session using the session ID
  const session = await shopify.sessionStorage.loadSession(sessionId);
console.log("session", session);
  return session; // Return the session or null if not found
}
