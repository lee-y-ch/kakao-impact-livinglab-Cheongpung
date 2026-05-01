#!/usr/bin/env node
/**
 * 청풍 관리자 계정 1회 부트스트랩 스크립트.
 *
 * 사용법:
 *   node scripts/bootstrap-admin.mjs <email> <password>
 *
 * 동작:
 *   1. Supabase Auth 에 이메일/비밀번호 계정 생성 (이미 있으면 app_metadata 만 갱신)
 *   2. app_metadata.role = 'admin' 로 설정 → is_admin() RLS 통과
 *
 * 환경변수:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * 실행 전에 `.env.local` 을 로드해야 하면 `--env-file=.env.local` 플래그 사용 (Node 20+):
 *   node --env-file=.env.local scripts/bootstrap-admin.mjs <email> <password>
 */

import { createClient } from "@supabase/supabase-js";

const [email, password] = process.argv.slice(2);

if (!email || !password) {
  console.error("Usage: node scripts/bootstrap-admin.mjs <email> <password>");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) {
  console.error(
    "NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 가 필요합니다. --env-file=.env.local 를 사용하세요."
  );
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  // 기존 사용자 조회
  const { data: existingList, error: listError } =
    await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (listError) {
    console.error("listUsers failed", listError);
    process.exit(1);
  }
  const existing = existingList.users.find((u) => u.email === email);

  if (existing) {
    const { error } = await supabase.auth.admin.updateUserById(existing.id, {
      password,
      app_metadata: { ...(existing.app_metadata ?? {}), role: "admin" },
      email_confirm: true,
    });
    if (error) {
      console.error("updateUserById failed", error);
      process.exit(1);
    }
    console.log(`Updated existing admin: ${email} (${existing.id})`);
    return;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role: "admin" },
  });
  if (error) {
    console.error("createUser failed", error);
    process.exit(1);
  }
  console.log(`Created admin: ${email} (${data.user?.id})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
