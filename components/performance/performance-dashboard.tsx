'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePerformance } from '@/utils/hook/usePerformance';
import { Activity, Clock, Zap, Database, RefreshCw } from 'lucide-react';

export function PerformanceDashboard() {
  const { metrics, getNavigationTiming, getResourceTiming, clearMetrics } = usePerformance({
    trackRender: true,
    trackLoad: true,
    trackInteraction: true,
    onMetrics: (newMetrics) => {
      console.log('Performance metrics:', newMetrics);
    }
  });

  const [navigationTiming, setNavigationTiming] = useState<ReturnType<typeof getNavigationTiming>>(null);
  const [resourceTiming, setResourceTiming] = useState<ReturnType<typeof getResourceTiming>>([]);

  useEffect(() => {
    const timing = getNavigationTiming();
    const resources = getResourceTiming();
    setNavigationTiming(timing);
    setResourceTiming(resources);
  }, []);

  const formatTime = (time: number | undefined) => {
    if (time === undefined) return 'N/A';
    return `${time.toFixed(2)}ms`;
  };

  const getPerformanceScore = (time: number | undefined) => {
    if (time === undefined) return 'unknown';
    if (time < 100) return 'excellent';
    if (time < 300) return 'good';
    if (time < 1000) return 'fair';
    return 'poor';
  };

  const getScoreColor = (score: string) => {
    switch (score) {
      case 'excellent': return 'bg-green-500';
      case 'good': return 'bg-blue-500';
      case 'fair': return 'bg-yellow-500';
      case 'poor': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const handleRefresh = () => {
    clearMetrics();
    const timing = getNavigationTiming();
    const resources = getResourceTiming();
    setNavigationTiming(timing);
    setResourceTiming(resources);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Performance Dashboard</h2>
          <p className="text-muted-foreground">Monitor your application's performance metrics</p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Component Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Render Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTime(metrics.renderTime)}</div>
            <Badge className={getScoreColor(getPerformanceScore(metrics.renderTime))}>
              {getPerformanceScore(metrics.renderTime)}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Load Time</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTime(metrics.loadTime)}</div>
            <Badge className={getScoreColor(getPerformanceScore(metrics.loadTime))}>
              {getPerformanceScore(metrics.loadTime)}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interaction Time</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTime(metrics.interactionTime)}</div>
            <Badge className={getScoreColor(getPerformanceScore(metrics.interactionTime))}>
              {getPerformanceScore(metrics.interactionTime)}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Timing */}
      {navigationTiming && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Navigation Timing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">DNS Lookup</p>
                <p className="text-2xl font-bold">{formatTime(navigationTiming.dns)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">TCP Connect</p>
                <p className="text-2xl font-bold">{formatTime(navigationTiming.tcp)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Request</p>
                <p className="text-2xl font-bold">{formatTime(navigationTiming.request)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Response</p>
                <p className="text-2xl font-bold">{formatTime(navigationTiming.response)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">DOM Processing</p>
                <p className="text-2xl font-bold">{formatTime(navigationTiming.dom)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">DOM Content Loaded</p>
                <p className="text-2xl font-bold">{formatTime(navigationTiming.domContentLoaded)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Load Complete</p>
                <p className="text-2xl font-bold">{formatTime(navigationTiming.loadComplete)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">First Paint</p>
                <p className="text-2xl font-bold">{formatTime(navigationTiming.firstPaint)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resource Timing */}
      {resourceTiming.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resource Loading Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {resourceTiming.slice(0, 10).map((resource, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {resource.name.split('/').pop()}
                    </p>
                    <p className="text-xs text-muted-foreground">{resource.type}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{formatTime(resource.duration)}</p>
                    <p className="text-xs text-muted-foreground">
                      {resource.size > 0 ? `${(resource.size / 1024).toFixed(1)}KB` : 'N/A'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 