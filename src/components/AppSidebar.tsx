import { Building2, Mail, FileText, Tag, Settings } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import peakLogo from '@/assets/peak-logo.svg';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

const navItems = [
  { title: 'In Review Tracker', url: '/', icon: Building2 },
  { title: 'Review Cycle Adjustments', url: '/review-cycle-adjustments', icon: Building2 },
  { title: 'Email Templates', url: '/email-templates', icon: Mail },
  { title: 'File Tagging', url: '/file-tagging', icon: FileText },
  { title: 'Email Tagging', url: '/email-tagging', icon: Tag },
  { title: 'Settings', url: '/settings', icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  return (
    <Sidebar collapsible="icon" className="bg-white border-r border-gray-200">
      <SidebarContent className="bg-white">
        <div className={`px-4 py-5 border-b border-gray-200 ${collapsed ? 'px-2' : ''}`}>
          {!collapsed ? (
            <div className="flex items-center gap-2">
              <img src={peakLogo} alt="Audit Review" className="h-5" />
              <span className="text-sm font-semibold tracking-tight text-gray-900">Audit Review</span>
            </div>
          ) : (
            <img src={peakLogo} alt="Audit Review" className="h-5 mx-auto" />
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-gray-500 uppercase tracking-wider px-4">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === '/'}
                      className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                      activeClassName="bg-blue-100 text-blue-700"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
