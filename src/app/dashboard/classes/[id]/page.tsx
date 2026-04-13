import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type ClassDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{
    success?: string;
    error?: string;
  }>;
};

export default async function ClassDetailPage({
  params,
  searchParams,
}: ClassDetailPageProps) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  const [
    { data: classItem, error: classError },
    { data: students, error: studentsError, count: studentCount },
  ] = await Promise.all([
    supabase
      .from("classes")
      .select("id, teacher_id, name, subject, grade_level, school_year, created_at, updated_at")
      .eq("id", id)
      .eq("teacher_id", user.id)
      .single(),
    supabase
      .from("students")
      .select("id, full_name, student_code, is_active, created_at", {
        count: "exact",
      })
      .eq("class_id", id)
      .eq("teacher_id", user.id)
      .order("full_name", { ascending: true }),
  ]);

  if (classError || !classItem) {
    redirect(
      `/dashboard/classes?error=${encodeURIComponent(
        classError?.message || "Class not found."
      )}`
    );
  }

  if (studentsError) {
    redirect(
      `/dashboard/classes?error=${encodeURIComponent(
        studentsError.message || "Failed to load class details."
      )}`
    );
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{classItem.name}</h1>
          <p className="text-sm text-neutral-600">
            View and manage this class.
          </p>
        </div>

        <Link
          href="/dashboard/classes"
          className="rounded-md border px-4 py-2 text-sm hover:bg-neutral-50"
        >
          Back to Classes
        </Link>
      </div>

      {resolvedSearchParams?.success ? (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {resolvedSearchParams.success}
        </div>
      ) : null}

      {resolvedSearchParams?.error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {resolvedSearchParams.error}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-semibold">Class Information</h2>

          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wide text-neutral-500">
                Class name
              </dt>
              <dd className="mt-1 text-sm font-medium">{classItem.name}</dd>
            </div>

            <div>
              <dt className="text-xs uppercase tracking-wide text-neutral-500">
                Subject
              </dt>
              <dd className="mt-1 text-sm">{classItem.subject || "Not set"}</dd>
            </div>

            <div>
              <dt className="text-xs uppercase tracking-wide text-neutral-500">
                Grade level
              </dt>
              <dd className="mt-1 text-sm">{classItem.grade_level || "Not set"}</dd>
            </div>

            <div>
              <dt className="text-xs uppercase tracking-wide text-neutral-500">
                School year
              </dt>
              <dd className="mt-1 text-sm">{classItem.school_year || "Not set"}</dd>
            </div>

            <div>
              <dt className="text-xs uppercase tracking-wide text-neutral-500">
                Created
              </dt>
              <dd className="mt-1 text-sm">
                {new Date(classItem.created_at).toLocaleString()}
              </dd>
            </div>

            <div>
              <dt className="text-xs uppercase tracking-wide text-neutral-500">
                Last updated
              </dt>
              <dd className="mt-1 text-sm">
                {new Date(classItem.updated_at).toLocaleString()}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Quick Actions</h2>

          <div className="mt-4 space-y-3">
            <Link
              href={`/dashboard/sittings/new?classId=${classItem.id}`}
              className="block rounded-md bg-black px-4 py-2 text-center text-sm font-medium text-white hover:opacity-90"
            >
              Create Sitting
            </Link>

            <Link
              href={`/dashboard/students/new?classId=${classItem.id}`}
              className="block rounded-md border px-4 py-2 text-center text-sm hover:bg-neutral-50"
            >
              Add Student
            </Link>

            <Link
              href={`/dashboard/students/import?classId=${classItem.id}`}
              className="block rounded-md border px-4 py-2 text-center text-sm hover:bg-neutral-50"
            >
              Bulk Import Students
            </Link>
          </div>

          <div className="mt-6 rounded-lg border bg-neutral-50 p-4">
            <div className="text-xs uppercase tracking-wide text-neutral-500">
              Students
            </div>
            <div className="mt-2 text-2xl font-semibold">
              {studentCount ?? 0}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b p-6">
          <div>
            <h2 className="text-lg font-semibold">Class Roster</h2>
            <p className="text-sm text-neutral-600">
              Students currently enrolled in this class.
            </p>
          </div>
        </div>

        {!students || students.length === 0 ? (
          <div className="p-6 text-sm text-neutral-600">
            No students yet. Add a student or bulk import a class list.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-neutral-50 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Student Code</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {students.map((student) => (
                  <tr key={student.id}>
                    <td className="px-4 py-3">{student.full_name}</td>
                    <td className="px-4 py-3 font-mono">{student.student_code}</td>
                    <td className="px-4 py-3">
                      {student.is_active ? "Active" : "Inactive"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}