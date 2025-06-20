import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function ProfileSkeleton() {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        {/* Profile Avatar */}
        <div className="flex justify-center mb-4">
          <Skeleton className="h-24 w-24 rounded-full" />
        </div>
        
        {/* Name and Title */}
        <Skeleton className="h-6 w-[150px] mx-auto" />
        <Skeleton className="h-4 w-[100px] mx-auto" />
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Bio */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        
        {/* Contact Info */}
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-[120px]" />
            </div>
          ))}
        </div>
        
        {/* Action Buttons */}
        <div className="flex space-x-3">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 flex-1" />
        </div>
      </CardContent>
    </Card>
  );
} 