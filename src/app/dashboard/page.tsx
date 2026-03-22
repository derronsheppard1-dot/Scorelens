import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Card from "@/components/ui/card";
import PageHeader from "@/components/app/page-header";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      "id, email, full_name, role, onboarding_completed, school_name, subject, grade_levels, preferred_workflow"
    )
    .eq("id", user!.id)
    .single();

  if (profileError || !profile) {
    return (
      <div className="py-8">
        <pre className="whitespace-pre-wrap text-sm text-red-700">
          {JSON.stringify(
            {
              message: profileError?.message,
              code: profileError?.code,
              details: profileError?.details,
            },
            null,
            2
          )}
        </pre>
      </div>
    );
  }

  const [{ count: assessmentCount }, { count: classCount }, { count: studentCount }] =
    await Promise.all([
      supabase
        .from("assessments")
        .select("*", { count: "exact", head: true })
        .eq("teacher_id", user!.id),
      supabase
        .from("classes")
        .select("*", { count: "exact", head: true })
        .eq("teacher_id", user!.id),
      supabase
        .from("students")
        .select("*", { count: "exact", head: true })
        .eq("teacher_id", user!.id),
    ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${profile.full_name || "Teacher"}`}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/dashboard/assessments">
          <Card className="transition hover:bg-slate-50">
            <p className="text-sm text-slate-500">Assessments</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {assessmentCount ?? 0}
            </p>
          </Card>
        </Link>

        <Card>
          <p className="text-sm text-slate-500">Classes</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {classCount ?? 0}
          </p>
        </Card>

        <Card>
          <p className="text-sm text-slate-500">Students</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {studentCount ?? 0}
          </p>
        </Card>
      </div>

      <Card>
        <h2 className="text-lg font-semibold text-slate-900">Account Info</h2>
        <div className="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
          <p>
            <strong>Name:</strong> {profile.full_name}
          </p>
          <p>
            <strong>Email:</strong> {profile.email}
          </p>
          <p>
            <strong>Role:</strong> {profile.role}
          </p>
          <p>
            <strong>School:</strong> {profile.school_name || "—"}
          </p>
          <p>
            <strong>Subject:</strong> {profile.subject || "—"}
          </p>
          <p>
            <strong>Grade Levels:</strong>{" "}
            {profile.grade_levels?.length ? profile.grade_levels.join(", ") : "—"}
          </p>
          <p>
            <strong>Preferred Workflow:</strong>{" "}
            {profile.preferred_workflow || "—"}
          </p>
        </div>
      </Card>
    </div>
  );
}