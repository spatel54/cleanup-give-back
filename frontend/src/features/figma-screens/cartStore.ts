import { useSyncExternalStore } from 'react';

import {
  cartItemCount,
  type CartDonationAmount,
  type CartLineItem,
} from './mocks/cart';

export type CartProductInput = {
  id: string;
  name: string;
  unitPrice: number;
  image: number;
  description?: string;
};

/** Starts empty — shop only shows what the user adds. */
let cartItems: CartLineItem[] = [];
let cartDonation: CartDonationAmount | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

export function getCartItems(): CartLineItem[] {
  return cartItems;
}

export function getCartDonation(): CartDonationAmount | null {
  return cartDonation;
}

export function subscribeCartItems(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useCartItems(): CartLineItem[] {
  return useSyncExternalStore(subscribeCartItems, getCartItems, getCartItems);
}

export function useCartDonation(): CartDonationAmount | null {
  return useSyncExternalStore(subscribeCartItems, getCartDonation, getCartDonation);
}

export function useCartItemCount(): number {
  const items = useCartItems();
  return cartItemCount(items);
}

export function setCartItems(next: CartLineItem[] | ((prev: CartLineItem[]) => CartLineItem[])) {
  cartItems = typeof next === 'function' ? next(cartItems) : next;
  notify();
}

export function setCartDonation(next: CartDonationAmount | null) {
  cartDonation = next;
  notify();
}

export function updateCartQuantity(id: string, quantity: number) {
  const nextQty = Math.max(1, quantity);
  setCartItems((prev) =>
    prev.map((item) => (item.id === id ? { ...item, quantity: nextQty } : item)),
  );
}

export function removeCartItem(id: string) {
  setCartItems((prev) => prev.filter((item) => item.id !== id));
}

/** Adds quantity to an existing line, or inserts a new line. */
export function addCartItem(input: CartProductInput, quantity = 1) {
  const qty = Math.max(1, quantity);
  setCartItems((prev) => {
    const existing = prev.find((item) => item.id === input.id);
    if (existing) {
      return prev.map((item) =>
        item.id === input.id
          ? {
              ...item,
              quantity: item.quantity + qty,
              description: item.description || input.description || '',
            }
          : item,
      );
    }
    return [
      ...prev,
      {
        id: input.id,
        name: input.name,
        description: input.description ?? '',
        unitPrice: input.unitPrice,
        quantity: qty,
        image: input.image,
      },
    ];
  });
}

/** Clears line items after purchase. */
export function clearCart() {
  cartItems = [];
  cartDonation = null;
  notify();
}

/** Test/dev helper — empties the cart. */
export function resetCartItems() {
  clearCart();
}
