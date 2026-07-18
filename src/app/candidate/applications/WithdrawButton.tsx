"use client";

import { useTransition } from "react";
import { withdrawApplication } from "@/server/actions/application";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export function WithdrawButton({ applicationId }: { applicationId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleWithdraw = () => {
    if (!confirm("Are you sure you want to withdraw this application? This action cannot be undone.")) {
      return;
    }

    startTransition(async () => {
      const result = await withdrawApplication(applicationId);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.success || "Application withdrawn.");
      }
    });
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={isPending}
      onClick={handleWithdraw}
      className="text-rose-600 hover:text-rose-800 hover:bg-rose-50 flex items-center gap-1 h-8 px-2"
    >
      <Trash2 className="h-4 w-4" />
      <span>{isPending ? "Withdrawing..." : "Withdraw"}</span>
    </Button>
  );
}
