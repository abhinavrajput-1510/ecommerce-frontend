const cartItemsContainer = document.getElementById("cart-items");
const cartEmptyState = document.getElementById("cart-empty");
const cartSummary = document.getElementById("cart-summary");
const cartTotalAmount = document.getElementById("cart-total");
const checkoutBtn = document.getElementById("checkout-btn");

function getCart() {
  return JSON.parse(localStorage.getItem("cart")) || [];
}

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartBadge();
}

function formatCurrency(amount) {
  return `$${amount.toFixed(2)}`;
}

function updateCartBadge() {
  const cart = getCart();
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartBadge = document.querySelector(".cart-badge");
  if (cartBadge) {
    cartBadge.textContent = totalItems;
    cartBadge.style.display = totalItems > 0 ? "flex" : "none";
  }
}

function calculateCartTotal(cart) {
  return cart.reduce(
    (total, item) => total + (item.unitPrice || item.price) * item.quantity,
    0,
  );
}

function getOptionsLabel(options) {
  if (!options) {
    return "";
  }

  const parts = [];
  if (options.size) parts.push(`Size: ${options.size}`);
  if (options.color) parts.push(`Color: ${options.color}`);
  return parts.join(" • ");
}

function renderCart() {
  const cart = getCart();

  cartItemsContainer.innerHTML = "";

  if (!cart.length) {
    cartEmptyState.style.display = "flex";
    cartSummary.style.display = "none";
    checkoutBtn.disabled = true;
    return;
  }

  cartEmptyState.style.display = "none";
  cartSummary.style.display = "block";
  checkoutBtn.disabled = false;

  cart.forEach((item, index) => {
    const itemOptions = getOptionsLabel(item.options);
    const cartItem = document.createElement("article");
    cartItem.className = "cart-item";
    cartItem.dataset.index = index;
    cartItem.innerHTML = `
      <div class="cart-item-image">
        <img src="${item.image}" alt="${item.title}" loading="lazy" decoding="async" />
      </div>
      <div class="cart-item-details">
        <h3>${item.title}</h3>
        ${itemOptions ? `<p class="item-options">${itemOptions}</p>` : ""}
        <div class="cart-item-meta">
          <span class="item-price">${formatCurrency(item.unitPrice || item.price)}</span>
          <button type="button" class="remove-item-btn">Remove</button>
        </div>
      </div>
      <div class="cart-item-quantity">
        <button type="button" class="qty-btn" data-action="decrease">−</button>
        <input type="text" value="${item.quantity}" readonly aria-label="Quantity" />
        <button type="button" class="qty-btn" data-action="increase">+</button>
      </div>
    `;

    cartItemsContainer.appendChild(cartItem);
  });

  cartTotalAmount.textContent = formatCurrency(calculateCartTotal(cart));
}

function updateItemQuantity(index, change) {
  const cart = getCart();
  const currentItem = cart[index];
  if (!currentItem) return;

  const nextQuantity = Math.max(1, currentItem.quantity + change);
  currentItem.quantity = nextQuantity;
  saveCart(cart);
  renderCart();
}

function removeItem(index) {
  const cart = getCart();
  cart.splice(index, 1);
  saveCart(cart);
  renderCart();
}

cartItemsContainer.addEventListener("click", (event) => {
  const target = event.target;
  const itemElement = target.closest(".cart-item");
  if (!itemElement) return;

  const index = Number(itemElement.dataset.index);

  if (target.classList.contains("qty-btn")) {
    const action = target.dataset.action;
    const change = action === "increase" ? 1 : -1;
    updateItemQuantity(index, change);
  }

  if (target.classList.contains("remove-item-btn")) {
    removeItem(index);
  }
});

checkoutBtn.addEventListener("click", () => {
  const cart = getCart();
  if (!cart.length) return;
  window.location.href = "checkout.html";
});

window.addEventListener("DOMContentLoaded", () => {
  updateCartBadge();
  renderCart();
});
