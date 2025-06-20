export function NavSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center justify-between p-4">
        {/* Logo */}
        <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        
        {/* Navigation Items */}
        <div className="hidden md:flex space-x-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
        
        {/* User Menu */}
        <div className="flex items-center space-x-4">
          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    </div>
  );
} 