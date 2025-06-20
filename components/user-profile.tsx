'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import config from '@/config';
import { SignOutButton, useUser, useOrganization } from '@clerk/nextjs';
import { CreditCard, LogOut, Settings, User, Building2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function UserProfile() {
  // Return null early if auth is disabled to prevent Clerk components from rendering
  if (!config?.auth?.enabled) {
    return null;
  }

  const router = useRouter();
  const pathname = usePathname();
  const isDashboardPage = pathname?.startsWith('/dashboard');
  const { user } = useUser();
  const { organization } = useOrganization();
  
  return (
    <div className="flex items-center gap-2">
      {!isDashboardPage && (
        <Link href="/dashboard">
          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
            Go to Dashboard
          </Button>
        </Link>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild className="w-[2.25rem] h-[2.25rem]">
          <Avatar>
            <AvatarImage src={user?.imageUrl} alt="User Profile" />
            <AvatarFallback></AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuLabel>
            My Account
            {organization && (
              <div className="text-xs text-muted-foreground font-normal mt-1">
                {organization.name}
              </div>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <Link href="/user-profile">
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
                <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
              </DropdownMenuItem>
            </Link>
            <Link href="/dashboard/settings">
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
                <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
              </DropdownMenuItem>
            </Link>
            {organization && (
              <Link href="/dashboard/organization">
                <DropdownMenuItem>
                  <Building2 className="mr-2 h-4 w-4" />
                  <span>Organization</span>
                  <DropdownMenuShortcut>⌘O</DropdownMenuShortcut>
                </DropdownMenuItem>
              </Link>
            )}
          </DropdownMenuGroup>
          <SignOutButton>
            <DropdownMenuItem>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
              <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
            </DropdownMenuItem>
          </SignOutButton>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
