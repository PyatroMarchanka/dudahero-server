import { ArticlePreview } from "./articles";

export enum Categories {
    Beginners = "beginners",
    History = "history",
    MusicQuestions = "music-questions",
    Operation = "operation",
    Theory = "theory",
    Repertoire = "repertoire",
}

export interface CategoriesTreeItem {
    category: Categories;
    articles: ArticlePreview[];
}

export type CategoriesTree = CategoriesTreeItem[];

export const getCategoryLabel = (categoryId: Categories) => {
    switch (categoryId) {
        case Categories.Beginners:
            return "Для пачаткоўцаў"
        case Categories.Beginners:
            return "Гісторыя дуды"
        case Categories.Beginners:
            return "Музычныя пытанні"
        case Categories.Beginners:
            return "Эксплуатацыя"
        case Categories.Beginners:
            return "Тэорыя музыкі"
        case Categories.Beginners:
            return "Рэпертуар"

        default:
            break;
    }
}