import { Article } from '../mongo/schemas/article';
import { Router } from "express";
import { ObjectId } from "mongodb";
import { Article as ArticleType, ArticlePreview } from "../interfaces/articles";
import { jwtAuth } from "../middleware/jwtAuth";
import { userApi } from "../mongo/api/user";
import { articlesApi } from "../mongo/api/articles";
import { cacheInvalidate } from "../utils/cache";

const router = Router();

// Create a new blog post
router.post("/", async (req, res) => {
  try {
    jwtAuth(req);
    const userId = req.cookies.userId;
    const user = await userApi.getUserById(userId);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const article = new Article(req.body);
    const savedArticle = await article.save();
    
    // Invalidate article preview caches
    await cacheInvalidate("articles:previews:*");
    
    res.status(201).json(savedArticle);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// Get all articles (preview)
router.get("/", async (req, res) => {
  try {
    const language = (req.query.language as string) || "be"; // Default to Belarusian
    const categoryId = req.query.categoryId as string | undefined;

    const previews = await articlesApi.getArticlePreviewsByFilter(language, categoryId);
    res.json(previews);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get a single blog post by slug
router.get("/:slug", async (req, res) => {
  try {
    const post = await articlesApi.getArticleBySlug(req.params.slug);

    if (!post) {
      return res.status(404).json({ error: "Blog post not found" });
    }
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

//Get posts by author
router.get("/author/:author", async (req, res) => {
  const posts = await Article.find({ author: new ObjectId(req.params.author) });
  res.json(posts);
});

// Update a blog post
router.put("/:id", async (req, res) => {
  try {
    const updatedPost = await Article.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date().toISOString() },
      { new: true }
    );
    if (!updatedPost) {
      return res.status(404).json({ error: "Blog post not found" });
    }

    // Invalidate article preview and slug caches
    await cacheInvalidate("articles:previews:*");
    await cacheInvalidate("articles:slug:*");
    
    res.json(updatedPost);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// Delete a blog post
router.delete("/:id", async (req, res) => {
  try {
    const deletedPost = await Article.findByIdAndDelete(req.params.id);
    if (!deletedPost) {
      return res.status(404).json({ error: "Blog post not found" });
    }

    // Invalidate article preview and slug caches
    await cacheInvalidate("articles:previews:*");
    await cacheInvalidate("articles:slug:*");
    
    res.json({ message: "Blog post deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
