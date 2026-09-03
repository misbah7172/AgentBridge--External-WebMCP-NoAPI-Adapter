/**
 * Reviewable inventory of the tools registered by worker/index.ts.
 * Runtime execution is intentionally DOM-only: navigation, field entry, and clicks.
 */
export const toolNames = [
  "search_products", "get_product_details", "filter_products", "sort_products",
  "get_product_recommendations", "get_shipping_estimate", "get_cart", "add_to_cart",
  "update_cart", "remove_from_cart", "clear_cart", "get_wishlist", "add_to_wishlist",
  "remove_from_wishlist", "get_orders", "get_order_details", "cancel_order",
  "apply_coupon", "checkout",
] as const;

export const authenticatedToolNames = new Set<string>(toolNames.slice(6));
