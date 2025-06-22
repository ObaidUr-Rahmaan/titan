import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function DashboardSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-[200px]" />
          <Skeleton className="h-4 w-[300px]" />
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-7 w-[60px] mb-1" />
                <Skeleton className="h-3 w-[120px]" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Left Column */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-[150px]" />
                <Skeleton className="h-4 w-[250px]" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-start space-x-3">
                      <Skeleton className="h-4 w-4 mt-1" />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-4 w-[200px]" />
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-6 w-[80px]" />
                            <Skeleton className="h-6 w-[60px]" />
                          </div>
                        </div>
                        <Skeleton className="h-3 w-[150px]" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-[120px]" />
                <Skeleton className="h-4 w-[180px]" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-[200px] w-full" />
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-[80px]" />
                    <Skeleton className="h-4 w-[60px]" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 