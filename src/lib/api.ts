import type { ApiResponse, Collection } from "@/types";

const API_URL = import.meta.env.VITE_API_URL as string | undefined;
const API_TOKEN = (import.meta.env.VITE_API_TOKEN as string | undefined) ?? "";

if (!API_URL) {
  // Surfaced once in the console so misconfiguration is obvious during setup.
  console.warn(
    "[api] VITE_API_URL is not set. Copy .env.example to .env and paste your Apps Script Web App URL.",
  );
}

/**
 * Google Apps Script web apps do not support custom request headers on
 * cross-origin POSTs without triggering a CORS preflight that Apps Script
 * cannot answer. To stay on the "simple request" path we:
 *   - send POST bodies as text/plain (no preflight)
 *   - pass the auth token inside the JSON body and the query string
 *   - read every action as a GET with query params
 */

type Query = Record<string, string | number | boolean | undefined>;

function buildUrl(query: Query): string {
  const url = new URL(API_URL ?? "https://example.com");
  url.searchParams.set("token", API_TOKEN);
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  }
  return url.toString();
}

async function unwrap<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  const json = (await res.json()) as ApiResponse<T>;
  if (!json.ok) throw new Error(json.error || "Unknown server error");
  return json.data as T;
}

/** Fetch every row in a collection. */
export async function list<T>(collection: Collection): Promise<T[]> {
  const res = await fetch(buildUrl({ action: "list", collection }), {
    method: "GET",
    redirect: "follow",
  });
  return unwrap<T[]>(res);
}

async function mutate<T>(
  action: "create" | "update" | "remove",
  collection: Collection,
  payload: unknown,
): Promise<T> {
  const res = await fetch(API_URL ?? "", {
    method: "POST",
    redirect: "follow",
    // text/plain keeps this a CORS "simple request" (no preflight)
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action, collection, token: API_TOKEN, payload }),
  });
  return unwrap<T>(res);
}

export function create<T>(collection: Collection, payload: Partial<T>) {
  return mutate<T>("create", collection, payload);
}

export function update<T>(collection: Collection, payload: Partial<T> & { id: string }) {
  return mutate<T>("update", collection, payload);
}

export function remove(collection: Collection, id: string) {
  return mutate<{ id: string }>("remove", collection, { id });
}

/**
 * Upload a file to Google Drive through Apps Script.
 * The file is sent as base64 inside a text/plain POST body.
 */
export async function uploadFile(params: {
  collection: "documents";
  filename: string;
  mimeType: string;
  base64: string;
  meta: Record<string, unknown>;
}): Promise<{ id: string; fileUrl: string; fileId: string }> {
  const res = await fetch(API_URL ?? "", {
    method: "POST",
    redirect: "follow",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "upload", token: API_TOKEN, ...params }),
  });
  return unwrap(res);
}

/** Read a File object into a base64 string (without the data: prefix). */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
