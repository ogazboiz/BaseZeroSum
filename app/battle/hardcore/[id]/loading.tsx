export default function HardcoreBattleLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Skeleton */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-red-200 rounded animate-pulse"></div>
            <div className="w-48 h-8 bg-slate-200 rounded animate-pulse"></div>
          </div>
          <div className="w-64 h-6 bg-slate-200 rounded animate-pulse mx-auto"></div>
        </div>

        {/* Game Status Skeleton */}
        <div className="bg-white rounded-lg border shadow-sm mb-6">
          <div className="p-6">
            <div className="w-32 h-6 bg-slate-200 rounded animate-pulse mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="text-center p-4 bg-slate-50 rounded-lg">
                  <div className="w-16 h-4 bg-slate-200 rounded animate-pulse mx-auto mb-2"></div>
                  <div className="w-20 h-6 bg-slate-200 rounded animate-pulse mx-auto"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Game Rules Skeleton */}
        <div className="bg-white rounded-lg border shadow-sm mb-6">
          <div className="p-6">
            <div className="w-32 h-6 bg-slate-200 rounded animate-pulse mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-slate-200 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="w-full h-4 bg-slate-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons Skeleton */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <div className="w-32 h-12 bg-slate-200 rounded animate-pulse"></div>
          <div className="w-32 h-12 bg-slate-200 rounded animate-pulse"></div>
        </div>

        {/* Back Button Skeleton */}
        <div className="text-center mt-8">
          <div className="w-40 h-10 bg-slate-200 rounded animate-pulse mx-auto"></div>
        </div>
      </div>
    </div>
  )
}
