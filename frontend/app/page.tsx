export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        
        <div className="mb-10">
          <h1 className="text-5xl font-bold mb-2">Cerebro</h1>
          <p className="text-zinc-400">
            Adaptive academic workload management.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
            <h2 className="text-xl font-semibold mb-2">
              Upcoming Deadlines
            </h2>

            <p className="text-zinc-400">
              3 assignments due this week.
            </p>
          </div>

          <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
            <h2 className="text-xl font-semibold mb-2">
              Workload Status
            </h2>

            <p className="text-yellow-400">
              Moderate overload predicted next Thursday.
            </p>
          </div>

          <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
            <h2 className="text-xl font-semibold mb-2">
              Study Hours
            </h2>

            <p className="text-zinc-400">
              18 planned hours this week.
            </p>
          </div>

        </div>
      </div>
    </main>
  );
}