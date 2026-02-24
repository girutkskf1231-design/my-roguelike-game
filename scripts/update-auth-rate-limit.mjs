/**
 * Supabase Auth 이메일 발송 rate limit 증가 스크립트
 * Management API PATCH /v1/projects/{ref}/config/auth 사용
 *
 * 사용법:
 *   1. .env에 SUPABASE_ACCESS_TOKEN 추가 (https://supabase.com/dashboard/account/tokens 에서 발급)
 *   2. node scripts/update-auth-rate-limit.mjs [이메일_발송_한도]
 *   예: node scripts/update-auth-rate-limit.mjs 30  → 시간당 30통
 */

import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");

function loadEnv() {
  const path = resolve(rootDir, ".env");
  if (!existsSync(path)) return {};
  const content = readFileSync(path, "utf-8");
  const env = {};
  for (const line of content.split("\n")) {
    const m = line.match(/^\s*([^#=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return env;
}

function getProjectRef(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.hostname.replace(/\.supabase\.co$/, "") || null;
  } catch {
    return null;
  }
}

async function main() {
  const env = loadEnv();
  const token = env.SUPABASE_ACCESS_TOKEN || process.env.SUPABASE_ACCESS_TOKEN;
  const projectUrl = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const projectRef = env.SUPABASE_PROJECT_REF || process.env.SUPABASE_PROJECT_REF || getProjectRef(projectUrl);

  const rateLimitEmailSent = Math.max(1, parseInt(process.argv[2] || "30", 10));

  if (!token) {
    console.error("SUPABASE_ACCESS_TOKEN이 필요합니다. .env에 추가하거나 환경변수로 설정하세요.");
    console.error("발급: https://supabase.com/dashboard/account/tokens");
    process.exit(1);
  }
  if (!projectRef) {
    console.error("프로젝트 ref를 알 수 없습니다. .env에 VITE_SUPABASE_URL 또는 SUPABASE_PROJECT_REF를 설정하세요.");
    process.exit(1);
  }

  const url = `https://api.supabase.com/v1/projects/${projectRef}/config/auth`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ rate_limit_email_sent: rateLimitEmailSent }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("API 오류:", res.status, res.statusText);
    console.error(text);
    process.exit(1);
  }

  const data = await res.json();
  console.log("이메일 발송 rate limit이 적용되었습니다.");
  console.log("rate_limit_email_sent:", data.rate_limit_email_sent ?? rateLimitEmailSent);
}

main();
