import { Router } from "express";
import { ObjectId } from "mongodb";
import BlogPost from "../mongo/schemas/blog";
import { BlogPostPreview } from "../interfaces/blog";
import { jwtAuth } from "../middleware/jwtAuth";
import { userApi } from "../mongo/api/user";

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
    const blogPost = new BlogPost(req.body);
    const savedPost = await blogPost.save();
    res.status(201).json(savedPost);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// Get all blog posts (preview)
router.get("/", async (req, res) => {
  try {
    const language = req.query.language;
    const posts = await BlogPost.find().populate({
      path: "author",
      model: "users",
      select: "name picture",
    });
    console.log(posts);
    const previews: BlogPostPreview[] = posts.map((post) => {
      const defaultTranslation = post.translations[language as string];

      return {
        id: (post as any)._id.toString(),
        slug: post.slug,
        title: defaultTranslation?.title || "",
        excerpt: defaultTranslation?.excerpt || "",
        author: post.author,
        createdAt: (post as any).createdAt,
        publishedAt: post.publishedAt,
        tags: defaultTranslation?.tags || [],
        featuredImage: post.featuredImage,
        availableLanguages: Object.keys(post.translations),
      };
    });
    res.json(previews);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get a single blog post by slug
router.get("/:slug", async (req, res) => {
  try {
    console.log(req.params.slug);
    const post = await BlogPost.findOne({ slug: req.params.slug }).populate({
      path: "author",
      model: "users",
      select: "name picture",
    });

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
  const posts = await BlogPost.find({ author: new ObjectId(req.params.author) });
  res.json(posts);
});

// Update a blog post
router.put("/:id", async (req, res) => {
  try {
    const updatedPost = await BlogPost.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date().toISOString() },
      { new: true }
    );
    if (!updatedPost) {
      return res.status(404).json({ error: "Blog post not found" });
    }
    res.json(updatedPost);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// Delete a blog post
router.delete("/:id", async (req, res) => {
  try {
    const deletedPost = await BlogPost.findByIdAndDelete(req.params.id);
    if (!deletedPost) {
      return res.status(404).json({ error: "Blog post not found" });
    }
    res.json({ message: "Blog post deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
