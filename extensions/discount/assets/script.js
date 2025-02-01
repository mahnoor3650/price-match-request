// document.addEventListener("DOMContentLoaded", () => {
//   // Get the button
//   const matchButton = document.getElementById("open-price-match-btn");
//   // If there's no button on this page, do nothing
//   if (!matchButton) return;

//   // Read product ID from data attribute
//   const productId = matchButton.getAttribute("data-product-id") || null;

//   // Read customer ID from data attribute
//   // If user is not logged in, this might be the string "null"
//   let customerId = matchButton.getAttribute("data-customer-id");
//   if (customerId === "null") {
//     customerId = null; // convert string "null" to actual null
//   }

//   // Attempt to get the <main> section content
//   const mainSection = document.querySelector("main");
//   let bodyContent = "";
//   if (mainSection) {
//     bodyContent = mainSection.innerHTML;
//   } else {
//     // fallback to entire body if <main> not found
//     bodyContent = document.body.innerHTML;
//   }

//   // Get the overlay + close button + form
//   const overlay = document.getElementById("price-match-overlay");
//   const closeButton = document.getElementById("close-price-match-btn");
//   const form = document.getElementById("price-match-form");

//   // Click to open popup
//   matchButton.addEventListener("click", () => {
//     if (overlay) {
//       overlay.style.display = "block";
//     }
//   });

//   // Close popup
//   if (closeButton) {
//     closeButton.addEventListener("click", () => {
//       if (overlay) {
//         overlay.style.display = "none";
//       }
//     });
//   }

//   // Close if user clicks the overlay background
//   if (overlay) {
//     overlay.addEventListener("click", (event) => {
//       if (event.target === overlay) {
//         overlay.style.display = "none";
//       }
//     });
//   }

//   // Form submission
//   if (form) {
//     form.addEventListener("submit", (e) => {
//       e.preventDefault();

//       // First: check if the user is logged in
//       if (!customerId) {
//         alert("You must be logged in to submit a Price Match request.");
//         return; // stop submission
//       }

//       // Otherwise, proceed (customer is logged in)
//       const name = document.getElementById("priceMatchName")?.value || "";
//       const email = document.getElementById("priceMatchEmail")?.value || "";
//       const url = document.getElementById("priceMatchURL")?.value || "";
//       const competitorPrice =
//         document.getElementById("priceMatchPrice")?.value || "";
//       const notes = document.getElementById("priceMatchNotes")?.value || "";

//       // Log everything
//       console.log("== Price Match Form Submission ==");
//       console.log("Customer ID:", customerId);
//       console.log("Product ID:", productId);
//       console.log("Name:", name);
//       console.log("Email:", email);
//       console.log("Competitor URL:", url);
//       console.log("Competitor Price:", competitorPrice);
//       console.log("Notes:", notes);
//       console.log("Page HTML:", bodyContent);

//       // Hide popup and reset form if needed
//       if (overlay) overlay.style.display = "none";
//       form.reset();
//     });
//   }

// });
document.addEventListener("DOMContentLoaded", async () => {
  // 1) Grab references
  const matchButton = document.getElementById("open-price-match-btn");
  if (!matchButton) return; // no button on this page, do nothing

  const overlay = document.getElementById("price-match-overlay");
  const closeButton = document.getElementById("close-price-match-btn");
  const form = document.getElementById("price-match-form");

  // 2) Read relevant data from button
  const productId = matchButton.getAttribute("data-product-id") || null;
  const variantId = matchButton.getAttribute("data-variant-id") || null;
  let customerId = matchButton.getAttribute("data-customer-id");
  if (customerId === "null") {
    customerId = null; // means no user logged in
  }
function encodeHtmlToBase64(str) {
  // btoa only handles ASCII, so ensure it's UTF-8 safe:
  return btoa(unescape(encodeURIComponent(str)));
}
function showToast(message, isError = false) {
  const toastEl = document.getElementById("price-match-toast");
  if (!toastEl) return;

  // Optional: style it differently for errors
  toastEl.style.backgroundColor = isError ? "rgb(186 2 2)" : "rgb(51 143 51)";

  toastEl.textContent = message;
  toastEl.classList.add("show");

  setTimeout(() => {
    toastEl.classList.remove("show");
  }, 30000);
}

  // 3) Get the store page content (main or entire body)
  const mainSection = document.querySelector("main");
  let rawContent = mainSection
    ? mainSection.innerText
    : document.body.innerText;
const encodedContent = encodeHtmlToBase64(rawContent);
  // 4) Handle open modal
  matchButton.addEventListener("click", () => {
    if (overlay) {
      overlay.style.display = "block";
    }
  });

  // 5) Handle close modal
  if (closeButton) {
    closeButton.addEventListener("click", () => {
      if (overlay) {
        overlay.style.display = "none";
      }
    });
  }
  if (overlay) {
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) {
        overlay.style.display = "none";
      }
    });
  }

  // 6) Handle form submission
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const submitButton = document.getElementById("submit-price-match-btn");

      // 1) Indicate loading

      // Must be logged in
      if (!customerId) {
        showToast(
          "You must be logged in to submit a Price Match request.",
          true,
        );
        return;
      }
      submitButton.disabled = true;
      submitButton.innerText = "Submitting...";
      // Gather form values
      const name = document.getElementById("priceMatchName")?.value || "";
      const email = document.getElementById("priceMatchEmail")?.value || "";
      const competitorUrl =
        document.getElementById("priceMatchURL")?.value || "";
      const competitorPrice =
        document.getElementById("priceMatchPrice")?.value || "";
      const notes = document.getElementById("priceMatchNotes")?.value || "";

      // 7) Call the unified endpoint
      try {
        const response = await fetch("/apps/proxy943", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId,
            customerId,
            name,
            email,
            notes,
            competitorUrl,
            storeBodyContent: encodedContent,
            competitorPrice,
          }),
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
          console.error("Price Match error:", data.error);
            showToast(
              data.error || "Failed to process price match request.",
              true,
            );
          return;
        }

        // 8) Check if a discount code was created
        const { discountCode } = data;
        if (discountCode) {
         showToast(`Discount code created: ${discountCode}`, false);

          // Add the product to cart (if needed)
          if (productId) {
            // This is an example of adding a single variant with quantity=1
            const addResponse = await fetch(
              `${window.Shopify.routes.root}cart/add.js`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Accept: "application/json",
                },
                body: JSON.stringify({
                  items: [
                    {
                      id: Number(productId),
                      quantity: 1,
                    },
                  ],
                }),
              },
            );

            if (!addResponse.ok) {
              throw new Error("Failed to add product to cart");
            }

            const addData = await addResponse.json();
            console.log("Product added to cart:", addData);
          }

          // Redirect directly to checkout with discount
          const checkoutUrl = `${window.Shopify.routes.root}checkout?discount=${encodeURIComponent(discountCode)}`;
          window.location.href = checkoutUrl;
        } else {
         
         showToast(
           data.message || "Products do not match or no discount offered.",
           false,
         );
        }
      } catch (error) {
        console.error("API call failed:", error);
        showToast("Failed to process price match. Please try again.", true);
      } finally {
        
        submitButton.disabled = false;
        submitButton.innerText = "Send the request";

    
        if (overlay) overlay.style.display = "none";
        form.reset();
      }
    });
  }
});
