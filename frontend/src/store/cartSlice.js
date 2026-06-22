import { createSlice } from '@reduxjs/toolkit';

export const CART_STORAGE_KEY = 'affiliate_cart_v1';

const loadFromStorage = () => {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return { items: [] };
    return JSON.parse(raw);
  } catch (err) {
    return { items: [] };
  }
};

const initialState = loadFromStorage();

const findIndex = (items, productId) => items.findIndex((it) => it.productId === productId);

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem: (state, action) => {
      const { product, quantity = 1 } = action.payload;
      const productId = product._id || product.id || product.productId;
      const idx = findIndex(state.items, productId);
      if (idx !== -1) {
        state.items[idx].quantity = Math.min(999, state.items[idx].quantity + quantity);
      } else {
        state.items.push({
          productId,
          name: product.name,
          price: product.price,
          image: product.image,
          description: product.description,
          category: product.category,
          quantity,
        });
      }
    },
    removeItem: (state, action) => {
      const productId = action.payload;
      state.items = state.items.filter((it) => it.productId !== productId);
    },
    updateQuantity: (state, action) => {
      const { productId, quantity } = action.payload;
      const idx = findIndex(state.items, productId);
      if (idx !== -1) {
        state.items[idx].quantity = Math.max(0, Math.min(999, Number(quantity) || 0));
        if (state.items[idx].quantity === 0) {
          state.items.splice(idx, 1);
        }
      }
    },
    clearCart: (state) => {
      state.items = [];
    },
    setCart: (state, action) => {
      state.items = action.payload.items || [];
    },
  },
});

export const { addItem, removeItem, updateQuantity, clearCart, setCart } = cartSlice.actions;

export const selectCartItems = (state) => state.cart.items || [];
export const selectCartCount = (state) => (state.cart.items || []).reduce((s, it) => s + it.quantity, 0);
export const selectCartTotal = (state) => (state.cart.items || []).reduce((s, it) => s + it.price * it.quantity, 0);

export default cartSlice.reducer;
