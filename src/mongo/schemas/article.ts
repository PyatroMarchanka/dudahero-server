import mongoose, { Schema, Document } from 'mongoose';
import { Article as ArticleType } from '../../interfaces/articles';

const ArticleSchema: Schema = new Schema({
  slug: { type: String, required: true, unique: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
  createdAt: { type: Date, required: true },
  updatedAt: { type: Date, required: true },
  publishedAt: { type: String, required: false },
  featuredImage: { type: String },
  translations: {
    type: Object,
    required: true
  },
  defaultLanguage: { type: String, required: false },
  category: { type: String, required: false },
}, {
  timestamps: true
});

export const Article = mongoose.model<ArticleType>('article', ArticleSchema); 