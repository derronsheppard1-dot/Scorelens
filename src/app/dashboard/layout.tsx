import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";

type DashboardLayoutProps = {
  children: ReactNode;
};

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/assessments", label: "Assessments" },
  { href: "/dashboard/questions", label: "Question Bank" }, 
  { href: "/dashboard/classes", label: "Classes" },
  { href: "/dashboard/students", label: "Students" },
];

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, email, onboarding_completed")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    redirect("/login");
  }

  if (!profile.onboarding_completed) {
    redirect("/onboarding");
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="grid min-h-screen md:grid-cols-[260px_1fr]">
        <aside className="border-r border-slate-200 bg-white">
          <div className="flex h-full flex-col">
            <div className="border-b border-slate-200 px-6 py-5">
              <Link href="/dashboard" className="block">
                <div className="text-2xl font-bold tracking-tight">ScoreLens</div>
                <p className="mt-1 text-sm text-slate-500">
                  Teacher assessment workspace
                </p>
              </Link>
            </div>

            <nav className="flex-1 px-4 py-4">
              <div className="space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </nav>

            <div className="border-t border-slate-200 px-4 py-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-sm font-medium text-slate-900">
                  {profile.full_name || "Teacher"}
                </p>
                <p className="mt-1 text-xs text-slate-500">{profile.email}</p>

                <form action={signOut} className="mt-3">
                  <button
                    type="submit"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                  >
                    Log out
                  </button>
                </form>
              </div>
            </div>
          </div>
        </aside>

        <main className="min-w-0">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}