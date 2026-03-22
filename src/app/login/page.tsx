import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signIn } from "@/app/auth/actions";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", user.id)
      .single();

    if (profile?.onboarding_completed) {
      redirect("/dashboard");
    }

    redirect("/onboarding");
  }

  const params = searchParams ? await searchParams : undefined;
  const error = params?.error;
  const message = params?.message;

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Log in to ScoreLens</h1>
        <p className="mt-2 text-sm text-gray-600">Teacher login for the MVP.</p>

        {message ? (
          <div className="mt-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
            {message}
          </div>
        ) : null}

        {error ? (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <form action={signIn} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-md border px-3 py-2 outline-none"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full rounded-md border px-3 py-2 outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-black px-4 py-2 text-white"
          >
            Log in
          </button>
        </form>

        <p className="mt-4 text-sm text-gray-600">
          Need an account?{" "}
          <Link href="/signup" className="underline">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}