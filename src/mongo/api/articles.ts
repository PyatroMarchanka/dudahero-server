import { ArticlePreview, Article as ArticleType } from "../../interfaces/articles";
import { Categories } from "../../interfaces/categories";
import { Languages } from "../../interfaces/common";
import setupMongooseConnection from "../connect";
import { Article } from "../schemas/article";
import { cacheGet, cacheInvalidate } from "../../utils/cache";

const getAllArticlesPreviews = async (): Promise<ArticlePreview[]> => {
    await setupMongooseConnection();

    return cacheGet("articles:previews:all", async () => {
        const articles = await Article.find<ArticleType>({}).select('_id slug featuredImage translations.be.title category');
        return articles.map(article => {
            const { slug, category, featuredImage, _id } = article;

            return { _id, slug, category, featuredImage, title: article.translations[Languages.Belarusian].title }
        })
    });
}

const getArticlePreviewsByFilter = async (language: string = Languages.Belarusian, categoryId?: string): Promise<ArticlePreview[]> => {
    await setupMongooseConnection();

    const cacheKey = categoryId 
        ? `articles:previews:${language}:${categoryId}` 
        : `articles:previews:${language}`;

    return cacheGet(cacheKey, async () => {
        const filter = categoryId ? { category: categoryId } : {};
        const articles = await Article.find<ArticleType>(filter).select('_id slug featuredImage translations.be.title category');
        return articles.map(article => {
            const { slug, category, featuredImage, _id } = article;

            return { _id, slug, category, featuredImage, title: article.translations[language]?.title || article.translations[Languages.Belarusian].title }
        })
    });
};

const getArticleBySlug = async (slug: string): Promise<ArticleType | null> => {
    await setupMongooseConnection();

    return cacheGet(`articles:slug:${slug}`, async () => {
        return await Article.findOne<ArticleType>({ slug });
    });
};

const addArticle = async (article: any) => {
    await setupMongooseConnection();

    const result = await Article.create(article);
    
    // Invalidate all article preview caches
    await cacheInvalidate("articles:previews:*");

    return result;
};

const updateArticle = async (id: string, article: any) => {
    await setupMongooseConnection();

    const result = await Article.updateOne({ _id: id }, article);
    
    // Invalidate all article caches
    await cacheInvalidate("articles:previews:*");
    await cacheInvalidate("articles:slug:*");

    return result;
};

const deleteArticle = async (id: string) => {
    await setupMongooseConnection();

    const result = await Article.deleteOne({ _id: id });
    
    // Invalidate all article caches
    await cacheInvalidate("articles:previews:*");
    await cacheInvalidate("articles:slug:*");

    return result;
};

export const articlesApi = {
    getAllArticlesPreviews,
    getArticlePreviewsByFilter,
    getArticleBySlug,
    addArticle,
    updateArticle,
    deleteArticle
};
