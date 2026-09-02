export const api = {
  searchProducts: "/api/products/search", filterProducts: "/api/products/filter", recommendations: "/api/products/recommendations", shipping: "/api/shipping/estimate", cart: "/api/cart", cartItems: "/api/cart/items", cartCoupon: "/api/cart/coupon", wishlist: "/api/wishlist", wishlistItems: "/api/wishlist/items", orders: "/api/orders", checkout: "/api/checkout",
} as const;

export function endpoint(path: string, id?: string) { return id ? `${path}/${encodeURIComponent(id)}` : path; }
