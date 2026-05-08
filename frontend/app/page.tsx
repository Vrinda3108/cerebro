export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-5xl font-bold mb-2">
            Dashboard
          </h1>

          <p className="text-zinc-400">
            Adaptive workload overview for this week.
          </p>
        </div>

        {/* Top Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-2">
              Upcoming Deadlines
            </h2>

            <p className="text-4xl font-bold">
              5
            </p>

            <p className="text-zinc-400 mt-2">
              assignments due this week
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-2">
              Burnout Risk
            </h2>

            <p className="text-4xl font-bold text-yellow-400">
              Medium
            </p>

            <p className="text-zinc-400 mt-2">
              overload predicted Thursday
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-2">
              Planned Study Hours
            </h2>

            <p className="text-4xl font-bold">
              18h
            </p>

            <p className="text-zinc-400 mt-2">
              distributed across 6 days
            </p>
          </div>

        </div>

        {/* Schedule Section */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8">

          <h2 className="text-2xl font-semibold mb-6">
            Today's Schedule
          </h2>

          <div className="space-y-4">

            <div className="bg-zinc-800 rounded-xl p-4 flex justify-between items-center">
              <div>
                <h3 className="font-semibold">
                  CMPUT 301 Assignment
                </h3>

                <p className="text-zinc-400 text-sm">
                  2 hours planned
                </p>
              </div>

              <button className="bg-white text-black px-4 py-2 rounded-lg font-medium">
                Complete
              </button>
            </div>

            <div className="bg-zinc-800 rounded-xl p-4 flex justify-between items-center">
              <div>
                <h3 className="font-semibold">
                  Calculus Midterm Review
                </h3>

                <p className="text-zinc-400 text-sm">
                  1.5 hours planned
                </p>
              </div>

              <button className="bg-white text-black px-4 py-2 rounded-lg font-medium">
                Complete
              </button>
            </div>

          </div>
        </div>

        {/* Adaptive Warning */}
        <div className="bg-yellow-500/10 border border-yellow-500 rounded-2xl p-6">

          <h2 className="text-2xl font-semibold text-yellow-300 mb-2">
            Adaptive Warning
          </h2>

          <p className="text-zinc-300">
            If you skip today's planned work, your projected workload for Friday increases by 32%.
          </p>

        </div>

      </div>
    </main>
  );
}