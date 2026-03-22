import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { completeOnboarding, signOut } from "@/app/auth/actions";

type OnboardingPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

const GRADE_LEVEL_OPTIONS = [
  "Form 1",
  "Form 2",
  "Form 3",
  "Form 4",
  "Form 5",
  "Form 6",
];

export default async function OnboardingPage({
  searchParams,
}: OnboardingPageProps) {
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
    .select(
      "id, full_name, email, onboarding_completed, school_name, subject, grade_levels, preferred_workflow"
    )
    .eq("id", user.id)
    .single();

  if (profileError) {
    return (
      <main className="min-h-screen p-8">
        <pre className="whitespace-pre-wrap text-sm text-red-700">
          {JSON.stringify(
            {
              message: profileError.message,
              code: profileError.code,
              details: profileError.details,
            },
            null,
            2
          )}
        </pre>
      </main>
    );
  }

  if (profile.onboarding_completed) {
    redirect("/dashboard");
  }

  const params = searchParams ? await searchParams : undefined;
  const error = params?.error;

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-2xl rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Welcome to ScoreLens
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Let’s set up your teacher profile before you start creating assessments.
            </p>
          </div>

          <form action={signOut}>
            <button
              type="submit"
              className="rounded-md border px-3 py-2 text-sm text-gray-700"
            >
              Log out
            </button>
          </form>
        </div>

        {error ? (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <form action={completeOnboarding} className="mt-6 space-y-6">
          <div>
            <label htmlFor="fullName" className="mb-1 block text-sm font-medium">
              Full name
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              defaultValue={profile.full_name || ""}
              className="w-full rounded-md border px-3 py-2 outline-none"
            />
          </div>

          <div>
            <label htmlFor="schoolName" className="mb-1 block text-sm font-medium">
              School name
            </label>
            <input
              id="schoolName"
              name="schoolName"
              type="text"
              required
              defaultValue={profile.school_name || ""}
              className="w-full rounded-md border px-3 py-2 outline-none"
            />
          </div>

          <div>
            <label htmlFor="subject" className="mb-1 block text-sm font-medium">
              Main subject
            </label>
            <input
              id="subject"
              name="subject"
              type="text"
              required
              defaultValue={profile.subject || ""}
              placeholder="e.g. Geography"
              className="w-full rounded-md border px-3 py-2 outline-none"
            />
          </div>

          <div>
            <p className="mb-2 block text-sm font-medium">Grade levels taught</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {GRADE_LEVEL_OPTIONS.map((level) => {
                const checked = profile.grade_levels?.includes(level) ?? false;

                return (
                  <label
                    key={level}
                    className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      name="gradeLevels"
                      value={level}
                      defaultChecked={checked}
                    />
                    <span>{level}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <p className="mb-2 block text-sm font-medium">Preferred workflow</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  value: "manual",
                  title: "Manual",
                  desc: "Type questions yourself",
                },
                {
                  value: "ai",
                  title: "AI-assisted",
                  desc: "Import and extract questions",
                },
                {
                  value: "both",
                  title: "Both",
                  desc: "Use manual and AI together",
                },
              ].map((option) => (
                <label
                  key={option.value}
                  className="block cursor-pointer rounded-xl border p-4"
                >
                  <input
                    type="radio"
                    name="preferredWorkflow"
                    value={option.value}
                    defaultChecked={profile.preferred_workflow === option.value}
                    className="mr-2"
                  />
                  <span className="font-medium">{option.title}</span>
                  <p className="mt-1 text-sm text-gray-600">{option.desc}</p>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-black px-4 py-2 text-white"
          >
            Complete setup
          </button>
        </form>
      </div>
    </main>
  );
}