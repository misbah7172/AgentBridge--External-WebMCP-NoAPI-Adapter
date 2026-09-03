export interface Env { TARGET_ORIGIN: string; ORIGIN_UPSTREAM?: string; }

class BridgeInjector { constructor(private readonly bridgeUrl: string) {} element(element: Element) { element.append(`<script type="module" src="${this.bridgeUrl}"></script>`, { html: true }); } }

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const publicOrigin = new URL(env.TARGET_ORIGIN); const incoming = new URL(request.url);
    if (incoming.pathname === "/__agentbridge/webmcp-bridge.js") return new Response(BRIDGE_SOURCE, { headers: { "content-type": "text/javascript; charset=utf-8", "cache-control": "no-store" } });
    if (incoming.origin !== publicOrigin.origin) return new Response("Adapter origin mismatch", { status: 403 });
    const upstream = new URL(env.ORIGIN_UPSTREAM ?? env.TARGET_ORIGIN); upstream.pathname = incoming.pathname; upstream.search = incoming.search;
    const response = await fetch(new Request(upstream, request)); if (!response.headers.get("content-type")?.includes("text/html")) return response;
    const headers = new Headers(response.headers); headers.delete("content-length"); headers.delete("content-security-policy");
    return new HTMLRewriter().on("body", new BridgeInjector(`${incoming.origin}/__agentbridge/webmcp-bridge.js`)).transform(new Response(response.body, { status: response.status, headers }));
  },
} satisfies ExportedHandler<Env>;

// This injected bridge uses DOM navigation, form fields, and button clicks only.
// It intentionally makes no REST/API request to the origin application.
const BRIDGE_SOURCE = String.raw`
const schema=(properties,required=[])=>({type:'object',properties,required,additionalProperties:false});
const S={s:{type:'string'},i:{type:'integer',minimum:1},b:{type:'boolean'}};
const esc=v=>CSS.escape(String(v));
const page=path=>{location.assign(path);return {success:true,uiAction:'navigate',destination:path}};
const click=selector=>{const e=document.querySelector(selector);if(!(e instanceof HTMLElement))return {success:false,error:{code:'UI_ELEMENT_NOT_FOUND',message:'Required visible UI element is not available on this page.',selector}};e.click();return {success:true,uiAction:'click',selector}};
const fill=(selector,value)=>{const e=document.querySelector(selector);if(!(e instanceof HTMLInputElement||e instanceof HTMLTextAreaElement||e instanceof HTMLSelectElement))return {success:false,error:{code:'UI_FIELD_NOT_FOUND',message:'Required visible form field is not available.',selector}};e.value=String(value);e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));return null};
const confirm=(name,input,go)=>input.confirmed===true?go():({success:true,requiresConfirmation:true,action:name,message:name+' requires explicit user confirmation.'});
const protectedTool=new Set(['get_cart','add_to_cart','update_cart','remove_from_cart','clear_cart','get_wishlist','add_to_wishlist','remove_from_wishlist','get_orders','get_order_details','cancel_order','apply_coupon','checkout']);
const T=[
['search_products','Navigate the visible catalog UI with a search query.',schema({query:S.s}),i=>page('/products?q='+encodeURIComponent(i.query||''))],
['get_product_details','Open a visible product card by its DOM-exposed product identifier. Run after searching or browsing the catalog.',schema({productId:S.s},['productId']),i=>click('[data-agentbridge-product-id="'+esc(i.productId)+'"][data-agentbridge-action="view-product"]')],
['filter_products','Navigate the catalog UI using its category filter query.',schema({category:S.s}),i=>page('/products?category='+encodeURIComponent(i.category||''))],
['sort_products','Navigate the catalog UI; sorting is performed by the rendered storefront.',schema({sort:S.s}),()=>page('/products')],
['get_product_recommendations','Open the rendered product catalog for browsing recommendations.',schema({category:S.s}),i=>page('/products'+(i.category?'?category='+encodeURIComponent(i.category):''))],
['get_shipping_estimate','Open the visible checkout UI where shipping information can be entered.',schema({postalCode:S.s,country:S.s},['postalCode','country']),()=>page('/checkout')],
['get_cart','Open the signed-in user’s rendered cart.',schema({}),()=>page('/cart')],
['add_to_cart','Click the visible Add to cart button for a product currently rendered in the browser.',schema({productId:S.s,quantity:S.i},['productId','quantity']),i=>click('[data-agentbridge-product-id="'+esc(i.productId)+'"] [data-agentbridge-action="add-to-cart"]')],
['update_cart','Open the visible cart UI to edit quantities.',schema({itemId:S.s,quantity:S.i},['itemId','quantity']),()=>page('/cart')],
['remove_from_cart','Click the visible Remove button for a rendered cart item. Requires confirmation.',schema({itemId:S.s,confirmed:S.b},['itemId']),i=>confirm('remove_from_cart',i,()=>click('[data-agentbridge-cart-item="'+esc(i.itemId)+'"] [data-agentbridge-action="remove-cart-item"]'))],
['clear_cart','Click the visible Clear cart control. Requires confirmation.',schema({confirmed:S.b}),i=>confirm('clear_cart',i,()=>click('[data-agentbridge-action="clear-cart"]'))],
['get_wishlist','Open the signed-in user’s rendered wishlist.',schema({}),()=>page('/wishlist')],
['add_to_wishlist','Click the visible Save button for a product currently rendered in the browser.',schema({productId:S.s},['productId']),i=>click('[data-agentbridge-product-id="'+esc(i.productId)+'"] [data-agentbridge-action="add-to-wishlist"]')],
['remove_from_wishlist','Click the visible Remove button for a rendered wishlist product.',schema({productId:S.s},['productId']),i=>click('[data-agentbridge-wishlist-product="'+esc(i.productId)+'"] [data-agentbridge-action="remove-wishlist-item"]')],
['get_orders','Open the signed-in user’s rendered order history.',schema({}),()=>page('/account/orders')],
['get_order_details','Open the rendered confirmation page for an order identifier.',schema({orderId:S.s},['orderId']),i=>page('/order-success/'+encodeURIComponent(i.orderId))],
['cancel_order','Order cancellation is not exposed by the visible demo UI.',schema({orderId:S.s,confirmed:S.b},['orderId']),()=>({success:false,error:{code:'UI_ACTION_UNAVAILABLE',message:'Cancellation is unavailable in the visible storefront UI.'}})],
['apply_coupon','Fill the visible coupon field and click Apply.',schema({code:S.s},['code']),i=>{const r=fill('[data-agentbridge-field="coupon"]',i.code);return r||click('[data-agentbridge-action="apply-coupon"]')}],
['checkout','Fill the visible checkout form and click Place mock order. Requires confirmation.',schema({country:S.s,postalCode:S.s,confirmed:S.b},['country','postalCode']),i=>confirm('checkout',i,()=>{const a=fill('[data-agentbridge-field="country"]',i.country);const b=fill('[data-agentbridge-field="postalCode"]',i.postalCode);return a||b||click('[data-agentbridge-action="place-order"]')})]
];
if(document.modelContext){const controller=new AbortController;const authenticated=()=>!!document.querySelector('[data-agentbridge-session="authenticated"]');for(const [name,description,inputSchema,execute] of T){if(authenticated()||!protectedTool.has(name))document.modelContext.registerTool({name,description,inputSchema,execute},{signal:controller.signal});}addEventListener('pagehide',()=>controller.abort(),{once:true});}
`;
