import { Board } from "@/components/Board";
import { INITIAL_TASKS } from "@/lib/initial-tasks";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-6 sm:p-10">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">TaskBoard</h1>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
          カードをドラッグして列を移動できます。
        </p>
      </header>

      <Board initialTasks={INITIAL_TASKS} />
    </main>
  );
}
