import { Construction } from "lucide-react";

export default function WorkInProgressPage() {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center text-center">
      <div className="space-y-4">
        <Construction className="mx-auto h-10 w-10 text-amber-400" aria-hidden="true" />
        <h1 className="text-3xl font-semibold text-white">Work in progress</h1>
      </div>
    </section>
  );
}