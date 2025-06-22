import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface CardSkeletonProps {
  showHeader?: boolean;
  showFooter?: boolean;
  contentLines?: number;
}

export function CardSkeleton({ 
  showHeader = true, 
  showFooter = false, 
  contentLines = 3 
}: CardSkeletonProps) {
  return (
    <Card>
      {showHeader && (
        <CardHeader>
          <Skeleton className="h-6 w-[160px]" />
          <Skeleton className="h-4 w-[240px]" />
        </CardHeader>
      )}
      
      <CardContent className="space-y-3">
        {[...Array(contentLines)].map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </CardContent>
      
      {showFooter && (
        <div className="px-6 pb-6">
          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-[80px]" />
            <Skeleton className="h-8 w-[100px]" />
          </div>
        </div>
      )}
    </Card>
  );
} 