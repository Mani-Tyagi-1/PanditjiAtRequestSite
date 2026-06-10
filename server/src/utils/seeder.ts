import LiveMandirPuja from "../model/userApp/liveMandirPujaModel";
import { LIVE_MANDIR_SEED } from "../data/liveMandirSeed";
import HolyPandit from "../model/userApp/holyPanditModel";
import { HOLY_PANDIT_SEED } from "../data/holyPanditSeed";
import Chadhava from "../model/userApp/chadhavaModel";
import { CHADHAVA_SEED } from "../data/chadhavaSeed";
import ShopProduct from "../model/userApp/shopProductModel";
import { SHOP_SEED } from "../data/shopSeed";

/**
 * Automatically seeds the database collections with initial catalog details.
 * Uses idempotent updateOne with upsert to prevent duplicates.
 */
export async function autoSeedCatalog(): Promise<void> {
  try {
    console.log("🌱 Auto-seeding catalog collections...");

    // 1. Live Mandir Pujas
    const liveSlugs = LIVE_MANDIR_SEED.map((p) => p.slug);
    await LiveMandirPuja.deleteMany({ slug: { $nin: liveSlugs } });
    await Promise.all(
      LIVE_MANDIR_SEED.map((puja) =>
        LiveMandirPuja.updateOne(
          { slug: puja.slug },
          { $set: puja },
          { upsert: true }
        )
      )
    );
    const liveCount = await LiveMandirPuja.countDocuments();
    console.log(`✅ Seeded live pujas. Total: ${liveCount}`);

    // 2. Holy Pandits
    const panditSlugs = HOLY_PANDIT_SEED.map((p) => p.slug);
    await HolyPandit.deleteMany({ slug: { $nin: panditSlugs } });
    await Promise.all(
      HOLY_PANDIT_SEED.map((p) =>
        HolyPandit.updateOne(
          { slug: p.slug },
          { $set: p },
          { upsert: true }
        )
      )
    );
    const panditCount = await HolyPandit.countDocuments();
    console.log(`✅ Seeded holy pandits. Total: ${panditCount}`);

    // 3. Chadhava
    const chadhavaSlugs = CHADHAVA_SEED.map((c) => c.slug);
    await Chadhava.deleteMany({ slug: { $nin: chadhavaSlugs } });
    await Promise.all(
      CHADHAVA_SEED.map((c) =>
        Chadhava.updateOne(
          { slug: c.slug },
          { $set: c },
          { upsert: true }
        )
      )
    );
    const chadhavaCount = await Chadhava.countDocuments();
    console.log(`✅ Seeded chadhava offerings. Total: ${chadhavaCount}`);

    // 4. Shop Products
    const shopSlugs = SHOP_SEED.map((p) => p.slug);
    await ShopProduct.deleteMany({ slug: { $nin: shopSlugs } });
    await Promise.all(
      SHOP_SEED.map((p) =>
        ShopProduct.updateOne(
          { slug: p.slug },
          { $set: p },
          { upsert: true }
        )
      )
    );
    const shopCount = await ShopProduct.countDocuments();
    console.log(`✅ Seeded shop products. Total: ${shopCount}`);

    console.log("🌱 Catalog seeding finished successfully!");
  } catch (error) {
    console.error("❌ Seeding catalog failed:", error);
  }
}
