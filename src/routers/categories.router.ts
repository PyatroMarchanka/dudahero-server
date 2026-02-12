import { Router } from "express";
import { categoriesApi } from "../mongo/api/categories";

const router = Router();

// Get all categories
router.get("/", async (req, res) => {
  try {
    const categories = await categoriesApi.getCategoriesTree();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;

