// api/groq-chat-handler.js — Vercel Serverless Function

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ALLOWED_ORIGINS = ["https://yourapp.com", "http://localhost:3000"];

const MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const TIMEOUT_MS = 15000;

// Redis client (Upstash REST API — serverless-friendly, no persistent connection needed)
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// 20 requests per 60 seconds, per IP — sliding window (accurate across all instances)
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "60 s"),
  analytics: true, // Upstash dashboard mein usage dikhega
  prefix: "ratelimit:groq-tutor",
});

function isValidMessages(messages) {
  return (
    Array.isArray(messages) &&
    messages.length > 0 &&
    messages.every(
      (m) =>
        m &&
        typeof m.role === "string" &&
        ["system", "user", "assistant"].includes(m.role) &&
        typeof m.content === "string" &&
        m.content.trim().length > 0,
    )
  );
}

export default async function handler(req, res) {
  // 1. CORS
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Vary", "Origin");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
      answer: "Bhai, sirf POST requests allowed hain! ❌",
    });
  }

  // 2. Rate limiting (Upstash Redis — shared across ALL instances)
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "unknown";

  try {
    const { success, limit, remaining, reset } = await ratelimit.limit(ip);

    res.setHeader("X-RateLimit-Limit", limit);
    res.setHeader("X-RateLimit-Remaining", remaining);

    if (!success) {
      const retryAfter = Math.ceil((reset - Date.now()) / 1000);
      res.setHeader("Retry-After", retryAfter);
      return res.status(429).json({
        error: "Too many requests",
        answer: `Thoda ruk jao bhai, ${retryAfter} second baad try karo! ⏳`,
      });
    }
  } catch (rateLimitError) {
    // Agar Redis down ho jaye, fail-open (request allow karo, block mat karo)
    console.error(
      "Rate limiter error (allowing request):",
      rateLimitError.message,
    );
  }

  // 3. Env check
  if (!process.env.GROQ_API_KEY) {
    console.error("Server Configuration Error: GROQ_API_KEY is missing.");
    return res.status(500).json({
      error: "Internal configuration error",
      answer: "Server side par thodi dikkat hai, API key missing hai. ⚙️",
    });
  }

  // 4. Parse & validate body
  const { messages, question } = req.body || {};
  let finalMessages;

  if (messages && isValidMessages(messages)) {
    finalMessages = messages;
  } else if (question && typeof question === "string" && question.trim()) {
    finalMessages = [
      {
        role: "system",
        content:
          "Tu Gateway AI tutor hai. Hinglish mein 3-4 lines mein jawab do. Friendly tone rakho.",
      },
      { role: "user", content: question.trim() },
    ];
  } else {
    return res.status(400).json({
      error: "Bad Request: Valid messages array or question string required",
      answer: "Kuch toh poochho bhai! 😄",
    });
  }

  // 5. Call Groq API with timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 350,
          temperature: 0.7,
          messages: finalMessages,
        }),
        signal: controller.signal,
      },
    );

    clearTimeout(timeoutId);
    const data = await response.json();

    if (!response.ok) {
      console.error("Groq API Error:", response.status, data?.error?.message);
      return res.status(response.status).json({
        error: data.error?.message || "Error from Groq API",
        answer:
          "Groq API se connect karne mein dikkat aa rahi hai. Dobara try karein! 🔄",
      });
    }

    const answer =
      data.choices?.[0]?.message?.content ||
      "Jawab nahi mila. Dobara try karo! 🤔";

    return res.status(200).json({
      answer,
      usage: data.usage || null,
    });
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === "AbortError") {
      return res.status(504).json({
        error: "Request timed out",
        answer:
          "Response aane mein bahut time lag raha hai. Dobara try karein! ⏱️",
      });
    }

    console.error("Handler Runtime Exception:", error.message);
    return res.status(500).json({
      error: "Internal Server Error",
      answer:
        "Server par thoda load hai ya network issue hai. Thodi der baad try karein! 🛠️",
    });
  }
}
