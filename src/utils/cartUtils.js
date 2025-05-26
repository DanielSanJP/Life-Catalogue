// cartUtils.js - Helper functions for cart management

/**
 * Add a fish to the shopping cart
 * @param {Object} fish - The fish object to add
 * @param {number} quantity - Quantity to add (default: 1)
 * @returns {Array} Updated cart array
 */
export const addToCart = (fish, quantity = 1) => {
  const existingCart = JSON.parse(localStorage.getItem("fishCart") || "[]");

  const existingItemIndex = existingCart.findIndex(
    (item) => item.id === fish.id
  );

  if (existingItemIndex > -1) {
    // Item already exists, update quantity
    existingCart[existingItemIndex].quantity += quantity;
  } else {
    // Add new item to cart
    existingCart.push({
      id: fish.id,
      name: fish.name,
      scientific_name: fish.scientific_name,
      price: parseFloat(fish.price),
      image_url: fish.image_url,
      stock: fish.stock,
      quantity: quantity,
    });
  }

  localStorage.setItem("fishCart", JSON.stringify(existingCart));

  // Dispatch custom event to notify other components
  window.dispatchEvent(
    new CustomEvent("cartUpdated", {
      detail: { cart: existingCart },
    })
  );

  return existingCart;
};

/**
 * Remove a fish from the cart completely
 * @param {number} fishId - ID of the fish to remove
 * @returns {Array} Updated cart array
 */
export const removeFromCart = (fishId) => {
  const existingCart = JSON.parse(localStorage.getItem("fishCart") || "[]");
  const updatedCart = existingCart.filter((item) => item.id !== fishId);

  localStorage.setItem("fishCart", JSON.stringify(updatedCart));

  window.dispatchEvent(
    new CustomEvent("cartUpdated", {
      detail: { cart: updatedCart },
    })
  );

  return updatedCart;
};

/**
 * Update the quantity of a specific item in the cart
 * @param {number} fishId - ID of the fish to update
 * @param {number} newQuantity - New quantity (if 0 or less, item will be removed)
 * @returns {Array} Updated cart array
 */
export const updateCartItemQuantity = (fishId, newQuantity) => {
  if (newQuantity <= 0) {
    return removeFromCart(fishId);
  }

  const existingCart = JSON.parse(localStorage.getItem("fishCart") || "[]");
  const updatedCart = existingCart.map((item) =>
    item.id === fishId ? { ...item, quantity: newQuantity } : item
  );

  localStorage.setItem("fishCart", JSON.stringify(updatedCart));

  window.dispatchEvent(
    new CustomEvent("cartUpdated", {
      detail: { cart: updatedCart },
    })
  );

  return updatedCart;
};

/**
 * Get the current cart items
 * @returns {Array} Cart items array
 */
export const getCart = () => {
  return JSON.parse(localStorage.getItem("fishCart") || "[]");
};

/**
 * Get the total number of items in the cart
 * @returns {number} Total item count
 */
export const getCartItemCount = () => {
  const cart = getCart();
  return cart.reduce((total, item) => total + item.quantity, 0);
};

/**
 * Get the total price of all items in the cart
 * @returns {number} Total cart value
 */
export const getCartTotal = () => {
  const cart = getCart();
  return cart.reduce(
    (total, item) => total + parseFloat(item.price) * item.quantity,
    0
  );
};

/**
 * Clear all items from the cart
 */
export const clearCart = () => {
  localStorage.removeItem("fishCart");
  window.dispatchEvent(
    new CustomEvent("cartUpdated", {
      detail: { cart: [] },
    })
  );
};

/**
 * Check if a specific fish is in the cart
 * @param {number} fishId - ID of the fish to check
 * @returns {Object|null} Cart item if found, null otherwise
 */
export const getCartItem = (fishId) => {
  const cart = getCart();
  return cart.find((item) => item.id === fishId) || null;
};

/**
 * Get the quantity of a specific fish in the cart
 * @param {number} fishId - ID of the fish to check
 * @returns {number} Quantity in cart (0 if not found)
 */
export const getCartItemQuantity = (fishId) => {
  const item = getCartItem(fishId);
  return item ? item.quantity : 0;
};

/**
 * Check if cart is empty
 * @returns {boolean} True if cart is empty
 */
export const isCartEmpty = () => {
  return getCart().length === 0;
};

/**
 * Get formatted cart total as currency string
 * @returns {string} Formatted total (e.g., "25.99")
 */
export const getFormattedCartTotal = () => {
  return getCartTotal().toFixed(2);
};
