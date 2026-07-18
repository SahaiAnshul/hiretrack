export default function RecruiterLoading() {
  return (
    <div className="w-full space-y-8 animate-pulse max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center">
        <div className="space-y-3 w-1/3">
          <div className="h-9 bg-gray-200 rounded-lg w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded-lg w-full"></div>
        </div>
        <div className="h-10 bg-gray-200 rounded-lg w-32"></div>
      </div>
      
      {/* Metrics Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <div className="h-28 bg-gray-200 rounded-2xl border border-gray-150"></div>
        <div className="h-28 bg-gray-200 rounded-2xl border border-gray-150"></div>
        <div className="h-28 bg-gray-200 rounded-2xl border border-gray-150"></div>
      </div>

      {/* Table Skeleton */}
      <div className="space-y-4 pt-6">
        <div className="h-8 bg-gray-200 rounded-lg w-1/5"></div>
        <div className="h-16 bg-gray-200 rounded-xl"></div>
        <div className="h-16 bg-gray-200 rounded-xl"></div>
        <div className="h-16 bg-gray-200 rounded-xl"></div>
      </div>
    </div>
  );
}
