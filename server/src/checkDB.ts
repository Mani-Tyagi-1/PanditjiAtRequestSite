import mongoose from "mongoose";
import * as dotenv from "dotenv";
dotenv.config();

import LiveMandirPuja from "./model/userApp/liveMandirPujaModel";
import HolyPandit from "./model/userApp/holyPanditModel";
import Chadhava from "./model/userApp/chadhavaModel";
import ShopProduct from "./model/userApp/shopProductModel";
import { panditJiAtRequestDB } from "./config/connectDB";

async function run() {
  await panditJiAtRequestDB();

  const live = await LiveMandirPuja.find();
  console.log("--- Live Pujas in DB ---", live.length);
  live.forEach((l) => console.log(`- ${l.pujaName} (${l.slug}) | isActive: ${l.isActive}`));

  const pandits = await HolyPandit.find();
  console.log("--- Holy Pandits in DB ---", pandits.length);
  pandits.forEach((p) => console.log(`- ${p.name} (${p.slug}) | isActive: ${p.isActive}`));

  const chadhava = await Chadhava.find();
  console.log("--- Chadhavas in DB ---", chadhava.length);
  chadhava.forEach((c) => console.log(`- ${c.deity} (${c.slug}) | isActive: ${c.isActive}`));

  const shop = await ShopProduct.find();
  console.log("--- Shop Products in DB ---", shop.length);
  shop.forEach((s) => console.log(`- ${s.name} (${s.slug}) | isActive: ${s.isActive}`));

  await mongoose.connection.close();
  process.exit(0);
}

run().catch(console.error);
