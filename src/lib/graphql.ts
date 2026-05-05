/**
 * GraphQL client for WordPress headless CMS
 */

import { WORDPRESS_GRAPHQL_URL } from "astro:env/server";

const REQUEST_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 500;
export const DEFAULT_QUERY_LIMIT = 100;

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: string[];
  }>;
}

export interface FeaturedImage {
  node: {
    sourceUrl: string;
    altText: string;
  };
}

export function normalizeLanguageFilter(language?: string): string | null {
  if (language == null || language.trim() === "") return null;
  return language.toUpperCase();
}

function isRetryableError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === "AbortError") return true;
  if (error instanceof TypeError) return true;
  if (error instanceof Error) {
    const msg = error.message;
    if (msg.includes("request failed: 5") || msg.includes("request failed: 429")) return true;
  }
  return false;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function graphqlQuery<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await delay(RETRY_DELAY_MS * attempt);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(WORDPRESS_GRAPHQL_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ query, variables }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const err = new Error(`GraphQL request failed: ${response.status} ${response.statusText}`);
        if (isRetryableError(err) && attempt < MAX_RETRIES) {
          lastError = err;
          continue;
        }
        throw err;
      }

      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) {
        throw new Error(`Expected JSON response, got: ${contentType}`);
      }

      const json: GraphQLResponse<T> = await response.json();

      if (json.errors) {
        throw new Error(`GraphQL Error: ${json.errors.map((e) => e.message).join("; ")}`);
      }

      if (!json.data) {
        throw new Error("No data returned from GraphQL query");
      }

      return json.data;
    } catch (error) {
      lastError = error;
      if (isRetryableError(error) && attempt < MAX_RETRIES) {
        continue;
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError;
}
