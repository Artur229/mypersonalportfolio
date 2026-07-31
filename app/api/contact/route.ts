import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const FORMSPREE_ENDPOINT = "https://formspree.io/f/mojgzynk";
const MAX_REQUEST_BYTES = 16_384;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 3;
const CONTACT_COOKIE = "portfolio_contact_sent";

const contactSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    email: z.string().trim().email().max(254),
    company: z.string().trim().max(100).optional().default(""),
    message: z.string().trim().min(10).max(3000),
    consent: z.literal("agreed"),
    _gotcha: z.string().max(200).optional().default(""),
    _subject: z.string().max(100).optional(),
  })
  .strict();

type RateLimitEntry = { count: number; resetAt: number };

const rateLimitGlobal = globalThis as typeof globalThis & {
  portfolioContactRateLimit?: Map<string, RateLimitEntry>;
};
const rateLimitStore =
  rateLimitGlobal.portfolioContactRateLimit ?? new Map<string, RateLimitEntry>();
rateLimitGlobal.portfolioContactRateLimit = rateLimitStore;

function hasValidOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return false;

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

function getClientAddress(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function exceedsRateLimit(key: string) {
  const now = Date.now();
  const existing = rateLimitStore.get(key);

  if (!existing || existing.resetAt <= now) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return false;
  }

  existing.count += 1;
  return existing.count > RATE_LIMIT_MAX_REQUESTS;
}

export async function POST(request: NextRequest) {
  if (!hasValidOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  if (request.cookies.get(CONTACT_COOKIE)?.value === "1") {
    return NextResponse.json(
      { error: "A recent enquiry already exists." },
      { status: 429 },
    );
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > MAX_REQUEST_BYTES) {
    return NextResponse.json({ error: "Request is too large." }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid form fields." }, { status: 400 });
  }

  if (parsed.data._gotcha) {
    return NextResponse.json({ ok: true });
  }

  if (exceedsRateLimit(getClientAddress(request))) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 },
    );
  }

  const formData = new FormData();
  formData.set("name", parsed.data.name);
  formData.set("email", parsed.data.email);
  formData.set("company", parsed.data.company);
  formData.set("message", parsed.data.message);
  formData.set("consent", parsed.data.consent);
  formData.set("_subject", "New portfolio enquiry");

  const formspreeResponse = await fetch(FORMSPREE_ENDPOINT, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Referer: request.headers.get("origin") ?? request.nextUrl.origin,
    },
    body: formData,
    cache: "no-store",
  });

  if (!formspreeResponse.ok) {
    return NextResponse.json(
      { error: "The enquiry service is temporarily unavailable." },
      { status: 502 },
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(CONTACT_COOKIE, "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 24 * 60 * 60,
    path: "/",
  });
  return response;
}
