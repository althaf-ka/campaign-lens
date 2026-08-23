import { Link, useLocation } from "@tanstack/react-router";
import { SidebarTrigger } from "@campaign-lens/ui/components/sidebar";
import { Separator } from "@campaign-lens/ui/components/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@campaign-lens/ui/components/breadcrumb";

export function AppHeader() {
  const location = useLocation();
  const currentPath = location.pathname;

  const isOverview = currentPath === "/";
  const isCompetitorDetail = currentPath.startsWith("/competitors/") && currentPath !== "/competitors";
  const isCompetitorsList = currentPath === "/competitors";

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to="/" />}>
                CampaignLens
              </BreadcrumbLink>
            </BreadcrumbItem>

            {isOverview && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Overview</BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}

            {isCompetitorsList && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Competitors</BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}

            {isCompetitorDetail && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink render={<Link to="/competitors" />}>
                    Competitors
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Lumora</BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
        <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span>Live</span>
      </div>
    </header>
  );
}
