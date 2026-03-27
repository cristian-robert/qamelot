import type { ElementType } from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Key,
  Settings,
  FileText,
  PlayCircle,
  Flag,
  Bug,
  BarChart3,
  Cog,
  Layers,
  FormInput,
  LayoutList,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: ElementType;
}

export interface ProjectNavItem {
  label: string;
  segment: string;
  icon: ElementType;
}

export const mainNav: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Projects', href: '/projects', icon: FolderKanban },
];

export const adminNav: NavItem[] = [
  { label: 'Users', href: '/users', icon: Users },
];

export const bottomNav: NavItem[] = [
  { label: 'API Keys', href: '/settings/api-keys', icon: Key },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export const projectNav: ProjectNavItem[] = [
  { label: 'Overview', segment: '', icon: LayoutList },
  { label: 'Test Cases', segment: 'cases', icon: FileText },
  { label: 'Plans & Runs', segment: 'plans', icon: PlayCircle },
  { label: 'Milestones', segment: 'milestones', icon: Flag },
  { label: 'Defects', segment: 'defects', icon: Bug },
  { label: 'Reports', segment: 'reports', icon: BarChart3 },
  { label: 'Configs', segment: 'configs', icon: Cog },
  { label: 'Shared Steps', segment: 'shared-steps', icon: Layers },
  { label: 'Custom Fields', segment: 'custom-fields', icon: FormInput },
];

/**
 * Extract project ID from pathname if inside a project route.
 * Returns null when outside a project context.
 */
export function extractProjectId(pathname: string): string | null {
  const match = pathname.match(/^\/projects\/([^/]+)/);
  return match ? match[1] : null;
}
