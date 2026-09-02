export interface Env { TARGET_ORIGIN: string; ORIGIN_UPSTREAM?: string; }

class BridgeInjector {
  constructor(private readonly bridgeUrl: string) {}
  element(element: Element) { element.append(`<script type="module" src="${this.bridgeUrl}"></script>`, { html: true }); }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const target = new URL(env.TARGET_ORIGIN);
    const incoming = new URL(request.url);
    if (incoming.pathname === "/__agentbridge/webmcp-bridge.js") return new Response(BRIDGE_SOURCE, { headers: { "content-type": "text/javascript; charset=utf-8", "cache-control": "no-store" } });
    if (incoming.origin !== target.origin) return new Response("Adapter origin mismatch", { status: 403 });
    const upstream = new URL(env.ORIGIN_UPSTREAM ?? env.TARGET_ORIGIN); upstream.pathname = incoming.pathname; upstream.search = incoming.search;
    const response = await fetch(new Request(upstream, request));
    if (!response.headers.get("content-type")?.includes("text/html")) return response;
    const headers = new Headers(response.headers); headers.delete("content-length"); headers.delete("content-security-policy");
    return new HTMLRewriter().on("body", new BridgeInjector(`${incoming.origin}/__agentbridge/webmcp-bridge.js`)).transform(new Response(response.body, { status: response.status, headers }));
  },
} satisfies ExportedHandler<Env>;

const BRIDGE_SOURCE = `
const api={search:'/api/products/search',filter:'/api/products/filter',recommendations:'/api/products/recommendations',shipping:'/api/shipping/estimate',cart:'/api/cart',cartItems:'/api/cart/items',coupon:'/api/cart/coupon',wishlist:'/api/wishlist',wishlistItems:'/api/wishlist/items',orders:'/api/orders',checkout:'/api/checkout'};
const q=o=>{const p=new URLSearchParams;Object.entries(o||{}).forEach(([k,v])=>v!==undefined&&v!==null&&v!==''&&p.set(k,String(v)));return p};
const call=async(method,path,query,body)=>{const s=q(query);const r=await fetch(path+(s.size?'?'+s:''),{method,credentials:'same-origin',headers:body?{'content-type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined});return r.json()};
const schema=(properties,required=[])=>({type:'object',properties,required,additionalProperties:false}),S={s:{type:'string'},n:{type:'number'},i:{type:'integer',minimum:1},b:{type:'boolean'}};
const C=(name,i,go)=>i.confirmed===true?go():({success:true,requiresConfirmation:true,action:name,message:name+' requires explicit user confirmation.'});
const T=[
['search_products','Search products by keywords, category, brand, price, rating, and pagination.',schema({query:S.s,category:S.s,minPrice:S.n,maxPrice:S.n,brand:S.s,minRating:S.n,page:S.i,limit:S.i}),i=>call('GET',api.search,{q:i.query,category:i.category,minPrice:i.minPrice,maxPrice:i.maxPrice,brand:i.brand,minRating:i.minRating,page:i.page,limit:i.limit})],
['get_product_details','Get complete details, variants, pricing, and stock for one product.',schema({productId:S.s},['productId']),i=>call('GET','/api/products/'+encodeURIComponent(i.productId))],
['filter_products','Filter products by category, brand, price range, rating, and availability.',schema({category:S.s,brand:S.s,minPrice:S.n,maxPrice:S.n,minRating:S.n,stockStatus:S.s}),i=>call('GET',api.filter,i)],
['sort_products','Sort products by price, rating, newest, or popularity.',schema({sort:{type:'string',enum:['price_asc','price_desc','rating','newest','popularity']},category:S.s},['sort']),i=>call('GET',api.search,i)],
['get_product_recommendations','Get popular or category-related products.',schema({category:S.s}),i=>call('GET',api.recommendations,i)],
['get_shipping_estimate','Estimate shipping cost and delivery window.',schema({postalCode:S.s,country:S.s},['postalCode','country']),i=>call('GET',api.shipping,i)],
['get_cart','Get the signed-in user cart.',schema({}),()=>call('GET',api.cart)],
['add_to_cart','Add a product and optional variant to the signed-in user cart.',schema({productId:S.s,variantId:S.s,quantity:S.i},['productId','quantity']),i=>call('POST',api.cartItems,null,i)],
['update_cart','Set quantity for an existing cart item.',schema({itemId:S.s,quantity:S.i},['itemId','quantity']),i=>call('PATCH',api.cartItems+'/'+encodeURIComponent(i.itemId),null,{quantity:i.quantity})],
['remove_from_cart','Remove a cart item. Requires confirmation.',schema({itemId:S.s,confirmed:S.b},['itemId']),i=>C('remove_from_cart',i,()=>call('DELETE',api.cartItems+'/'+encodeURIComponent(i.itemId)))],
['clear_cart','Clear the cart. Requires confirmation.',schema({confirmed:S.b}),i=>C('clear_cart',i,()=>call('DELETE',api.cart))],
['get_wishlist','Get the signed-in user wishlist.',schema({}),()=>call('GET',api.wishlist)],
['add_to_wishlist','Save a product to the wishlist.',schema({productId:S.s},['productId']),i=>call('POST',api.wishlistItems,null,{productId:i.productId})],
['remove_from_wishlist','Remove a product from the wishlist.',schema({productId:S.s},['productId']),i=>call('DELETE',api.wishlistItems+'/'+encodeURIComponent(i.productId))],
['get_orders','Get signed-in user orders.',schema({}),()=>call('GET',api.orders)],
['get_order_details','Get an order owned by the signed-in user.',schema({orderId:S.s},['orderId']),i=>call('GET',api.orders+'/'+encodeURIComponent(i.orderId))],
['cancel_order','Cancel an eligible order. Requires confirmation.',schema({orderId:S.s,confirmed:S.b},['orderId']),i=>C('cancel_order',i,()=>call('POST',api.orders+'/'+encodeURIComponent(i.orderId)+'/cancel'))],
['apply_coupon','Apply a coupon to the current cart.',schema({code:S.s},['code']),i=>call('POST',api.coupon,null,{code:i.code})],
['checkout','Place a mock order. Requires confirmation.',schema({country:S.s,postalCode:S.s,confirmed:S.b},['country','postalCode']),i=>C('checkout',i,()=>call('POST',api.checkout,null,{country:i.country,postalCode:i.postalCode,paymentMethod:'mock'}))]
];
if(document.modelContext){const c=new AbortController;for(const [name,description,inputSchema,execute] of T)document.modelContext.registerTool({name,description,inputSchema,execute},{signal:c.signal});addEventListener('pagehide',()=>c.abort(),{once:true})}`;
