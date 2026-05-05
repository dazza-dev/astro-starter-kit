/**
 * Blog posts queries using GraphQL
 * Fetches native WordPress posts with Polylang language support
 */

import { graphqlQuery, normalizeLanguageFilter, DEFAULT_QUERY_LIMIT } from "./graphql";
import type { Post, PostsQueryResponse } from "../types/blog";

const POST_FIELDS = `
  id
  title
  slug
  excerpt
  content
  date
  translations {
    slug
    language {
      code
    }
  }
  featuredImage {
    node {
      sourceUrl
      altText
    }
  }
  categories {
    nodes {
      name
      slug
    }
  }
`;

/**
 * Get blog posts, optionally filtered by language
 */
export async function getPosts(language?: string, first: number = DEFAULT_QUERY_LIMIT): Promise<Post[]> {
  const query = `
    query GetPosts($first: Int!, $language: LanguageCodeFilterEnum) {
      posts(first: $first, where: {orderby: {field: DATE, order: DESC}, language: $language}) {
        nodes {
          ${POST_FIELDS}
        }
      }
    }
  `;

  try {
    const data = await graphqlQuery<PostsQueryResponse>(query, {
      first,
      language: normalizeLanguageFilter(language),
    });
    return data.posts?.nodes ?? [];
  } catch (error) {
    console.error("[blog.getPosts] Error:", error instanceof Error ? error.message : String(error));
    return [];
  }
}

export async function getPostBySlug(slug: string, language?: string): Promise<Post | null> {
  const query = `
    query GetPostBySlug($slug: String!, $language: LanguageCodeFilterEnum) {
      posts(first: 1, where: {name: $slug, language: $language}) {
        nodes {
          ${POST_FIELDS}
        }
      }
    }
  `;

  try {
    const data = await graphqlQuery<PostsQueryResponse>(query, {
      slug,
      language: normalizeLanguageFilter(language),
    });
    return data.posts?.nodes?.[0] ?? null;
  } catch (error) {
    console.error("[blog.getPostBySlug] Error:", error instanceof Error ? error.message : String(error));
    return null;
  }
}
