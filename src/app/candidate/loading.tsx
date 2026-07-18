export default function CandidateLoading() {
  return (
    <div className="w-full space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="space-y-3">
        <div className="h-9 bg-gray-200 rounded-lg w-1/3"></div>
        <div className="h-4 bg-gray-200 rounded-lg w-1/2"></div>
      </div>
      
      {/* Content Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="h-40 bg-gray-200 rounded-2xl border border-gray-100"></div>
        <div className="h-40 bg-gray-200 rounded-2xl border border-gray-100"></div>
        <div className="h-40 bg-gray-200 rounded-2xl border border-gray-100"></div>
      </div>

      {/* List Skeleton */}
      <div className="space-y-4 pt-4">
        <div className="h-16 bg-gray-200 rounded-xl"></div>
        <div className="h-16 bg-gray-200 rounded-xl"></div>
        <div className="h-16 bg-gray-200 rounded-xl"></div>
      </div>
    </div>
  );
}
