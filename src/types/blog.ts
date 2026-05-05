import type { FeaturedImage } from "../lib/graphql";

export interface Translation {
  slug: string;
  language: {
    code: string;
  };
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  date: string;
  translations?: Translation[];
  featuredImage?: FeaturedImage;
  categories?: {
    nodes: Array<{
      name: string;
      slug: string;
    }>;
  };
}

export interface PostsQueryResponse {
  posts: {
    nodes: Post[];
  };
}
