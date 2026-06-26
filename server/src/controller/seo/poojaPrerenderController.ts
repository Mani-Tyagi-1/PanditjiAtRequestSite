import { Request, Response } from "express";
import poojaModel from "../../model/userApp/poojaModel";
import { renderPoojaHtml, type AnyPooja } from "./poojaPrerenderTemplate";

/**
 * Bots-prerender for puja detail pages.
 *
 * The frontend is a CSR React SPA, so a crawler hitting /puja/:id sees ~13 chars
 * of body and no content. This route renders the SAME puja, server-side, into
 * fully-crawlable static HTML (real <h1>, body copy, price, FAQ + Service /
 * FAQPage / BreadcrumbList JSON-LD) — visible to Googlebot AND non-rendering AI
 * crawlers (GPTBot, PerplexityBot, ClaudeBot) without any JavaScript.
 *
 * nginx routes crawler user-agents for /puja/:id to /api/seo/puja/:id; human
 * users keep getting the SPA.
 */

const BRAND = "PanditJiAtRequest";

const notFoundHtml = () =>
  `<!doctype html><html lang="en"><head><meta charset="UTF-8"><title>Puja not found | ${BRAND}</title><meta name="robots" content="noindex"></head><body><h1>Puja not found</h1><p><a href="/puja">Browse all pujas</a></p></body></html>`;

export const prerenderPooja = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const pooja = await poojaModel
      .findOne({ _id: id, isActive: true })
      .lean<AnyPooja>();
    if (!pooja) {
      res
        .status(404)
        .set("Content-Type", "text/html; charset=utf-8")
        .send(notFoundHtml());
      return;
    }
    res
      .status(200)
      .set("Content-Type", "text/html; charset=utf-8")
      .set("Cache-Control", "public, max-age=3600")
      .send(renderPoojaHtml(pooja, String(id)));
  } catch (error) {
    // Invalid ObjectId or DB error — fail soft so crawlers get a clean 404.
    console.error("[prerender] puja error:", (error as Error)?.message);
    res
      .status(404)
      .set("Content-Type", "text/html; charset=utf-8")
      .send(notFoundHtml());
  }
};
