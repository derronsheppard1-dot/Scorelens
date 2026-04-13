import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { deleteQuestionStandalone } from "@/lib/actions/questions";
import QuestionBankBulkControls from "@/components/app/question-bank-bulk-controls";

type QuestionBankPageProps = {
  searchParams?: Promise<{
    error?: string;
    search?: string;
    subject?: string;
    topic?: string;
    level?: string;
  }>;
};

type QuestionRow = {
  id: string;
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

type FilterOptionRow = {
  subject: string | null;
  topic: string | null;
  level: string | null;
};

function uniqueSorted(values: Array<string | null>) {
  return Array.from(new Set(values.filter(Boolean) as string[])).sort((a, b) =>
    a.localeCompare(b)
  );
}

export default async function QuestionBankPage({
  searchParams,
}: QuestionBankPageProps) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const pageError = resolvedSearchParams?.error;

  const search = (resolvedSearchParams?.search ?? "").trim();
  const subject = (resolvedSearchParams?.subject ?? "").trim();
  const topic = (resolvedSearchParams?.topic ?? "").trim();
  const level = (resolvedSearchParams?.level ?? "").trim();

  const { data: filterData, error: filterError } = await supabase
    .from("questions")
    .select("subject, topic, level")
    .eq("teacher_id", user.id);

  if (filterError) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load question bank filters: {filterError.message}
        </div>
      </div>
    );
  }

  let questionsQuery = supabase
    .from("questions")
    .select(`
      id,
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
    .eq("teacher_id", user.id)
    .order("created_at", { ascending: false });

  if (search) {
    questionsQuery = questionsQuery.ilike("question_text", `%${search}%`);
  }

  if (subject) {
    questionsQuery = questionsQuery.eq("subject", subject);
  }

  if (topic) {
    questionsQuery = questionsQuery.eq("topic", topic);
  }

  if (level) {
    questionsQuery = questionsQuery.eq("level", level);
  }

  const { data: questions, error } = await questionsQuery;

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Question Bank</h1>
            <p className="text-sm text-slate-600">
              View and manage all your saved MCQ questions.
            </p>
          </div>

          <Link
            href="/dashboard/questions/new"
            className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Create Question
          </Link>
        </div>

        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load questions: {error.message}
        </div>
      </div>
    );
  }

  const filterRows = (filterData ?? []) as FilterOptionRow[];
  const subjectOptions = uniqueSorted(filterRows.map((row) => row.subject));
  const topicOptions = uniqueSorted(filterRows.map((row) => row.topic));
  const levelOptions = uniqueSorted(filterRows.map((row) => row.level));

  const typedQuestions = (questions ?? []) as QuestionRow[];
  const bulkFormId = "bulk-add-form";

  return (
    <div className="space-y-6">
      <form
        id={bulkFormId}
        action="/dashboard/questions/add-to-assessment"
        method="get"
      />

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Question Bank</h1>
          <p className="text-sm text-slate-600">
            View and manage all your saved MCQ questions.
          </p>
        </div>

        <Link
          href="/dashboard/questions/new"
          className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Create Question
        </Link>
      </div>

      {pageError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {pageError}
        </div>
      ) : null}

      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <form method="get" className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="md:col-span-2 xl:col-span-2">
            <label
              htmlFor="search"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Search question text
            </label>
            <input
              id="search"
              name="search"
              type="text"
              defaultValue={search}
              placeholder="Search by keyword"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500"
            />
          </div>

          <div>
            <label
              htmlFor="subject"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Subject
            </label>
            <select
              id="subject"
              name="subject"
              defaultValue={subject}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
            >
              <option value="">All subjects</option>
              {subjectOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="topic"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Topic
            </label>
            <select
              id="topic"
              name="topic"
              defaultValue={topic}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
            >
              <option value="">All topics</option>
              {topicOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="level"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Level
            </label>
            <select
              id="level"
              name="level"
              defaultValue={level}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
            >
              <option value="">All levels</option>
              {levelOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-3 md:col-span-2 xl:col-span-5">
            <button
              type="submit"
              className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Apply Filters
            </button>

            <Link
              href="/dashboard/questions"
              className="inline-flex items-center rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Clear Filters
            </Link>
          </div>
        </form>
      </div>

      {typedQuestions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <h2 className="text-lg font-semibold text-slate-900">
            No matching questions found
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Try changing your search or filters, or create a new question.
          </p>

          <div className="mt-4 flex items-center justify-center gap-3">
            <Link
              href="/dashboard/questions/new"
              className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Create Question
            </Link>

            <Link
              href="/dashboard/questions"
              className="inline-flex items-center rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Clear Filters
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="sticky top-4 z-10">
            <div className="flex flex-col gap-3 rounded-xl border bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
              <QuestionBankBulkControls
                formId={bulkFormId}
                totalCount={typedQuestions.length}
              />

              <button
                type="submit"
                form={bulkFormId}
                className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                Add Selected to Assessment
              </button>
            </div>
          </div>

          <div className="grid gap-4">
            {typedQuestions.map((question, index) => (
              <div
                key={question.id}
                className="rounded-xl border bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex flex-1 gap-4">
                    <div className="pt-1">
                      <input
                        type="checkbox"
                        name="questionIds"
                        value={question.id}
                        form={bulkFormId}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                          MCQ
                        </span>

                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                          {question.marks} mark{question.marks === 1 ? "" : "s"}
                        </span>

                        {question.subject ? (
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                            {question.subject}
                          </span>
                        ) : null}

                        {question.topic ? (
                          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                            {question.topic}
                          </span>
                        ) : null}

                        {question.level ? (
                          <span className="rounded-full bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700">
                            {question.level}
                          </span>
                        ) : null}
                      </div>

                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-500">
                          Question {index + 1}
                        </p>
                        <h2 className="mt-1 text-base font-semibold text-slate-900">
                          {question.question_text}
                        </h2>
                      </div>

                      <div className="grid gap-2 text-sm text-slate-700">
                        <div className="rounded-md border border-slate-200 px-3 py-2">
                          <span className="font-medium">A.</span> {question.option_a}
                        </div>
                        <div className="rounded-md border border-slate-200 px-3 py-2">
                          <span className="font-medium">B.</span> {question.option_b}
                        </div>
                        <div className="rounded-md border border-slate-200 px-3 py-2">
                          <span className="font-medium">C.</span> {question.option_c}
                        </div>
                        <div className="rounded-md border border-slate-200 px-3 py-2">
                          <span className="font-medium">D.</span> {question.option_d}
                        </div>
                      </div>

                      <p className="text-sm font-medium text-green-700">
                        Correct answer: {question.correct_option}
                      </p>

                      <p className="text-xs text-slate-500">
                        Created: {new Date(question.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 gap-2 md:flex-col">
                    <Link
                      href={`/dashboard/questions/${question.id}/edit`}
                      className="inline-flex items-center justify-center rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Edit
                    </Link>

                    <form action={deleteQuestionStandalone}>
                      <input type="hidden" name="questionId" value={question.id} />
                      <button
                        type="submit"
                        className="inline-flex items-center justify-center rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}