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
// Product Grid
// ============================================
const API_URL = "https://fakestoreapi.com/products?limit=12";
const productGrid = document.getElementById("product-grid");
const loadingContainer = document.getElementById("loading");
const errorContainer = document.getElementById("error");
const errorMessage = document.getElementById("error-message");
const retryBtn = document.getElementById("retry-btn");

// Store products in memory for cart functionality
let productsData = [];

// Fetch products from API
async function fetchProducts() {
  try {
    loadingContainer.style.display = "flex";
    errorContainer.style.display = "none";
    productGrid.innerHTML = "";

    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    productsData = await response.json();
    console.log("Products loaded:", productsData);

    renderProducts(productsData);
    loadingContainer.style.display = "none";
  } catch (error) {
    console.error("Error fetching products:", error);
    loadingContainer.style.display = "none";
    errorContainer.style.display = "flex";
    errorMessage.textContent =
      "Failed to load products. Please check your connection and try again.";
  }
}

// Render products to the grid
function renderProducts(products) {
  productGrid.innerHTML = "";

  products.forEach((product, index) => {
    const card = createProductCard(product, index);
    productGrid.appendChild(card);
  });
}

// Create individual product card
function createProductCard(product, index) {
  const card = document.createElement("div");
  card.className = "product-card";
  card.style.animationDelay = `${index * 0.05}s`;

  // Format price
  const originalPrice = (product.price * 1.2).toFixed(2);
  const discount = Math.round(
    ((originalPrice - product.price) / originalPrice) * 100,
  );

  // Create stars rating
  const rating = Math.floor(product.rating?.rate || 4.5);
  const stars = "★".repeat(rating) + "☆".repeat(5 - rating);

  card.innerHTML = `
    <div class="product-image-container">
      <img
        src="${product.image}"
        alt="${product.title}"
        class="product-image"
        loading="lazy"
      />
      ${discount > 0 ? `<div class="product-badge">-${discount}%</div>` : ""}
    </div>
    <div class="product-info">
      <span class="product-category">${product.category}</span>
      <h3 class="product-name">${product.title}</h3>
      <p class="product-description">${product.description}</p>
      <div class="product-rating">
        <span class="stars">${stars}</span>
        <span class="rating-count">${product.rating?.count || 0} reviews</span>
      </div>
      <div class="product-footer">
        <div class="product-price">
          <span class="price-current">$${product.price.toFixed(2)}</span>
          ${originalPrice != product.price ? `<span class="price-original">$${originalPrice}</span>` : ""}
        </div>
        <button class="add-to-cart-btn" data-product-id="${product.id}">
          Add to Cart
        </button>
      </div>
    </div>
  `;

  return card;
}

// Add to Cart functionality
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

// Add to Cart (localStorage integration)
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
  console.log("Product added to cart:", product.title);
}

// Update cart badge count
function updateCartBadge() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const cartBadge = document.querySelector(".cart-badge");
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (cartBadge) {
    cartBadge.textContent = totalItems;
    cartBadge.style.display = totalItems > 0 ? "flex" : "none";
  }
}

// Retry button functionality
retryBtn.addEventListener("click", fetchProducts);

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  updateCartBadge();
  fetchProducts();
  initializeAddToCartButtons();
  console.log("E-Commerce Website Loaded");
});
