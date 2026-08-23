import * as React from "react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@campaign-lens/ui/components/sidebar";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  EyeIcon,
  LayoutDashboardIcon,
  Target02Icon,
  Store01Icon,
  Activity01Icon,
} from "@hugeicons/core-free-icons";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation();
  const currentPath = location.pathname;

  const isOverview = currentPath === "/";
  const isCompetitors = currentPath.startsWith("/competitors");
  const isLumora = currentPath === "/competitors/7ad87193-6102-4dc0-85b4-3b8eda214264";
  const isActivity = currentPath === "/activity";

  return (
    <Sidebar variant="floating" {...props}>
      <SidebarHeader className="p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link to="/" />}>
              <div className="flex aspect-square size-8 items-center justify-center bg-primary text-primary-foreground">
                <HugeiconsIcon icon={EyeIcon} strokeWidth={2} className="size-4" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-semibold tracking-tight text-sm text-foreground">
                  Campaign<span className="text-primary font-bold">Lens</span>
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Competitive Intelligence
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="px-2 py-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs text-muted-foreground font-medium">
            Platform
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={isOverview}
                  render={<Link to="/" />}
                >
                  <HugeiconsIcon icon={LayoutDashboardIcon} strokeWidth={2} className="size-4" />
                  <span>Overview</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={isCompetitors && !isLumora}
                  render={<Link to="/competitors" />}
                >
                  <HugeiconsIcon icon={Target02Icon} strokeWidth={2} className="size-4" />
                  <span>Competitors</span>
                </SidebarMenuButton>
                <SidebarMenuBadge>1</SidebarMenuBadge>

                {isCompetitors && (
                  <SidebarMenuSub className="ml-4 border-l border-sidebar-border px-2 py-1">
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={isLumora}
                        render={<Link to="/competitors/7ad87193-6102-4dc0-85b4-3b8eda214264" />}
                      >
                        <HugeiconsIcon icon={Store01Icon} strokeWidth={2} className="size-3 text-primary" />
                        <span className="truncate">Lumora</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={isActivity}
                  render={<Link to="/activity" />}
                >
                  <HugeiconsIcon icon={Activity01Icon} strokeWidth={2} className="size-4" />
                  <span>Activity</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-sidebar-border">
        <div className="flex items-center justify-between p-2.5 text-xs bg-sidebar-accent/50">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-muted-foreground text-xs">
              Engine online
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground font-mono">
            v1.0
          </span>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
