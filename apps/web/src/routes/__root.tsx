import { useState } from "react";
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  SidebarProvider,
  SidebarInset,
} from "@campaign-lens/ui/components/sidebar";
import { TooltipProvider } from "@campaign-lens/ui/components/tooltip";
import { AppSidebar } from "#components/app-sidebar";
import { AppHeader } from "#components/app-header";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        name: "theme-color",
        content: "#18181b",
      },
      {
        title: "CampaignLens",
      },
    ],
    links: [
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  component: RootComponent,
  shellComponent: RootDocument,
});

function RootComponent() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 10_000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider defaultOpen={true}>
          <a
            href="#main-content"
            className="sr-only fixed left-4 top-4 z-50 bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground focus:not-sr-only"
          >
            Skip to content
          </a>
          <AppSidebar />
          <SidebarInset className="flex flex-col min-h-screen bg-background">
            <AppHeader />
            <main
              id="main-content"
              className="flex-1 w-full max-w-7xl mx-auto p-3 sm:p-6 lg:p-8"
            >
              <Outlet />
            </main>
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className="dark bg-background text-foreground"
      style={{ colorScheme: "dark" }}
    >
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-background text-foreground font-sans antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  );
}
