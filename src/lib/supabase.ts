import { createClient, SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Environment variable validation
// ---------------------------------------------------------------------------
// These must be set in .env.local before running the dev server.
// The /rest/v1/ suffix must NOT be included in NEXT_PUBLIC_SUPABASE_URL —
// the @supabase/supabase-js client constructs all API paths internally.
// ---------------------------------------------------------------------------
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error(
    "[Kincha] Missing env: NEXT_PUBLIC_SUPABASE_URL\n" +
      "Add it to .env.local as: NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co"
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    "[Kincha] Missing env: NEXT_PUBLIC_SUPABASE_ANON_KEY\n" +
      "Add it to .env.local as: NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>"
  );
}

// ---------------------------------------------------------------------------
// Database Type Definitions
// Mirrors the Supabase schema tables used throughout the Kincha application.
// ---------------------------------------------------------------------------

export type QuestionType = "ESSAY" | "MULTIPLE_CHOICE";
export type MediaType = "IMAGE" | "VIDEO" | "NONE";

export interface Question {
  id: number;
  question_text: string;
  question_type: QuestionType;
  media_type: MediaType;
  media_url: string | null;
  options: string[] | null;
  correct_option: number | null; // index into options[] — int4 in DB
  explanation: string | null;
  created_at: string;
}

export interface Answer {
  id: string;              // uuid in DB
  session_id: string;
  question_id: number;
  answer_text: string;
  is_correct: boolean | null;
  submitted_at: string;    // column is submitted_at, not created_at
}

export interface KinchaUser {
  id: string;                        // Matches Supabase Auth uid
  email: string;
  role: "admin" | "user";
  created_at: string;
}

// Typed Database schema for full end-to-end type safety with Supabase
export interface Database {
  public: {
    Tables: {
      questions: {
        Row: Question;
        Insert: Omit<Question, "id" | "created_at">;
        Update: Partial<Omit<Question, "id" | "created_at">>;
      };
      answers: {
        Row: Answer;
        Insert: Omit<Answer, "id" | "submitted_at">;
        Update: Partial<Omit<Answer, "id" | "submitted_at">>;
      };
      users: {
        Row: KinchaUser;
        Insert: Omit<KinchaUser, "created_at">;
        Update: Partial<Omit<KinchaUser, "id" | "created_at">>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      question_type: QuestionType;
      media_type: MediaType;
    };
  };
}

// ---------------------------------------------------------------------------
// Singleton Browser Client
// ---------------------------------------------------------------------------
// A singleton is used to prevent creating multiple GoTrue / Realtime WebSocket
// connections during React hot-reloads in development mode.
// This client uses the ANON key and respects Supabase RLS policies:
//   - questions: SELECT (public read)
//   - answers:   INSERT only (public anonymous write, no SELECT)
//   - users:     admin only via service role (not exposed here)
// ---------------------------------------------------------------------------

let _client: SupabaseClient<Database> | null = null;

export function getSupabaseClient(): SupabaseClient<Database> {
  if (_client) return _client;

  _client = createClient<Database>(supabaseUrl!, supabaseAnonKey!, {
    auth: {
      // Persist session to localStorage so admin stays logged in across refreshes
      persistSession: true,
      // Auto-refresh the JWT before it expires (Supabase default: 1 hour)
      autoRefreshToken: true,
      // Detect the session from the URL hash on OAuth/magic-link redirects
      detectSessionInUrl: true,
    },
    global: {
      headers: {
        // Tag all requests for easier identification in Supabase logs
        "x-application-name": "kincha-kincir-challenge",
      },
    },
  });

  return _client;
}

/**
 * Pre-initialized Supabase client instance.
 *
 * Import this throughout the app for all database operations:
 *   import { supabase } from "@/lib/supabase"
 *
 * For admin operations requiring elevated permissions (e.g., reading all
 * answers), the admin dashboard uses the same anon client but relies on
 * Supabase Auth RLS policies — the user must be authenticated as an admin.
 */
export const supabase = getSupabaseClient();

// ---------------------------------------------------------------------------
// Typed Storage Helper
// ---------------------------------------------------------------------------
// Kincha uses a public bucket named "proker-genre-media" to store question
// images and videos uploaded during content setup.
// ---------------------------------------------------------------------------

export const STORAGE_BUCKET = "proker-genre-media";

/**
 * Resolves a Supabase Storage file path to its full public URL.
 * Returns null if the path is empty or the bucket URL can't be formed.
 *
 * @param filePath - The storage object path, e.g. "images/rasa-senang.webp"
 */
export function getPublicMediaUrl(filePath: string | null | undefined): string | null {
  if (!filePath) return null;

  const { data } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(filePath);

  return data?.publicUrl ?? null;
}

// ---------------------------------------------------------------------------
// Auth Helpers
// ---------------------------------------------------------------------------

/**
 * Signs in an admin user with email + password via Supabase Auth.
 * The resulting session is automatically persisted to localStorage.
 */
export async function signInWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

/**
 * Signs out the currently authenticated user and clears the local session.
 */
export async function signOut() {
  return supabase.auth.signOut();
}

/**
 * Returns the currently active session, or null if unauthenticated.
 * Use this in layout components / middleware to guard admin routes.
 */
export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}
