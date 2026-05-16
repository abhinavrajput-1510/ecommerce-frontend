// ============================================
// Mobile Navigation
// ============================================

const hamburgerMenu = document.querySelector(".hamburger-menu");
const mainNav = document.querySelector(".main-nav");

if (hamburgerMenu && mainNav) {
  hamburgerMenu.addEventListener("click", () => {
    mainNav.classList.toggle("open");
    const expanded = mainNav.classList.contains("open");
    hamburgerMenu.setAttribute("aria-expanded", expanded);
  });
}

// ============================================
// Product Grid & API Configuration
// ============================================
const API_URL = "https://fakestoreapi.com/products?limit=12";
const API_CACHE_KEY = "products_cache";
const API_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds
const API_TIMEOUT = 10000; // 10 seconds timeout
const API_RETRY_ATTEMPTS = 3;

const productGrid = document.getElementById("product-grid");
const loadingContainer = document.getElementById("loading");
const errorContainer = document.getElementById("error");
const errorMessage = document.getElementById("error-message");
const retryBtn = document.getElementById("retry-btn");

// Store products in memory for cart functionality
let productsData = [];
let retryCount = 0;
let isFetching = false; // Prevent multiple simultaneous requests

// ============================================
// API Caching Strategy
// ============================================

/**
 * Get cached products from localStorage if available and not expired
 * @returns {Array|null} Cached products or null if expired/unavailable
 */
function getCachedProducts() {
  const cached = localStorage.getItem(API_CACHE_KEY);
  if (!cached) return null;

  try {
    const { data, timestamp } = JSON.parse(cached);
    const isExpired = Date.now() - timestamp > API_CACHE_DURATION;

    if (isExpired) {
      localStorage.removeItem(API_CACHE_KEY);
      console.log("Cache expired, fetching fresh data...");
      return null;
    }

    console.log(
      "Using cached products (expires in",
      Math.round((API_CACHE_DURATION - (Date.now() - timestamp)) / 1000),
      "seconds)",
    );
    return data;
  } catch (error) {
    console.error("Error parsing cache:", error);
    localStorage.removeItem(API_CACHE_KEY);
    return null;
  }
}

/**
 * Store products in cache with timestamp
 * @param {Array} products - Products to cache
 */
function setCachedProducts(products) {
  try {
    const cacheData = {
      data: products,
      timestamp: Date.now(),
    };
    localStorage.setItem(API_CACHE_KEY, JSON.stringify(cacheData));
    console.log("Products cached successfully");
  } catch (error) {
    console.error("Error caching products:", error);
  }
}

// ============================================
// API Request with Timeout & Retry
// ============================================

/**
 * Fetch with timeout functionality
 * @param {string} url - API endpoint
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<Response>}
 */
function fetchWithTimeout(url, timeout = API_TIMEOUT) {
  return Promise.race([
    fetch(url),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Request timeout")), timeout),
    ),
  ]);
}

/**
 * Validate API response structure
 * @param {Array} data - Response data to validate
 * @returns {boolean} True if valid, false otherwise
 */
function validateProductsData(data) {
  if (!Array.isArray(data)) {
    throw new Error("Invalid response: expected array of products");
  }

  if (data.length === 0) {
    throw new Error("No products available");
  }

  // Validate first product has required fields
  const requiredFields = ["id", "title", "price", "image"];
  const firstProduct = data[0];
  const hasRequiredFields = requiredFields.every(
    (field) => field in firstProduct,
  );

  if (!hasRequiredFields) {
    throw new Error(
      `Invalid product structure: missing required fields (${requiredFields.join(", ")})`,
    );
  }

  return true;
}

// ============================================
// Fetch products from API with caching & retry
// ============================================
async function fetchProducts() {
  // Prevent multiple simultaneous requests
  if (isFetching) {
    console.log("Fetch already in progress, skipping...");
    return;
  }

  isFetching = true;

  try {
    // Check cache first
    const cachedProducts = getCachedProducts();
    if (cachedProducts) {
      productsData = cachedProducts;
      renderProducts(productsData);
      isFetching = false;
      return;
    }

    // Show loading state
    loadingContainer.style.display = "flex";
    errorContainer.style.display = "none";
    productGrid.innerHTML = "";

    const startTime = performance.now();
    console.log("Fetching products from API...");

    // Fetch with timeout
    const response = await fetchWithTimeout(API_URL, API_TIMEOUT);

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}: ${response.statusText || "Failed to fetch"}`,
      );
    }

    // Parse response
    const data = await response.json();

    // Validate response structure
    validateProductsData(data);

    const endTime = performance.now();
    const fetchTime = (endTime - startTime).toFixed(2);

    // Store in memory and cache
    productsData = data;
    setCachedProducts(productsData);

    console.log(
      `✓ Successfully loaded ${data.length} products in ${fetchTime}ms`,
    );

    // Render and hide loading state
    renderProducts(productsData);
    loadingContainer.style.display = "none";
    retryCount = 0; // Reset retry count on success
  } catch (error) {
    console.error("Error fetching products:", error);

    // Retry logic with improved state management
    if (retryCount < API_RETRY_ATTEMPTS) {
      retryCount++;
      const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
      console.log(
        `Retry attempt ${retryCount}/${API_RETRY_ATTEMPTS} in ${delay}ms...`,
      );

      // Keep loading state visible during retry delay
      // Don't hide it here - let the next attempt handle it
      setTimeout(() => {
        isFetching = false; // Reset flag before retry
        fetchProducts(); // Recursive call for retry
      }, delay);
      return;
    }

    // All retries exhausted - show error state
    console.error("All retry attempts failed. Showing error state.");
    loadingContainer.style.display = "none";
    errorContainer.style.display = "flex";

    // Provide detailed error message
    if (error.message === "Request timeout") {
      errorMessage.textContent =
        "Request timed out. The API server is not responding. Please check your internet connection and try again.";
    } else if (error.message.includes("Failed to fetch")) {
      errorMessage.textContent =
        "Network error. Please check your connection and try again.";
    } else if (error.message.includes("Invalid response")) {
      errorMessage.textContent =
        "Invalid API response. Server returned unexpected data format.";
    } else {
      errorMessage.textContent = `Error: ${error.message} Please try again.`;
    }

    retryCount = 0; // Reset for next manual retry
  }

  isFetching = false; // Reset flag when done
}

// ============================================
// Render products to the grid
// ============================================
/**
 * Render products to the product grid
 * @param {Array} products - Array of product objects
 */
function renderProducts(products) {
  productGrid.innerHTML = "";

  products.forEach((product, index) => {
    const card = createProductCard(product, index);
    productGrid.appendChild(card);
  });

  console.log(`Rendered ${products.length} product cards`);
}

// ============================================
// Create individual product card
// ============================================
/**
 * Create a product card DOM element
 * @param {Object} product - Product object
 * @param {number} index - Card index for animation delay
 * @returns {HTMLElement} Product card element
 */
function createProductCard(product, index) {
  const card = document.createElement("div");
  card.className = "product-card";
  card.style.animationDelay = `${index * 0.05}s`;

  // Format price with discount calculation
  const originalPrice = (product.price * 1.2).toFixed(2);
  const discount = Math.round(
    ((originalPrice - product.price) / originalPrice) * 100,
  );

  // Generate star rating (fallback to 4.5 if not available)
  const rating = Math.floor(product.rating?.rate || 4.5);
  const stars = "★".repeat(rating) + "☆".repeat(5 - rating);

  // Sanitize product title for XSS prevention
  const safeTitle = escapeHtml(product.title);
  const safeDescription = escapeHtml(product.description);
  const safeCategory = escapeHtml(product.category);

  card.innerHTML = `
    <div class="product-image-container">
      <img
        src="${product.image}"
        alt="${safeTitle}"
        class="product-image"
        loading="lazy"
        decoding="async"
      />
      ${discount > 0 ? `<div class="product-badge">-${discount}%</div>` : ""}
    </div>
    <div class="product-info">
      <span class="product-category">${safeCategory}</span>
      <h3 class="product-name">${safeTitle}</h3>
      <p class="product-description">${safeDescription}</p>
      <div class="product-rating">
        <span class="stars" title="${rating}/5 stars">${stars}</span>
        <span class="rating-count">${product.rating?.count || 0} reviews</span>
      </div>
      <div class="product-footer">
        <div class="product-price">
          <span class="price-current">$${product.price.toFixed(2)}</span>
          ${
            originalPrice != product.price
              ? `<span class="price-original">$${originalPrice}</span>`
              : ""
          }
        </div>
        <button class="add-to-cart-btn" data-product-id="${product.id}" aria-label="Add ${safeTitle} to cart">
          Add to Cart
        </button>
      </div>
    </div>
  `;

  return card;
}

// ============================================
// Security & Utility Functions
// ============================================

/**
 * Escape HTML special characters to prevent XSS attacks
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

// ============================================
// Network Status Detection
// ============================================

/**
 * Check if the browser has internet connectivity
 * @returns {boolean} True if online, false otherwise
 */
function isOnline() {
  return navigator.onLine;
}

/**
 * Update network status indicator in UI
 * @param {boolean} online - Whether the device is online
 */
function updateNetworkStatus(online) {
  const statusElement = document.getElementById("network-status");
  if (!statusElement) return;

  if (online) {
    statusElement.classList.remove("offline");
    statusElement.classList.add("online");
    statusElement.querySelector(".status-text").textContent = "Online";
  } else {
    statusElement.classList.remove("online");
    statusElement.classList.add("offline");
    statusElement.querySelector(".status-text").textContent = "Offline";
  }
}

// Listen for online/offline events
window.addEventListener("online", () => {
  console.log("✓ Network connection restored");
  updateNetworkStatus(true);
  // Refresh products when connection is restored (only if not already fetching)
  if (!productsData.length && !isFetching) {
    fetchProducts();
  }
});

window.addEventListener("offline", () => {
  console.warn("✗ Network connection lost");
  updateNetworkStatus(false);
  errorMessage.textContent =
    "You are offline. Showing cached products if available.";
});

// ============================================
// Cart Management
// ============================================

/**
 * Initialize Add to Cart button listeners
 */
function initializeAddToCartButtons() {
  document.addEventListener("click", function (e) {
    if (e.target.classList.contains("add-to-cart-btn")) {
      const productId = e.target.dataset.productId;
      const product = productsData.find((p) => p.id == productId);

      if (product) {
        addToCart(product);
        // Show feedback
        const btn = e.target;
        const originalText = btn.textContent;
        btn.textContent = "Added! ✓";
        btn.style.opacity = "0.7";
        setTimeout(() => {
          btn.textContent = originalText;
          btn.style.opacity = "1";
        }, 2000);
      }
    }
  });
}

/**
 * Add product to cart (localStorage integration)
 * @param {Object} product - Product to add to cart
 */
function addToCart(product) {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const existingItem = cart.find((item) => item.id === product.id);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.image,
      quantity: 1,
    });
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartBadge();
  console.log("✓ Product added to cart:", product.title);
}

/**
 * Update cart badge count with total items
 */
function updateCartBadge() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const cartBadge = document.querySelector(".cart-badge");
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (cartBadge) {
    cartBadge.textContent = totalItems;
    cartBadge.style.display = totalItems > 0 ? "flex" : "none";
  }
}

// ============================================
// Retry Button & Event Listeners
// ============================================

/**
 * Retry button - Reset retry count and fetch again
 */
retryBtn.addEventListener("click", () => {
  retryCount = 0;
  fetchProducts();
});

// ============================================
// Page Initialization
// ============================================

/**
 * Initialize application on DOM content loaded
 */
document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 E-Commerce Website Initializing...");

  // Check and display network status
  const online = isOnline();
  updateNetworkStatus(online);
  if (!online) {
    console.warn("⚠ Initial load: No network connection detected");
  }

  // Initialize UI
  updateCartBadge();
  initializeAddToCartButtons();

  // Fetch products
  fetchProducts();

  console.log("✓ E-Commerce Website Loaded Successfully");
  console.log("API Endpoint:", API_URL);
  console.log("Cache Duration:", API_CACHE_DURATION / 1000, "seconds");
  console.log("Request Timeout:", API_TIMEOUT, "ms");
});
