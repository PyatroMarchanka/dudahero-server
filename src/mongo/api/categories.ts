import { Categories, CategoriesTree } from "../../interfaces/categories";
import { articlesApi } from "./articles";

const getCategoriesTree = async (): Promise<CategoriesTree> => {
  const articles = await articlesApi.getAllArticlesPreviews()
  const sortedArticles: CategoriesTree = Object.values(Categories).map((category) => ({
    category,
    articles: articles.filter(article => article.category === category)
  }));

  return sortedArticles;
}

export const categoriesApi = {
  getCategoriesTree,
};



