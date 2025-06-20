import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function ChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <Skeleton className="h-6 w-[120px]" />
          <Skeleton className="h-8 w-[80px]" />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Chart Area */}
        <Skeleton className="h-[200px] w-full" />
        
        {/* Chart Legend */}
        <div className="flex justify-center space-x-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-2">
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-3 w-[60px]" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 