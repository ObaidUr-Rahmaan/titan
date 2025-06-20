import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-4 w-[300px]" />
      </div>
      
      {/* Settings Sections */}
      {[...Array(3)].map((_, sectionIndex) => (
        <Card key={sectionIndex}>
          <CardHeader>
            <Skeleton className="h-6 w-[150px]" />
            <Skeleton className="h-4 w-[250px]" />
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Settings Items */}
            {[...Array(2)].map((_, itemIndex) => (
              <div key={itemIndex} className="flex items-center justify-between">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-[120px]" />
                  <Skeleton className="h-3 w-[200px]" />
                </div>
                <Skeleton className="h-6 w-[44px] rounded-full" />
              </div>
            ))}
            
            {/* Form Fields */}
            <div className="space-y-4">
              {[...Array(2)].map((_, fieldIndex) => (
                <div key={fieldIndex} className="space-y-2">
                  <Skeleton className="h-4 w-[80px]" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
            
            {/* Save Button */}
            <div className="flex justify-end">
              <Skeleton className="h-10 w-[100px]" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 