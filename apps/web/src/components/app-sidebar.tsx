import * as React from "react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@campaign-lens/ui/components/sidebar";
import { Button } from "@campaign-lens/ui/components/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  EyeIcon,
  LayoutDashboardIcon,
  Target02Icon,
  Activity01Icon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation();
  const currentPath = location.pathname;

  const isOverview = currentPath === "/";
  const isCompetitors =
    currentPath.startsWith("/competitors") &&
    currentPath !== "/competitors/new";
  const isActivity = currentPath === "/activity";

  return (
    <Sidebar variant="floating" {...props}>
      <SidebarHeader className="p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link to="/" />}>
              <div className="flex aspect-square size-8 items-center justify-center bg-primary text-primary-foreground">
                <HugeiconsIcon
                  icon={EyeIcon}
                  strokeWidth={2}
                  className="size-4"
                />
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

      <SidebarContent className="px-2 py-2 flex flex-col justify-between">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={isOverview}
                  render={<Link to="/" />}
                >
                  <HugeiconsIcon
                    icon={LayoutDashboardIcon}
                    strokeWidth={2}
                    className="size-4"
                  />
                  <span>Overview</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={isCompetitors}
                  render={<Link to="/competitors" />}
                >
                  <HugeiconsIcon
                    icon={Target02Icon}
                    strokeWidth={2}
                    className="size-4"
                  />
                  <span>Competitors</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={isActivity}
                  render={<Link to="/activity" />}
                >
                  <HugeiconsIcon
                    icon={Activity01Icon}
                    strokeWidth={2}
                    className="size-4"
                  />
                  <span>Activity</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="px-2 py-3">
          <Button
            size="sm"
            className="w-full justify-center gap-1.5 text-xs h-9 cursor-pointer"
            render={<Link to="/competitors/new" />}
          >
            <HugeiconsIcon
              icon={PlusSignIcon}
              strokeWidth={2}
              className="size-3.5"
            />
            <span>Track competitor</span>
          </Button>
        </div>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-sidebar-border">
        <div className="flex items-center justify-between p-2 text-xs bg-sidebar-accent/50">
          <div className="flex items-center gap-2">
            <span
              className="size-2 rounded-full bg-emerald-500 motion-safe:animate-pulse"
              aria-hidden="true"
            />
            <span className="text-muted-foreground text-xs font-medium">
              Live monitoring
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
