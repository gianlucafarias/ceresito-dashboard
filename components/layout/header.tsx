import ThemeToggle from "@/components/layout/ThemeToggle/theme-toggle";
import { cn } from "@/lib/utils";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { UserNav } from "./user-nav";
import Link from "next/link";

export default function Header() {
  return (
    <div className="bg-background rounded-t-lg">
      <nav className="h-14 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <main>
          <SidebarTrigger className="-ml-1" />
          </main>
          <Separator
              orientation="vertical"
              className="mx-1 h-6 hidden lg:block"
          />

         

          <div className="hidden lg:block ml-2">
            <Link
              href={"/dashboard"}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 100 100"
                fill='currentColor'
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-8 w-8"
              >
                <path d="m66.94 64.3c-3.98 4.73-9.94 7.73-16.6 7.73-11.98 0-21.68-9.71-21.68-21.68s9.71-21.68 21.68-21.68c6.64 0 12.57 2.8 16.55 7.49h11.28c-5.17-10.12-15.69-17.04-27.83-17.04-17.25 0-31.23 13.98-31.23 31.23s13.98 31.23 31.23 31.23c12.23 0 22.83-7.03 27.95-17.28h-11.35z"/>
                <path d="M56.2,54.77c-1.34,1.77-3.47,2.92-5.86,2.92-4.06,0-7.34-3.29-7.34-7.34s3.29-7.34,7.34-7.34c2.11,0,4.01,.89,5.35,2.31h7.36c-2-5.06-6.94-8.63-12.71-8.63-7.55,0-13.67,6.12-13.67,13.67s6.12,13.67,13.67,13.67c6,0,11.09-3.86,12.93-9.24h-7.07Z"/>
                <path d="M100.44,45.31h-28.88c.55,3.15,.61,6.31,0,9.46h18.9c-2.2,20.2-19.32,35.93-40.11,35.93-22.28,0-40.35-18.07-40.35-40.35S28.06,10,50.34,10c17.38,0,32.2,10.99,37.87,26.4h10.51C92.69,15.38,73.31,0,50.34,0,22.54,0,0,22.54,0,50.34s22.54,50.35,50.34,50.35,50.34-22.54,50.34-50.35c0-1.7-.08-3.38-.25-5.04h0Z"/>    
              </svg>
            </Link>
          </div>
          <div className="hidden lg:block">
            <span className="text-base font-semibold">Gobierno de la Ciudad de Ceres</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <UserNav />
          <ThemeToggle />
        </div>
      </nav>
      <Separator />
    </div>
  );
}
