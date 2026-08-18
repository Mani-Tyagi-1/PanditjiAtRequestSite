import { Request, Response } from "express";
import poojaModel from "../../model/userApp/poojaModel";

// Lightweight projection for list/card views — excludes heavy fields like
// descriptions, image/video arrays, samagri and FAQs (huge payload otherwise).
const POOJA_LIST_FIELDS =
  "poojaID poojaNameEng poojaNameHindi poojaMode poojaPriceOnline poojaPriceOffline mainCategories subCategories poojaCardImage isFeatured featuredRank isExclusive exclusiveRank isActive";

const escapeRelatedPujaTerm = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Get all active poojas (list view — projected & lean for speed)
export const fetchAllPoojas = async (req: Request, res: Response) => {
  try {
    const poojas = await poojaModel
      .find({ isActive: true })
      .select(POOJA_LIST_FIELDS)
      .lean();
    // Catalog data changes rarely — let browsers/CDN cache briefly (non-breaking).
    res.set("Cache-Control", "public, max-age=120, stale-while-revalidate=600");
    return res.status(200).json({ poojas });
  } catch (error) {
    console.error("Error fetching poojas:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};

// Get active pujas related to a deity/ritual for landing-page cross-sells.
// This intentionally returns the same lightweight card fields as the catalog;
// the existing /puja/:id page remains the source of truth for booking details.
export const fetchRelatedPoojas = async (req: Request, res: Response) => {
  try {
    const terms = String(req.query.terms || "")
      .split(",")
      .map((term) => term.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 16);
    const excludePoojaID = String(req.query.excludePoojaID || "").trim();
    const limit = Math.min(Math.max(Number(req.query.limit) || 6, 1), 12);

    if (!terms.length) {
      return res.status(200).json({ poojas: [] });
    }

    const regexes = terms.map((term) => new RegExp(escapeRelatedPujaTerm(term), "i"));
    const query: Record<string, any> = {
      isActive: true,
      $or: [
        { poojaGods: { $in: regexes } },
        { tags: { $in: regexes } },
        { poojaNameEng: { $in: regexes } },
        { poojaNameHindi: { $in: regexes } },
        { poojaDescriptionMain: { $in: regexes } },
        { "mainCategories.name": { $in: regexes } },
        { "subCategories.name": { $in: regexes } },
      ],
    };
    if (excludePoojaID) query.poojaID = { $ne: excludePoojaID };

    const poojas = await poojaModel
      .find(query)
      .select("_id poojaID poojaNameEng poojaNameHindi poojaMode poojaPriceOnline poojaPriceOffline mainCategories subCategories poojaCardImage isFeatured featuredRank poojaGods tags poojaDescriptionMain")
      .limit(80)
      .lean();

    const ranked = poojas
      .map((pooja: any) => {
        const haystack = [
          pooja.poojaNameEng,
          pooja.poojaNameHindi,
          pooja.poojaDescriptionMain,
          ...(pooja.poojaGods || []),
          ...(pooja.tags || []),
          ...(pooja.mainCategories || []).map((category: any) => category.name),
          ...(pooja.subCategories || []).map((category: any) => category.name),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        const score = terms.reduce(
          (total, term, index) => total + (haystack.includes(term) ? terms.length - index : 0),
          0,
        ) + (pooja.isFeatured ? 1 : 0);
        return { pooja, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ pooja }) => pooja);

    res.set("Cache-Control", "public, max-age=120, stale-while-revalidate=600");
    return res.status(200).json({ poojas: ranked });
  } catch (error) {
    console.error("Error fetching related poojas:", error);
    return res.status(500).json({ message: "Server error", poojas: [] });
  }
};

// Get one pooja by ID — only if it's active
export const fetchPoojaById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const pooja = await poojaModel.findOne({ _id: id, isActive: true }).lean();

    if (!pooja) {
      return res.status(404).json({ message: "Pooja not found or inactive" });
    }

    res.set("Cache-Control", "public, max-age=120, stale-while-revalidate=600");
    return res.status(200).json({ pooja });
  } catch (error) {
    console.error("Error fetching pooja by id:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};

export const fetchPoojabycategoryId = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const poojas = await poojaModel
      .find({
        isActive: true,
        "mainCategories.id": id,
      })
      .select(
        "_id poojaID poojaNameEng poojaNameHindi poojaMode poojaPriceOnline poojaPriceOffline mainCategories subCategories poojaCardImage isFeatured isActive"
      )
      .lean();

    res.set("Cache-Control", "public, max-age=120, stale-while-revalidate=600");
    return res.status(200).json({
      message: "Poojas fetched successfully",
      poojas,
    });
  } catch (error) {
    console.error("Error fetching poojas by category id:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};
