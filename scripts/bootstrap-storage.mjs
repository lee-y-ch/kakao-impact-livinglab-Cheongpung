#!/usr/bin/env node
/**
 * Supabase Storage 버킷 부트스트랩 (1회성).
 *
 * 버킷:
 *   activity-photos  — 참여자 카드 사진. public read. 업로드 5MB 제한.
 *   site-assets      — 메인 hero 등 사이트 자산. public read. 업로드 10MB 제한.
 *
 * 사용법:
 *   node --env-file=.env.local scripts/bootstrap-storage.mjs
 *
 * 환경변수:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";

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

const BUCKETS = [
  {
    id: "activity-photos",
    public: true,
    file_size_limit: 5 * 1024 * 1024,
    allowed_mime_types: ["image/jpeg", "image/png", "image/webp"],
  },
  {
    id: "site-assets",
    public: true,
    file_size_limit: 10 * 1024 * 1024,
    allowed_mime_types: ["image/jpeg", "image/png", "image/webp"],
  },
];

async function main() {
  const { data: existing, error: listError } =
    await supabase.storage.listBuckets();
  if (listError) {
    console.error("listBuckets failed", listError);
    process.exit(1);
  }
  const existingIds = new Set((existing ?? []).map((b) => b.id));

  for (const bucket of BUCKETS) {
    if (existingIds.has(bucket.id)) {
      const { error } = await supabase.storage.updateBucket(bucket.id, {
        public: bucket.public,
        fileSizeLimit: bucket.file_size_limit,
        allowedMimeTypes: bucket.allowed_mime_types,
      });
      if (error) {
        console.error(`updateBucket(${bucket.id}) failed`, error);
        process.exit(1);
      }
      console.log(`Updated bucket: ${bucket.id}`);
    } else {
      const { error } = await supabase.storage.createBucket(bucket.id, {
        public: bucket.public,
        fileSizeLimit: bucket.file_size_limit,
        allowedMimeTypes: bucket.allowed_mime_types,
      });
      if (error) {
        console.error(`createBucket(${bucket.id}) failed`, error);
        process.exit(1);
      }
      console.log(`Created bucket: ${bucket.id}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
