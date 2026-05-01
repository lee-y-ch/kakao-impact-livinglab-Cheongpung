import { redirect } from "next/navigation";

import { getCurrentActor } from "@/lib/auth/current-actor";
import { AdminLoginForm } from "./AdminLoginForm";

export default async function AdminLoginPage() {
  const actor = await getCurrentActor();
  if (actor.role === "admin") redirect("/admin");

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-8 p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          청풍 관리자 로그인
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          청풍 운영자 계정으로만 접근할 수 있습니다.
        </p>
      </div>

      <AdminLoginForm />
    </main>
  );
}
