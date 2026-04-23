#!/usr/bin/env node
/**
 * 개발용 참여자 계정 부트스트랩 (카카오 OAuth 우회 임시 조치).
 *
 * 사용법:
 *   node --env-file=.env.local scripts/bootstrap-dev-user.mjs <email> <password> [닉네임]
 *
 * 동작:
 *   1. Supabase Auth 에 이메일/비밀번호 계정 생성 (이미 있으면 비밀번호·email_confirm 갱신)
 *   2. public.users 행을 auth_user_id 기준으로 upsert (kakao_id 는 null)
 *
 * 주의:
 *   - 카카오 비즈 앱 전환되면 이 스크립트로 만든 사용자는 그대로 둬도 되고 지워도 됨.
 *   - `.env.local` 에 DEV_USER_EMAIL / DEV_USER_PASSWORD 를 맞춰두면 /api/dev/login 이 이 계정으로 로그인함.
 */

import { createClient } from "@supabase/supabase-js";

const [email, password, nicknameArg] = process.argv.slice(2);

if (!email || !password) {
  console.error(
    "Usage: node scripts/bootstrap-dev-user.mjs <email> <password> [nickname]"
  );
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

const nickname = nicknameArg ?? "강화 여행자(DEV)";

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function ensureAuthUser() {
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
      email_confirm: true,
    });
    if (error) {
      console.error("updateUserById failed", error);
      process.exit(1);
    }
    console.log(`Updated existing auth user: ${email} (${existing.id})`);
    return existing.id;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) {
    console.error("createUser failed", error);
    process.exit(1);
  }
  console.log(`Created auth user: ${email} (${data.user?.id})`);
  return data.user.id;
}

async function ensureProfile(authUserId) {
  const { error } = await supabase.from("users").upsert(
    {
      auth_user_id: authUserId,
      kakao_id: null,
      nickname,
      profile_image_url: null,
    },
    { onConflict: "auth_user_id" }
  );
  if (error) {
    console.error("users upsert failed", error);
    process.exit(1);
  }
  console.log(`Upserted public.users for auth_user_id=${authUserId}`);
}

async function main() {
  const authUserId = await ensureAuthUser();
  await ensureProfile(authUserId);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
