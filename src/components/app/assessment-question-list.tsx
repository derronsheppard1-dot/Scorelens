"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteQuestion } from "@/lib/actions/assessments";

type Question = {
  id: string;
  position: number;
  question_id: string;
  questions: {
    question_text: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    correct_option: string;
    marks: number;
    subject?: string | null;
    topic?: string | null;
    level?: string | null;
  } | null;
};

type AssessmentQuestionsListProps = {
  assessmentId: string;
  questions: Question[];
};

export default function AssessmentQuestionsList({
  assessmentId,
  questions: initialQuestions,
}: AssessmentQuestionsListProps) {
  const router = useRouter();
  const [questions, setQuestions] = useState(initialQuestions);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const getOptionClassName = (optionLetter: string, correctOption: string) => {
    const isCorrect = optionLetter === correctOption;

    return [
      "rounded-md px-3 py-2",
      isCorrect
        ? "border border-green-200 bg-green-50 font-semibold text-green-700"
        : "text-slate-700",
    ].join(" ");
  };

  const handleDelete = (questionId: string) => {
    setError(null);

    const previousQuestions = questions;
    const nextQuestions = questions
      .filter((q) => q.id !== questionId)
      .map((q, index) => ({
        ...q,
        position: index + 1,
      }));

    setQuestions(nextQuestions);
    setPendingId(questionId);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("assessmentId", assessmentId);
      formData.set("questionId", questionId);

      const result = await deleteQuestion(formData);

      if (!result?.ok) {
        setQuestions(previousQuestions);
        setError(result?.error ?? "Failed to delete question");
      } else {
        router.refresh();
      }

      setPendingId(null);
    });
  };

  if (!questions.length) {
    return (
      <div className="space-y-3">
        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div>
          <h2 className="text-lg font-semibold text-slate-900">Questions</h2>
          <p className="mt-2 text-sm text-slate-600">
            No questions added yet. Add your first MCQ question next.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <h2 className="text-lg font-semibold text-slate-900">Questions</h2>

      <div className="space-y-4">
        {questions.map((question) => {
          const q = question.questions;

          if (!q) return null;

          return (
            <div
              key={question.id}
              className="rounded-lg border border-slate-200 p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {question.position}. {q.question_text}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Correct answer: {q.correct_option} · Marks: {q.marks}
                  </p>

                  {(q.subject || q.topic || q.level) && (
                    <p className="mt-1 text-xs text-slate-400">
                      {[q.subject, q.topic, q.level]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/dashboard/assessments/${assessmentId}/edit?questionId=${question.id}`}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Edit
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      if (
                        confirm("Are you sure you want to delete this question?")
                      ) {
                        handleDelete(question.id);
                      }
                    }}
                    disabled={isPending && pendingId === question.id}
                    className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isPending && pendingId === question.id
                      ? "Deleting..."
                      : "Delete"}
                  </button>
                </div>
              </div>

              <ul className="mt-3 space-y-2 text-sm">
                <li className={getOptionClassName("A", q.correct_option)}>
                  A. {q.option_a}
                </li>
                <li className={getOptionClassName("B", q.correct_option)}>
                  B. {q.option_b}
                </li>
                <li className={getOptionClassName("C", q.correct_option)}>
                  C. {q.option_c}
                </li>
                <li className={getOptionClassName("D", q.correct_option)}>
                  D. {q.option_d}
                </li>
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}