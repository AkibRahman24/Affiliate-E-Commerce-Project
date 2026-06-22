import { configureStore } from '@reduxjs/toolkit';
import cartReducer, { CART_STORAGE_KEY } from './cartSlice';

const store = configureStore({
  reducer: {
    cart: cartReducer,
  },
});

// Persist cart to localStorage
store.subscribe(() => {
  try {
    const state = store.getState();
    const toSave = { items: state.cart.items || [] };
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(toSave));
  } catch (err) {
    // ignore
  }
});

export default store;
