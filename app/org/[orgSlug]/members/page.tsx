import { OrganizationMemberList } from '@/components/organizations';

export default function OrganizationMembersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Team Members</h1>
        <p className="text-muted-foreground">
          Manage your organization's team members and their roles.
        </p>
      </div>
      <OrganizationMemberList />
    </div>
  );
} 