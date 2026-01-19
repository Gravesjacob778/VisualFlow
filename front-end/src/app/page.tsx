import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">VisualFlow</h1>
        <p className="mt-2 text-muted-foreground">
          Visual workflow automation editor
        </p>
      </div>
      <div className="flex flex-col items-center gap-3 sm:flex-row">
        <Link
          href="/editor/new"
          className="rounded-lg bg-primary px-6 py-3 text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Create New Workflow
        </Link>
        <Link
          href="/robot-sim"
          className="rounded-lg border border-border px-6 py-3 text-foreground transition-colors hover:bg-muted"
        >
          Open Robot Simulation
        </Link>
      </div>
    </main>
  );
}
