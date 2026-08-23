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
  SidebarSeparator,
} from "@campaign-lens/ui/components/sidebar";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  EyeIcon,
  LayoutDashboardIcon,
  Target02Icon,
  Activity01Icon,
  Layers01Icon,
  SparklesIcon,
  Store01Icon,
  CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation();
  const currentPath = location.pathname;

  const isOverview = currentPath === "/";
  const isCompetitorActive = currentPath.startsWith("/competitors");

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader className="p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link to="/" />}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <HugeiconsIcon icon={EyeIcon} strokeWidth={2} className="size-4" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-semibold tracking-tight text-sm text-foreground">
                  Campaign<span className="text-primary font-bold">Lens</span>
                </span>
                <span className="text-[11px] text-muted-foreground font-mono">
                  Competitive Intelligence
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent className="px-2 py-2">
        {/* Core Monitoring Group */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground">
            Monitoring
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={isOverview}
                  render={<Link to="/" />}
                >
                  <HugeiconsIcon icon={LayoutDashboardIcon} strokeWidth={2} className="size-4" />
                  <span className="font-medium">Overview</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={isCompetitorActive}
                  render={<Link to="/competitors/7ad87193-6102-4dc0-85b4-3b8eda214264" />}
                >
                  <HugeiconsIcon icon={Target02Icon} strokeWidth={2} className="size-4" />
                  <span className="font-medium">Competitors</span>
                </SidebarMenuButton>

                {isCompetitorActive && (
                  <SidebarMenuSub className="ml-4 border-l border-sidebar-border px-2 py-1">
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={true}
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
                  isActive={isCompetitorActive}
                  render={<Link to="/competitors/7ad87193-6102-4dc0-85b4-3b8eda214264" />}
                >
                  <HugeiconsIcon icon={Activity01Icon} strokeWidth={2} className="size-4" />
                  <span className="font-medium">Change Activity</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Intelligence Pipeline */}
        <SidebarGroup className="mt-2">
          <SidebarGroupLabel className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground">
            Pipeline & Studio
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<Link to="/competitors/7ad87193-6102-4dc0-85b4-3b8eda214264" />}
                >
                  <HugeiconsIcon icon={Layers01Icon} strokeWidth={2} className="size-4" />
                  <span className="font-medium">Tracked Sources</span>
                </SidebarMenuButton>
                <SidebarMenuBadge>1 Active</SidebarMenuBadge>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<Link to="/competitors/7ad87193-6102-4dc0-85b4-3b8eda214264" />}
                >
                  <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} className="size-4 text-amber-500" />
                  <span className="font-medium">Scraper Studio</span>
                </SidebarMenuButton>
                <SidebarMenuBadge className="text-[10px] text-primary">Live</SidebarMenuBadge>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-sidebar-border">
        <div className="flex items-center justify-between rounded-lg bg-sidebar-accent/50 p-2.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono text-muted-foreground">Engine Online</span>
          </div>
          <span className="font-mono text-[10px] text-muted-foreground">v1.0.0</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
