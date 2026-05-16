const PRODUCT_API_BASE = "https://fakestoreapi.com/products/";
const API_CACHE_KEY = "products_cache";
const API_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const API_TIMEOUT = 10000; // 10 seconds

const detailContent = document.getElementById("detail-content");
const detailLoading = document.getElementById("detail-loading");
const detailError = document.getElementById("detail-error");
const detailErrorMessage = document.getElementById("detail-error-message");
const detailRetryBtn = document.getElementById("detail-retry-btn");

const productId = getProductIdFromUrl();
let currentProduct = null;
let selectedOptions = {
  size: "M",
  color: "graphite",
};
let selectedQuantity = 1;

const VARIATIONS = {
  size: [
    { label: "Small", value: "S", modifier: 0 },
    { label: "Medium", value: "M", modifier: 2 },
    { label: "Large", value: "L", modifier: 4 },
    { label: "X-Large", value: "XL", modifier: 6 },
  ],
  color: [
    { label: "Graphite", value: "graphite", modifier: 0 },
    { label: "Arctic Blue", value: "arctic-blue", modifier: 3 },
    { label: "Sunset Sand", value: "sunset-sand", modifier: 4 },
    { label: "Forest Green", value: "forest-green", modifier: 5 },
  ],
};

function getVariationModifier() {
  const sizeOption = VARIATIONS.size.find(
    (option) => option.value === selectedOptions.size,
  );
  const colorOption = VARIATIONS.color.find(
    (option) => option.value === selectedOptions.color,
  );
  return (sizeOption?.modifier || 0) + (colorOption?.modifier || 0);
}

function calculateTotalPrice(product) {
  const base = product.price || 0;
  const modifier = getVariationModifier();
  return (base + modifier) * selectedQuantity;
}

function formatCurrency(amount) {
  return `$${amount.toFixed(2)}`;
}

function showSuccessMessage(message) {
  let successElement = document.getElementById("detail-success");
  if (!successElement) {
    successElement = document.createElement("div");
    successElement.id = "detail-success";
    successElement.className = "success-message";
    detailContent.parentNode.insertBefore(successElement, detailContent);
  }
  successElement.textContent = message;
  successElement.style.display = "block";
  setTimeout(() => {
    successElement.style.display = "none";
  }, 1800);
}

function getProductIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  return id ? Number(id) : null;
}

function isOnline() {
  return navigator.onLine;
}

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

function showLoading() {
  detailLoading.style.display = "flex";
  detailError.style.display = "none";
  detailContent.style.display = "none";
}

function hideLoading() {
  detailLoading.style.display = "none";
}

function showError(message) {
  detailLoading.style.display = "none";
  detailContent.style.display = "none";
  detailError.style.display = "flex";
  detailErrorMessage.textContent = message;
}

function getCachedProducts() {
  const cached = localStorage.getItem(API_CACHE_KEY);
  if (!cached) return null;

  try {
    const { data, timestamp } = JSON.parse(cached);
    const isExpired = Date.now() - timestamp > API_CACHE_DURATION;
    if (isExpired) {
      localStorage.removeItem(API_CACHE_KEY);
      return null;
    }
    return data;
  } catch (error) {
    localStorage.removeItem(API_CACHE_KEY);
    return null;
  }
}

function setCachedProducts(products) {
  try {
    localStorage.setItem(
      API_CACHE_KEY,
      JSON.stringify({ data: products, timestamp: Date.now() }),
    );
  } catch (error) {
    console.error("Unable to cache product details:", error);
  }
}

function fetchWithTimeout(url, timeout = API_TIMEOUT) {
  return Promise.race([
    fetch(url),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Request timeout")), timeout),
    ),
  ]);
}

function escapeHtml(text) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return String(text).replace(/[&<>"']/g, (char) => map[char]);
}

function updateCartBadge() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const cartBadge = document.querySelector(".cart-badge");
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  if (cartBadge) {
    cartBadge.textContent = totalItems;
    cartBadge.style.display = totalItems > 0 ? "flex" : "none";
  }
}

function addToCart(product, options = {}, quantity = 1) {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const existingItem = cart.find(
    (item) =>
      item.id === product.id &&
      item.options?.size === options.size &&
      item.options?.color === options.color,
  );

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.push({
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.image,
      quantity,
      options,
      unitPrice: product.price + getVariationModifier(),
    });
  }
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartBadge();
}

function validateProduct(product) {
  if (
    !product ||
    !product.id ||
    !product.title ||
    !product.price ||
    !product.image
  ) {
    throw new Error("Invalid product data");
  }
}

function buildGallery(product) {
  if (Array.isArray(product.images) && product.images.length > 0) {
    return product.images;
  }
  return [product.image];
}

function renderProductDetail(product) {
  currentProduct = product;
  selectedQuantity = 1;
  selectedOptions = { size: "M", color: "graphite" };

  const safeTitle = escapeHtml(product.title);
  const safeDescription = escapeHtml(product.description);
  const safeCategory = escapeHtml(product.category);
  const ratingValue = Math.round(product.rating?.rate || 4.5);
  const stars = "★".repeat(ratingValue) + "☆".repeat(5 - ratingValue);
  const galleryImages = buildGallery(product);

  detailContent.innerHTML = `
    <div class="product-detail-wrapper">
      <div class="detail-gallery">
        <div class="main-image-frame">
          <img
            id="detail-main-image"
            src="${galleryImages[0]}"
            alt="${safeTitle}"
            class="zoom-image"
            loading="lazy"
            decoding="async"
          />
          <div id="detail-zoom-preview" class="zoom-preview"></div>
        </div>
        <div class="thumbnail-list">
          ${galleryImages
            .map(
              (image, index) => `
            <button class="thumbnail-button" data-image="${image}" aria-label="View image ${index + 1}">
              <img src="${image}" alt="${safeTitle} view ${index + 1}" loading="lazy" decoding="async" />
            </button>
          `,
            )
            .join("")}
        </div>
      </div>

      <div class="product-detail-info">
        <span class="product-category">${safeCategory}</span>
        <h2 class="detail-title">${safeTitle}</h2>
        <p class="detail-description">${safeDescription}</p>

        <div class="detail-options">
          <div class="option-group">
            <span class="option-label">Size</span>
            <div class="option-list size-options">
              ${VARIATIONS.size
                .map(
                  (option) => `
                <button class="variation-button size-option-button ${
                  option.value === selectedOptions.size ? "active" : ""
                }" type="button" data-option="size" data-value="${option.value}">
                  ${option.label}
                </button>
              `,
                )
                .join("")}
            </div>
          </div>

          <div class="option-group">
            <span class="option-label">Color</span>
            <div class="option-list color-options">
              ${VARIATIONS.color
                .map(
                  (option) => `
                <button class="variation-button color-option-button ${
                  option.value === selectedOptions.color ? "active" : ""
                }" type="button" data-option="color" data-value="${option.value}">
                  ${option.label}
                </button>
              `,
                )
                .join("")}
            </div>
          </div>
        </div>

        <div class="quantity-block">
          <span class="option-label">Quantity</span>
          <div class="quantity-control">
            <button class="qty-btn" type="button" data-action="decrease" aria-label="Decrease quantity">−</button>
            <input id="quantity-input" type="text" value="${selectedQuantity}" readonly />
            <button class="qty-btn" type="button" data-action="increase" aria-label="Increase quantity">+</button>
          </div>
        </div>

        <div class="total-line">
          <span>Total Price</span>
          <strong id="detail-total-price">${formatCurrency(calculateTotalPrice(product))}</strong>
        </div>

        <div id="detail-selected-summary" class="selected-summary">
          Selected: ${selectedOptions.size}, ${selectedOptions.color} • Qty ${selectedQuantity}
        </div>

        <div class="detail-meta">
          <div class="detail-rating">
            <span class="stars" title="${ratingValue}/5 stars">${stars}</span>
            <span class="rating-count">${product.rating?.count || 0} reviews</span>
          </div>
          <div class="detail-price">
            <span class="price-current">$${product.price.toFixed(2)}</span>
            <span class="price-original">$${(product.price * 1.2).toFixed(2)}</span>
          </div>
        </div>

        <button id="detail-add-to-cart-btn" class="add-to-cart-btn" type="button">
          Add to Cart
        </button>
      </div>
    </div>
  `;

  const mainImage = document.getElementById("detail-main-image");
  const zoomPreview = document.getElementById("detail-zoom-preview");
  const totalPriceElement = document.getElementById("detail-total-price");

  const updateSummary = () => {
    const summaryElement = document.getElementById("detail-selected-summary");
    if (summaryElement) {
      summaryElement.textContent = `Selected: ${selectedOptions.size}, ${selectedOptions.color} • Qty ${selectedQuantity}`;
    }
  };

  const updatePrice = () => {
    if (totalPriceElement) {
      totalPriceElement.textContent = formatCurrency(
        calculateTotalPrice(product),
      );
    }
    updateSummary();
  };

  const updateVariationButtons = (optionType, selectedValue) => {
    document
      .querySelectorAll(`.variation-button[data-option="${optionType}"]`)
      .forEach((button) => {
        button.classList.toggle(
          "active",
          button.dataset.value === selectedValue,
        );
      });
  };

  const setQuantity = (nextQuantity) => {
    selectedQuantity = Math.max(1, Math.min(10, nextQuantity));
    const quantityInput = document.getElementById("quantity-input");
    if (quantityInput) {
      quantityInput.value = selectedQuantity;
    }
    updatePrice();
  };

  document.querySelectorAll(".variation-button").forEach((button) => {
    button.addEventListener("click", () => {
      const optionType = button.dataset.option;
      const optionValue = button.dataset.value;
      selectedOptions[optionType] = optionValue;
      updateVariationButtons(optionType, optionValue);
      updatePrice();
    });
  });

  document.querySelectorAll(".qty-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.action;
      const nextQuantity =
        action === "increase" ? selectedQuantity + 1 : selectedQuantity - 1;
      setQuantity(nextQuantity);
    });
  });

  const setZoomPosition = (clientX, clientY) => {
    if (!mainImage || !zoomPreview) return;
    const rect = mainImage.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const posX = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const posY = Math.max(0, Math.min(100, (y / rect.height) * 100));
    zoomPreview.style.backgroundImage = `url(${mainImage.src})`;
    zoomPreview.style.backgroundPosition = `${posX}% ${posY}%`;
    zoomPreview.style.opacity = "1";
  };

  const hideZoom = () => {
    if (zoomPreview) {
      zoomPreview.style.opacity = "0";
    }
  };

  const mainImageFrame = document.querySelector(".main-image-frame");
  if (mainImageFrame) {
    mainImageFrame.addEventListener("mousemove", (event) => {
      setZoomPosition(event.clientX, event.clientY);
    });
    mainImageFrame.addEventListener("mouseleave", hideZoom);
    mainImageFrame.addEventListener("touchmove", (event) => {
      const touch = event.touches[0];
      if (touch) {
        setZoomPosition(touch.clientX, touch.clientY);
      }
    });
    mainImageFrame.addEventListener("touchend", hideZoom);
  }

  const thumbnailButtons = document.querySelectorAll(".thumbnail-button");
  thumbnailButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const selectedImage = button.dataset.image;
      if (mainImage && selectedImage) {
        mainImage.src = selectedImage;
        if (zoomPreview) {
          zoomPreview.style.backgroundImage = `url(${selectedImage})`;
        }
      }
    });
  });

  document
    .getElementById("detail-add-to-cart-btn")
    .addEventListener("click", () => {
      addToCart(product, selectedOptions, selectedQuantity);
      showSuccessMessage(
        `${selectedQuantity} item${selectedQuantity > 1 ? "s" : ""} added to cart`,
      );
      const button = document.getElementById("detail-add-to-cart-btn");
      button.textContent = "Added! ✓";
      button.disabled = true;
      setTimeout(() => {
        button.textContent = "Add to Cart";
        button.disabled = false;
      }, 1500);
    });

  detailContent.style.display = "grid";
}

async function fetchProductDetail() {
  if (!productId) {
    showError("Invalid product selected. Please choose a valid item.");
    return;
  }

  showLoading();

  try {
    const cachedProducts = getCachedProducts();
    let product = cachedProducts?.find((item) => item.id === productId);

    if (!product) {
      const response = await fetchWithTimeout(
        `${PRODUCT_API_BASE}${productId}`,
      );
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      product = await response.json();
    }

    validateProduct(product);
    renderProductDetail(product);
    hideLoading();
  } catch (error) {
    console.error("Error loading product detail:", error);
    showError(
      error.message.includes("timeout")
        ? "Request timed out. Check your connection and try again."
        : "Unable to load product detail. Please refresh or try again later.",
    );
  }
}

window.addEventListener("online", () => {
  updateNetworkStatus(true);
  if (!currentProduct) {
    fetchProductDetail();
  }
});

window.addEventListener("offline", () => {
  updateNetworkStatus(false);
});

detailRetryBtn.addEventListener("click", fetchProductDetail);

document.addEventListener("DOMContentLoaded", () => {
  updateNetworkStatus(isOnline());
  updateCartBadge();
  fetchProductDetail();
});
