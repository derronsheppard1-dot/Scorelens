"use client";

import { useEffect, useState } from "react";

type FlashMessagesProps = {
  error?: string;
  success?: string;
  autoDismissMs?: number;
};

export default function FlashMessages({
  error,
  success,
  autoDismissMs = 5000,
}: FlashMessagesProps) {
  const [visibleError, setVisibleError] = useState(error ?? "");
  const [visibleSuccess, setVisibleSuccess] = useState(success ?? "");

  useEffect(() => {
    setVisibleError(error ?? "");
  }, [error]);

  useEffect(() => {
    setVisibleSuccess(success ?? "");
  }, [success]);

  useEffect(() => {
    if (!visibleSuccess) return;

    const timer = window.setTimeout(() => {
      setVisibleSuccess("");
    }, autoDismissMs);

    return () => window.clearTimeout(timer);
  }, [visibleSuccess, autoDismissMs]);

  useEffect(() => {
    if (!visibleError) return;

    const timer = window.setTimeout(() => {
      setVisibleError("");
    }, autoDismissMs);

    return () => window.clearTimeout(timer);
  }, [visibleError, autoDismissMs]);

  if (!visibleError && !visibleSuccess) {
    return null;
  }

  return (
    <div className="space-y-2">
      {visibleError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {visibleError}
        </div>
      ) : null}

      {visibleSuccess ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {visibleSuccess}
        </div>
      ) : null}
    </div>
  );
}