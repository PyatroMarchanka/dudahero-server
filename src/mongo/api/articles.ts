import { ArticlePreview, Article as ArticleType } from "../../interfaces/articles";
import { Categories } from "../../interfaces/categories";
import { Languages } from "../../interfaces/common";
import setupMongooseConnection from "../connect";
import { Article } from "../schemas/article";

const getAllArticlesPreviews = async (): Promise<ArticlePreview[]> => {
    await setupMongooseConnection();

    const articles = await Article.find<ArticleType>({}).select('_id slug featuredImage translations.be.title category');
    return articles.map(article => {
        const { slug, category, featuredImage, _id } = article;

        return { _id, slug, category, featuredImage, title: article.translations[Languages.Belarusian].title }
    })
}

export const articlesApi = {
    getAllArticlesPreviews
};
