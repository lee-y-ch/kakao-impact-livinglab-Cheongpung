import { createClient } from "@supabase/supabase-js";

import type { Database } from "./types";

/**
 * Service role 키로 동작하는 서버 전용 Supabase 클라이언트.
 * RLS 를 우회하므로 절대 브라우저에 노출 금지.
 *
 * 사용처:
 *   - 카카오 OAuth callback 의 users 행 upsert
 *   - 가게 코드 / 관리자 감사 로그 (auth_events)
 *   - 관리자 API (Phase 3 이후)
 *   - 시드 스크립트
 *
 * 매 호출마다 새로 생성 (Next.js 캐싱 간섭 방지).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 가 설정되지 않았습니다."
    );
  }
  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
