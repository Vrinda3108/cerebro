export default function AnalyticsPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-5xl font-bold mb-2">
            Analytics
          </h1>

          <p className="text-zinc-400">
            Workload trends and productivity insights.
          </p>
        </div>

        {/* Top Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-2">
              Weekly Study Hours
            </h2>

            <p className="text-4xl font-bold">
              18h
            </p>

            <p className="text-zinc-400 mt-2">
              +4h from last week
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-2">
              Highest Workload
            </h2>

            <p className="text-2xl font-bold">
              CMPUT 301
            </p>

            <p className="text-zinc-400 mt-2">
              7.5 planned hours
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
              workload spike predicted Thursday
            </p>
          </div>

        </div>

        {/* Workload Heatmap */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8">

          <h2 className="text-2xl font-semibold mb-6">
            Weekly Workload Heatmap
          </h2>

          <div className="grid grid-cols-7 gap-3">

            <div className="bg-zinc-800 rounded-xl p-4 text-center">
              <p className="text-sm text-zinc-400 mb-2">Mon</p>
              <div className="h-20 rounded-lg bg-green-500/40"></div>
            </div>

            <div className="bg-zinc-800 rounded-xl p-4 text-center">
              <p className="text-sm text-zinc-400 mb-2">Tue</p>
              <div className="h-20 rounded-lg bg-green-500/60"></div>
            </div>

            <div className="bg-zinc-800 rounded-xl p-4 text-center">
              <p className="text-sm text-zinc-400 mb-2">Wed</p>
              <div className="h-20 rounded-lg bg-yellow-500/60"></div>
            </div>

            <div className="bg-zinc-800 rounded-xl p-4 text-center">
              <p className="text-sm text-zinc-400 mb-2">Thu</p>
              <div className="h-20 rounded-lg bg-red-500/70"></div>
            </div>

            <div className="bg-zinc-800 rounded-xl p-4 text-center">
              <p className="text-sm text-zinc-400 mb-2">Fri</p>
              <div className="h-20 rounded-lg bg-yellow-500/70"></div>
            </div>

            <div className="bg-zinc-800 rounded-xl p-4 text-center">
              <p className="text-sm text-zinc-400 mb-2">Sat</p>
              <div className="h-20 rounded-lg bg-green-500/40"></div>
            </div>

            <div className="bg-zinc-800 rounded-xl p-4 text-center">
              <p className="text-sm text-zinc-400 mb-2">Sun</p>
              <div className="h-20 rounded-lg bg-zinc-700"></div>
            </div>

          </div>
        </div>

        {/* Insights */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">

          <h2 className="text-2xl font-semibold mb-6">
            Adaptive Insights
          </h2>

          <div className="space-y-4">

            <div className="bg-zinc-800 rounded-xl p-4">
              <p>
                Completing your CMPUT 301 assignment one day earlier reduces projected overload risk by 18%.
              </p>
            </div>

            <div className="bg-zinc-800 rounded-xl p-4">
              <p>
                Thursday currently exceeds your preferred workload threshold by 2.5 hours.
              </p>
            </div>

            <div className="bg-zinc-800 rounded-xl p-4">
              <p>
                Your average daily workload increases significantly before exams.
              </p>
            </div>

          </div>

        </div>

      </div>
    </main>
  );
}