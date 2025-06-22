import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FolderOpen } from 'lucide-react';

export default function OrganizationProjectsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Manage and organize your organization's projects.
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>

      {/* Placeholder content */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <FolderOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle>Projects Management</CardTitle>
              <CardDescription>
                Project management features will be implemented in future tasks
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This section will contain project creation, management, and collaboration features 
            specific to your organization. Features will include:
          </p>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>• Create and manage organization projects</li>
            <li>• Assign team members to projects</li>
            <li>• Project-specific permissions and access control</li>
            <li>• Project templates and workflows</li>
            <li>• Integration with existing billing and subscription features</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
} 