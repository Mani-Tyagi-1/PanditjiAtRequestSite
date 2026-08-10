import { Schema, Model } from "mongoose";
import { panditJiAtRequestMongooose } from "../../config/connectDB";

export interface IMoney {
  amount: string;
  currencyCode: string;
}

export interface IPriceRange {
  minVariantCompareAtPrice?: IMoney;
  maxVariantCompareAtPrice?: IMoney;
  minVariantPrice?: IMoney;
  maxVariantPrice?: IMoney;
}

export interface IShopifyImage {
  id: string;
  url: string;
  altText?: string | null;
  width?: number;
  height?: number;
}

export interface IShopifyMedia {
  id: string;
  alt?: string | null;
  mediaContentType: string;
  status: string;
  image?: IShopifyImage;
}

export interface IShopifyMetafield {
  id: string;
  namespace: string;
  key: string;
  value: string;
  type: string;
  description?: string | null;
}

export interface IShopifySelectedOption {
  name: string;
  value: string;
}

export interface IShopifyVariant {
  id: string;
  title: string;
  sku?: string | null;
  price: string;
  compareAtPrice?: string | null;
  barcode?: string;
  inventoryQuantity?: number;
  taxable?: boolean;
  selectedOptions?: IShopifySelectedOption[];
  image?: IShopifyImage | null;
}

export interface IShopifyProduct {
  shopifyProductId: string;
  category?: string | null;
  compareAtPriceRange?: {
    minVariantCompareAtPrice: IMoney;
    maxVariantCompareAtPrice: IMoney;
  };
  priceRangeV2?: {
    minVariantPrice: IMoney;
    maxVariantPrice: IMoney;
  };
  descriptionHtml?: string;
  featuredImage?: IShopifyImage;
  handle: string;
  keywords?: string[];
  media?: IShopifyMedia[];
  metafields?: IShopifyMetafield[];
  numero?: string;
  onlineStoreUrl?: string | null;
  productType?: string;
  rashi?: string;
  seo?: Schema.Types.Mixed | null;
  source?: string;
  status?: string;
  syncedAt?: Date;
  tags?: string[];
  title: string;
  totalInventory?: number;
  variants?: IShopifyVariant[];

  /**
   * Cross-sell-only product: shown on the Vedic Vivah page, hidden from the
   * shop. These were added for the marriage flow and have no business in a
   * general product grid — but they are ordinary Shopify products, so nothing
   * else tells them apart. The admin sets this; every shop surface honours it.
   */
  vivahOnly?: boolean;

  /**
   * Field names the admin has edited in our own Mongo, e.g. ["descriptionHtml"].
   *
   * A Shopify sync writes every field it owns. Without this list one sync
   * silently reverts every correction made here — precisely the damage a
   * manual "Sync now" button would otherwise do. Listed fields are skipped by
   * the sync and stay ours.
   */
  manualOverrides?: string[];

  /** `updatedAt` as Shopify reports it — lets a sync skip untouched products. */
  shopifyUpdatedAt?: Date | null;
  /** When our copy was last refreshed from Shopify. */
  lastSyncedAt?: Date | null;

  createdAt?: Date;
  updatedAt?: Date;
}

const MoneySchema = new Schema<IMoney>({
  amount: { type: String, required: true },
  currencyCode: { type: String, default: "INR" },
}, { _id: false });

const ImageSchema = new Schema<IShopifyImage>({
  id: { type: String },
  url: { type: String, required: true },
  altText: { type: String, default: null },
  width: { type: Number },
  height: { type: Number },
}, { _id: false });

const MediaSchema = new Schema<IShopifyMedia>({
  id: { type: String },
  alt: { type: String, default: null },
  mediaContentType: { type: String },
  status: { type: String },
  image: { type: ImageSchema },
}, { _id: false });

const MetafieldSchema = new Schema<IShopifyMetafield>({
  id: { type: String },
  namespace: { type: String },
  key: { type: String },
  value: { type: String },
  type: { type: String },
  description: { type: String, default: null },
}, { _id: false });

const SelectedOptionSchema = new Schema<IShopifySelectedOption>({
  name: { type: String },
  value: { type: String },
}, { _id: false });

const VariantSchema = new Schema<IShopifyVariant>({
  id: { type: String, required: true },
  title: { type: String },
  sku: { type: String, default: null },
  price: { type: String, required: true },
  compareAtPrice: { type: String, default: null },
  barcode: { type: String, default: "" },
  inventoryQuantity: { type: Number, default: 0 },
  taxable: { type: Boolean, default: true },
  selectedOptions: [SelectedOptionSchema],
  image: { type: ImageSchema, default: null },
}, { _id: false });

const shopifyProductSchema = new Schema<IShopifyProduct>(
  {
    shopifyProductId: { type: String, required: true, unique: true, index: true },
    category: { type: String, default: null },
    compareAtPriceRange: {
      minVariantCompareAtPrice: { type: MoneySchema },
      maxVariantCompareAtPrice: { type: MoneySchema },
    },
    priceRangeV2: {
      minVariantPrice: { type: MoneySchema },
      maxVariantPrice: { type: MoneySchema },
    },
    descriptionHtml: { type: String, default: "" },
    featuredImage: { type: ImageSchema },
    handle: { type: String, required: true, unique: true, index: true },
    keywords: [{ type: String }],
    media: [MediaSchema],
    metafields: [MetafieldSchema],
    numero: { type: String, default: "" },
    onlineStoreUrl: { type: String, default: null },
    productType: { type: String, default: "" },
    rashi: { type: String, default: "" },
    seo: { type: Schema.Types.Mixed, default: null },
    source: { type: String, default: "shopify" },
    status: { type: String, default: "active", index: true },
    syncedAt: { type: Date },
    tags: [{ type: String }],
    title: { type: String, required: true, index: true },
    totalInventory: { type: Number, default: 0 },
    variants: [VariantSchema],

    // Channel visibility — see the interface above.
    vivahOnly: { type: Boolean, default: false, index: true },

    // Sync bookkeeping.
    manualOverrides: { type: [String], default: [] },
    shopifyUpdatedAt: { type: Date, default: null },
    lastSyncedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

/* The shop's default query: active, not vivah-only, newest first. */
shopifyProductSchema.index({ vivahOnly: 1, status: 1, createdAt: -1 });

const ShopifyProduct: Model<IShopifyProduct> =
  panditJiAtRequestMongooose.model<IShopifyProduct>(
    "ShopifyProduct",
    shopifyProductSchema,
    "shopifyProducts"
  );

export default ShopifyProduct;
