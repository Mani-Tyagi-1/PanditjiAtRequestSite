export type Money = {
    amount: string;
    currencyCode: string;
};

export type ShopifyImage = {
    id?: string;
    url: string;
    altText?: string | null;
    width?: number;
    height?: number;
};

export type ShopifyMedia = {
    id?: string;
    alt?: string | null;
    mediaContentType?: string;
    status?: string;
    image?: ShopifyImage;
};

export type ShopifyProduct = {
    _id: string;
    shopifyProductId: string;
    title: string;
    handle: string;
    descriptionHtml?: string;
    /**
     * Added by the API alongside `descriptionHtml`, never in place of it:
     * `descriptionHtml` is empty on every product created by hand or synced
     * before the sync asked Shopify for it, so the server falls back to the SEO
     * description. Optional because the lean list view (`listView=true`) skips
     * the normaliser and ships the raw documents.
     * See server/src/controller/userApp/shopifyProductController.ts.
     */
    description?: string;
    featuredImage?: ShopifyImage;
    media?: ShopifyMedia[];
    priceRangeV2?: {
        minVariantPrice: Money;
        maxVariantPrice: Money;
    };
    compareAtPriceRange?: {
        minVariantCompareAtPrice: Money;
        maxVariantCompareAtPrice: Money;
    };
    rashi?: string;
    category?: string | null;
    productType?: string;
    status?: string;
    totalInventory?: number;
    tags?: string[];
};

export type CartLine = {
    product: ShopifyProduct;
    qty: number;
};

export const productPrice = (p: ShopifyProduct): number =>
    Number(p.priceRangeV2?.minVariantPrice?.amount || 0);
