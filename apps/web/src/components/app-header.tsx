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
  const isNewCompetitor = currentPath === "/competitors/new";
  const isCompetitorDetail =
    currentPath.startsWith("/competitors/") && !isNewCompetitor;
  const isCompetitorsList = currentPath === "/competitors";

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/80 px-3 sm:px-4 backdrop-blur-md">
      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 mr-2">
        <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground shrink-0" />
        <Separator orientation="vertical" className="mr-1 sm:mr-2 h-4 shrink-0" />
        <Breadcrumb className="min-w-0 overflow-hidden">
          <BreadcrumbList className="flex-nowrap whitespace-nowrap overflow-hidden text-ellipsis">
            <BreadcrumbItem className="shrink-0 hidden xs:inline-flex">
              <BreadcrumbLink render={<Link to="/" />}>
                CampaignLens
              </BreadcrumbLink>
            </BreadcrumbItem>

            {isOverview && (
              <>
                <BreadcrumbSeparator className="hidden xs:inline-flex shrink-0" />
                <BreadcrumbItem className="min-w-0 truncate">
                  <BreadcrumbPage className="truncate">Overview</BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}

            {isCompetitorsList && (
              <>
                <BreadcrumbSeparator className="hidden xs:inline-flex shrink-0" />
                <BreadcrumbItem className="min-w-0 truncate">
                  <BreadcrumbPage className="truncate">Competitors</BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}

            {isCompetitorDetail && (
              <>
                <BreadcrumbSeparator className="hidden sm:inline-flex shrink-0" />
                <BreadcrumbItem className="hidden sm:inline-flex shrink-0">
                  <BreadcrumbLink render={<Link to="/competitors" />}>
                    Competitors
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="shrink-0" />
                <BreadcrumbItem className="min-w-0 truncate">
                  <BreadcrumbPage className="truncate">Competitor details</BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}

            {isNewCompetitor && (
              <>
                <BreadcrumbSeparator className="hidden sm:inline-flex shrink-0" />
                <BreadcrumbItem className="hidden sm:inline-flex shrink-0">
                  <BreadcrumbLink render={<Link to="/competitors" />}>
                    Competitors
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="shrink-0" />
                <BreadcrumbItem className="min-w-0 truncate">
                  <BreadcrumbPage className="truncate">Track competitor</BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground shrink-0">
        <span
          className="size-1.5 rounded-full bg-emerald-500 motion-safe:animate-pulse"
          aria-hidden="true"
        />
        <span className="hidden sm:inline">Monitoring active</span>
      </div>
    </header>
  );
}
