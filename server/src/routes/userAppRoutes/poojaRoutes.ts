import express from "express";
import { fetchAllPoojas, fetchPoojabycategoryId, fetchPoojaById } from "../../controllers/userApp/poojaController";
import { fetchAllBlogs } from "../../controllers/userApp/blogController";

const router = express.Router();

// GET - Fetch all poojas
router.get("/fetch-all-poojas", fetchAllPoojas);

// GET - Fetch Pooja By Id
router.get("/fetch-pooja-by-id/:id", fetchPoojaById);

// GET - Fetch Pooja By Category Id
router.get("/fetch-pooja-by-cat-id/:id", fetchPoojabycategoryId);

// GET - Fetch all blogs
router.get("/fetch-all-blogs", fetchAllBlogs);

export default router;
