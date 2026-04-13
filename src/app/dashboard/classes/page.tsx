import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type ClassesPageProps = {
  searchParams?: Promise<{
    success?: string;
    error?: string;
  }>;
};

export default async function ClassesPage({
  searchParams,
}: ClassesPageProps) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: classes, error } = await supabase
    .from("classes")
    .select("id, name, subject, grade_level, school_year, created_at")
    .eq("teacher_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    redirect(`/dashboard?error=${encodeURIComponent(error.message)}`);
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const successMessage = resolvedSearchParams?.success;
  const errorMessage = resolvedSearchParams?.error;

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Classes</h1>
          <p className="text-sm text-neutral-600">
            Manage your teaching classes.
          </p>
        </div>

        <Link
          href="/dashboard/classes/new"
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Create Class
        </Link>
      </div>

      {successMessage ? (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {successMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="rounded-xl border bg-white shadow-sm">
        {!classes || classes.length === 0 ? (
          <div className="p-6 text-sm text-neutral-600">
            No classes yet. Create your first class to start scheduling sittings.
          </div>
        ) : (
          <div className="divide-y">
            {classes.map((classItem) => (
              <Link
                key={classItem.id}
                href={`/dashboard/classes/${classItem.id}`}
                className="block p-4 hover:bg-neutral-50"
              >
                <div className="font-medium">{classItem.name}</div>
                <div className="mt-1 text-sm text-neutral-600">
                  {[classItem.subject, classItem.grade_level, classItem.school_year]
                    .filter(Boolean)
                    .join(" • ")}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}