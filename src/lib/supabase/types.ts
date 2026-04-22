/**
 * Database type placeholder.
 *
 * Phase 1 말미에 아래 커맨드로 실제 스키마 기반 타입을 생성해서 이 파일을 덮어쓸 것:
 *
 *   npx supabase gen types typescript --project-id <PROJECT_REF> --schema public > src/lib/supabase/types.ts
 *
 * 지금은 any로 두되, 모든 supabase 호출은 이 Database 제네릭을 통과하도록 배선해둔다.
 */
export type Database = any;
