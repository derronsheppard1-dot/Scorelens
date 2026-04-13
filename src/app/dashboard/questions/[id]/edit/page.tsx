import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateQuestion } from "@/lib/actions/questions";

type EditQuestionPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    error?: string;
  }>;
};

type QuestionRow = {
  id: string;
  teacher_id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  marks: number;
  subject: string | null;
  topic: string | null;
  level: string | null;
  created_at: string;
  updated_at: string;
};

export default async function EditQuestionPage({
  params,
  searchParams,
}: EditQuestionPageProps) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const pageError = resolvedSearchParams?.error;

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: question, error } = await supabase
    .from("questions")
    .select(`
      id,
      teacher_id,
      question_text,
      option_a,
      option_b,
      option_c,
      option_d,
      correct_option,
      marks,
      subject,
      topic,
      level,
      created_at,
      updated_at
    `)
    .eq("id", id)
    .eq("teacher_id", user.id)
    .single();

  if (error || !question) {
    redirect(
      `/dashboard/questions?error=${encodeURIComponent("Question not found")}`
    );
  }

  const typedQuestion = question as QuestionRow;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Question</h1>
          <p className="text-sm text-slate-600">
            Update this MCQ in your question bank.
          </p>
        </div>

        <Link
          href="/dashboard/questions"
          className="inline-flex items-center rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Back to Question Bank
        </Link>
      </div>

      {pageError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {pageError}
        </div>
      ) : null}

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <form action={updateQuestion} className="space-y-6">
          <input type="hidden" name="id" value={typedQuestion.id} />

          <div className="space-y-2">
            <label
              htmlFor="question_text"
              className="block text-sm font-medium text-slate-700"
            >
              Question Text
            </label>
            <textarea
              id="question_text"
              name="question_text"
              rows={4}
              required
              defaultValue={typedQuestion.question_text}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-0 placeholder:text-slate-400 focus:border-slate-500"
              placeholder="Enter the full question here"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor="option_a"
                className="block text-sm font-medium text-slate-700"
              >
                Option A
              </label>
              <input
                id="option_a"
                name="option_a"
                type="text"
                required
                defaultValue={typedQuestion.option_a}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="option_b"
                className="block text-sm font-medium text-slate-700"
              >
                Option B
              </label>
              <input
                id="option_b"
                name="option_b"
                type="text"
                required
                defaultValue={typedQuestion.option_b}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="option_c"
                className="block text-sm font-medium text-slate-700"
              >
                Option C
              </label>
              <input
                id="option_c"
                name="option_c"
                type="text"
                required
                defaultValue={typedQuestion.option_c}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="option_d"
                className="block text-sm font-medium text-slate-700"
              >
                Option D
              </label>
              <input
                id="option_d"
                name="option_d"
                type="text"
                required
                defaultValue={typedQuestion.option_d}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label
                htmlFor="correct_option"
                className="block text-sm font-medium text-slate-700"
              >
                Correct Option
              </label>
              <select
                id="correct_option"
                name="correct_option"
                required
                defaultValue={typedQuestion.correct_option}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
              >
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="marks"
                className="block text-sm font-medium text-slate-700"
              >
                Marks
              </label>
              <input
                id="marks"
                name="marks"
                type="number"
                min={1}
                required
                defaultValue={typedQuestion.marks}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="subject"
                className="block text-sm font-medium text-slate-700"
              >
                Subject
              </label>
              <input
                id="subject"
                name="subject"
                type="text"
                defaultValue={typedQuestion.subject ?? ""}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500"
                placeholder="e.g. Geography"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="topic"
                className="block text-sm font-medium text-slate-700"
              >
                Topic
              </label>
              <input
                id="topic"
                name="topic"
                type="text"
                defaultValue={typedQuestion.topic ?? ""}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500"
                placeholder="e.g. Climate"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="level"
              className="block text-sm font-medium text-slate-700"
            >
              Level
            </label>
            <input
              id="level"
              name="level"
              type="text"
              defaultValue={typedQuestion.level ?? ""}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500 md:max-w-xs"
              placeholder="e.g. Form 4 / CSEC / CAPE"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Save Changes
            </button>

            <Link
              href="/dashboard/questions"
              className="inline-flex items-center rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}