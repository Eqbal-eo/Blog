"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Trash2, X } from "lucide-react";
import { moderateComment } from "../actions";
import { button } from "@/components/ui/styles";

export function CommentActions({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const run = (decision: "approved" | "rejected" | "deleted") =>
    startTransition(async () => {
      await moderateComment(id, decision);
      router.refresh();
    });

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <button type="button" disabled={pending} onClick={() => run("approved")} className={`${button.primary} py-2`}>
        <Check className="size-4" aria-hidden />
        نشر
      </button>
      <button type="button" disabled={pending} onClick={() => run("rejected")} className={`${button.outline} py-2`}>
        <X className="size-4" aria-hidden />
        رفض
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (window.confirm("حذف التعليق نهائياً؟")) run("deleted");
        }}
        className={`${button.ghost} ms-auto hover:bg-red-50 hover:text-red-700`}
      >
        <Trash2 className="size-4" aria-hidden />
        حذف
      </button>
    </div>
  );
}
