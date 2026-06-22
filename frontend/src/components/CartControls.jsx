import React from 'react';
import { useDispatch } from 'react-redux';
import { updateQuantity, removeItem } from '@/store/cartSlice';

export const CartControls = ({ item }) => {
  const dispatch = useDispatch();

  const dec = () => dispatch(updateQuantity({ productId: item.productId, quantity: item.quantity - 1 }));
  const inc = () => dispatch(updateQuantity({ productId: item.productId, quantity: item.quantity + 1 }));
  const onRemove = () => dispatch(removeItem(item.productId));

  return (
    <div className="flex items-center gap-2">
      <button onClick={dec} className="btn-muted px-3 py-2">−</button>
      <span className="px-3">{item.quantity}</span>
      <button onClick={inc} className="btn-muted px-3 py-2">+</button>
      <button onClick={onRemove} className="btn-outline px-3 py-2">Remove</button>
    </div>
  );
};

export default CartControls;
