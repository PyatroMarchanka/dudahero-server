import { Categories } from "./categories";

export interface ArticleTranslation {
  title: string;
  content: string;
  excerpt: string;
  metaDescription: string;
  metaKeywords: string[];
  tags: string[];
}

export interface Article {
  _id: string;
  slug: string;
  author: string;
  publishedAt: string;
  updatedAt: string;
  featuredImage?: string;
  translations: {
    [languageCode: string]: ArticleTranslation;
  };
  category: Categories;
  defaultLanguage: string;
}

export interface ArticlePreview {
  _id: string;
  slug: string;
  title: string;
  featuredImage?: string;
  category: Categories;
} 