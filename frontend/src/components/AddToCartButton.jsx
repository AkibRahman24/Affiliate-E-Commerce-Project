import React from 'react';
import { useDispatch } from 'react-redux';
import { addItem } from '@/store/cartSlice';

export const AddToCartButton = ({ product, quantity = 1, className = '' }) => {
  const dispatch = useDispatch();

  const handle = (e) => {
    e.preventDefault();
    dispatch(addItem({ product, quantity }));
  };

  return (
    <button onClick={handle} className={`btn btn-primary ${className}`}>
      Add to cart
    </button>
  );
};

export default AddToCartButton;
