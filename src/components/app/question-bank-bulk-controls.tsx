"use client";

import { useEffect, useMemo, useState } from "react";

type QuestionBankBulkControlsProps = {
  formId: string;
  totalCount: number;
};

export default function QuestionBankBulkControls({
  formId,
  totalCount,
}: QuestionBankBulkControlsProps) {
  const [selectedCount, setSelectedCount] = useState(0);

  const selector = useMemo(
    () => `input[type="checkbox"][name="questionIds"][form="${formId}"]`,
    [formId]
  );

  function updateSelectedCount() {
    const checkboxes = document.querySelectorAll<HTMLInputElement>(selector);
    const selected = Array.from(checkboxes).filter(
      (checkbox) => checkbox.checked && !checkbox.disabled
    ).length;
    setSelectedCount(selected);
  }

  function setAllChecked(checked: boolean) {
    const checkboxes = document.querySelectorAll<HTMLInputElement>(selector);

    checkboxes.forEach((checkbox) => {
      if (!checkbox.disabled) {
        checkbox.checked = checked;
      }
    });

    updateSelectedCount();
  }

  useEffect(() => {
    updateSelectedCount();

    const checkboxes = document.querySelectorAll<HTMLInputElement>(selector);

    const handleChange = () => updateSelectedCount();

    checkboxes.forEach((checkbox) => {
      checkbox.addEventListener("change", handleChange);
    });

    return () => {
      checkboxes.forEach((checkbox) => {
        checkbox.removeEventListener("change", handleChange);
      });
    };
  }, [selector, totalCount]);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm text-slate-600">
        {selectedCount} selected · {totalCount} visible question
        {totalCount === 1 ? "" : "s"}
      </span>

      <button
        type="button"
        onClick={() => setAllChecked(true)}
        className="inline-flex items-center rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        Select All Visible
      </button>

      <button
        type="button"
        onClick={() => setAllChecked(false)}
        className="inline-flex items-center rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        Clear Selection
      </button>
    </div>
  );
}