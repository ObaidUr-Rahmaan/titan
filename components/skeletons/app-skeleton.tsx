import { NavSkeleton } from './nav-skeleton';

export function AppSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <NavSkeleton />
      
      {/* Main Content */}
      <div className="animate-pulse container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Page Header */}
          <div className="space-y-4">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
          
          {/* Content Blocks */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            </div>
            <div className="space-y-6">
              <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 