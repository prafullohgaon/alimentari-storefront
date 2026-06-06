/* eslint-disable @typescript-eslint/no-explicit-any, prefer-rest-params */
/**
 * Telemetry & Commerce Tracking Service - Alimentari
 * Handles GA4, Meta (Facebook) Pixel, and TikTok Pixel tracking integrations.
 * 
 * Safely lazy-loads scripts, defers executions to protect LCP/CLS performance,
 * and strictly respects GDPR cookie consent status.
 */

import { Product } from "@/lib/data";

let isTrackingEnabled = false;
let isInitialized = false;

// Define safe global bindings early on window object to prevent any runtime exceptions
if (typeof window !== "undefined") {
  (window as any).dataLayer = (window as any).dataLayer || [];
  (window as any).gtag = (window as any).gtag || function () {
    if (isTrackingEnabled && process.env.NEXT_PUBLIC_GA_ID) {
      (window as any).dataLayer.push(arguments);
    } else {
      console.log("Telemetry: [Fallback] gtag called but analytics is disabled or not configured.");
    }
  };
}

/**
 * Initialize Analytics third-party script integrations.
 * Strictly respects GDPR consent status.
 */
export function initAnalytics(consentAccepted: boolean) {
  if (typeof window === "undefined") return;

  isTrackingEnabled = consentAccepted;
  if (!consentAccepted) {
    console.log("Telemetry: [GDPR] Non-essential tracking declined. Blocking analytics tags.");
    return;
  }

  if (isInitialized) return;
  isInitialized = true;

  console.log("Telemetry: [GDPR] Tracking accepted. Initializing deferred telemetry channels...");

  // Safely defer initialization of GA4/Pixels to preserve interactive speed and prevent layout shifts
  if (window.requestIdleCallback) {
    window.requestIdleCallback(() => injectThirdPartyScripts());
  } else {
    setTimeout(injectThirdPartyScripts, 2000);
  }
}

/**
 * Safe injection of production tags (GA4, Facebook, TikTok) only when keys are present.
 */
function injectThirdPartyScripts() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const tiktokPixelId = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID;

  if (gaId) {
    console.log(`Telemetry: Injecting GA4 [${gaId}] script tag deferred.`);
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(script);

    (window as any).dataLayer = (window as any).dataLayer || [];
    (window as any).gtag = function () {
      (window as any).dataLayer.push(arguments);
    };
    (window as any).gtag("js", new Date());
    (window as any).gtag("config", gaId, { page_path: window.location.pathname });
  }

  if (metaPixelId) {
    console.log(`Telemetry: Injecting Meta Pixel [${metaPixelId}] deferment.`);
    // Abstract Meta Pixel initializations would be placed here in live production
  }

  if (tiktokPixelId) {
    console.log(`Telemetry: Injecting TikTok Pixel [${tiktokPixelId}] deferment.`);
    // Abstract TikTok Pixel initializations would be placed here in live production
  }
}

/**
 * Event Telemetry: Track page views
 */
export function trackPageView(url: string) {
  if (!isTrackingEnabled) return;
  console.log(`Telemetry: [Page View] -> ${url}`);

  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  if (gaId && (window as any).gtag) {
    (window as any).gtag("event", "page_view", {
      page_path: url,
    });
  }
}

/**
 * Event Telemetry: Track Add to Cart
 */
export function trackAddToCart(product: Product, quantity = 1) {
  if (!isTrackingEnabled) return;
  console.log(`Telemetry: [Add to Cart] -> Name: ${product.name}, Price: €${product.price}, Qty: ${quantity}`);

  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  if (gaId && (window as any).gtag) {
    (window as any).gtag("event", "add_to_cart", {
      currency: "EUR",
      value: product.price * quantity,
      items: [
        {
          item_id: product.id,
          item_name: product.name,
          item_brand: product.brand,
          item_category: product.category,
          price: product.price,
          quantity: quantity,
        },
      ],
    });
  }
}

/**
 * Event Telemetry: Track Remove from Cart
 */
export function trackRemoveFromCart(product: Product, quantity = 1) {
  if (!isTrackingEnabled) return;
  console.log(`Telemetry: [Remove from Cart] -> Name: ${product.name}, Price: €${product.price}, Qty: ${quantity}`);

  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  if (gaId && (window as any).gtag) {
    (window as any).gtag("event", "remove_from_cart", {
      currency: "EUR",
      value: product.price * quantity,
      items: [
        {
          item_id: product.id,
          item_name: product.name,
          price: product.price,
          quantity: quantity,
        },
      ],
    });
  }
}

/**
 * Event Telemetry: Track search query
 */
export function trackSearch(query: string, resultsCount: number) {
  if (!isTrackingEnabled) return;
  console.log(`Telemetry: [Search Query] -> &quot;${query}&quot;, Results Found: ${resultsCount}`);

  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  if (gaId && (window as any).gtag) {
    (window as any).gtag("event", "search", {
      search_term: query,
      results_count: resultsCount,
    });
  }
}

/**
 * Event Telemetry: Track start checkout
 */
export function trackCheckoutStart(items: any[], total: number) {
  if (!isTrackingEnabled) return;
  console.log(`Telemetry: [Begin Checkout] -> Items Count: ${items.length}, Total: €${total.toFixed(2)}`);

  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  if (gaId && (window as any).gtag) {
    (window as any).gtag("event", "begin_checkout", {
      currency: "EUR",
      value: total,
      items: items.map((item) => ({
        item_id: item.product.id,
        item_name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
      })),
    });
  }
}

/**
 * Event Telemetry: Track successful purchase
 */
export function trackPurchase(orderId: string, total: number, items: any[]) {
  if (!isTrackingEnabled) return;
  console.log(`Telemetry: [Purchase Success] -> Order ID: ${orderId}, Total: €${total.toFixed(2)}`);

  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  if (gaId && (window as any).gtag) {
    (window as any).gtag("event", "purchase", {
      transaction_id: orderId,
      value: total,
      currency: "EUR",
      items: items.map((item) => ({
        item_id: item.product.id,
        item_name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
      })),
    });
  }
}
