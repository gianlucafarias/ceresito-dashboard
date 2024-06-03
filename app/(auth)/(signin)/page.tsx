import { Metadata } from "next";
import Link from "next/link";
import UserAuthForm from "@/components/forms/user-auth-form";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Image from "next/image";
export const metadata: Metadata = {
  title: "Ingresar",
  description: "Authentication forms built using the components.",
};

export default function AuthenticationPage() {
  return (
    <div className="relative h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <Link
        href="/examples/authentication"
        className={cn(
          buttonVariants({ variant: "ghost" }),
          "absolute right-4 hidden top-4 md:right-8 md:top-8"
        )}
      >
        Ingresar
      </Link>
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
        <div className="relative z-20 flex items-center text-lg font-medium">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 100 100"
            fill='currentColor'
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2 h-9 w-9"
          >
            <path d="m66.94 64.3c-3.98 4.73-9.94 7.73-16.6 7.73-11.98 0-21.68-9.71-21.68-21.68s9.71-21.68 21.68-21.68c6.64 0 12.57 2.8 16.55 7.49h11.28c-5.17-10.12-15.69-17.04-27.83-17.04-17.25 0-31.23 13.98-31.23 31.23s13.98 31.23 31.23 31.23c12.23 0 22.83-7.03 27.95-17.28h-11.35z"/>
            <path d="M56.2,54.77c-1.34,1.77-3.47,2.92-5.86,2.92-4.06,0-7.34-3.29-7.34-7.34s3.29-7.34,7.34-7.34c2.11,0,4.01,.89,5.35,2.31h7.36c-2-5.06-6.94-8.63-12.71-8.63-7.55,0-13.67,6.12-13.67,13.67s6.12,13.67,13.67,13.67c6,0,11.09-3.86,12.93-9.24h-7.07Z"/>
            <path d="M100.44,45.31h-28.88c.55,3.15,.61,6.31,0,9.46h18.9c-2.2,20.2-19.32,35.93-40.11,35.93-22.28,0-40.35-18.07-40.35-40.35S28.06,10,50.34,10c17.38,0,32.2,10.99,37.87,26.4h10.51C92.69,15.38,73.31,0,50.34,0,22.54,0,0,22.54,0,50.34s22.54,50.35,50.34,50.35,50.34-22.54,50.34-50.35c0-1.7-.08-3.38-.25-5.04h0Z"/>    
            </svg>
          Gobierno de la Ciudad de Ceres
        </div>
        <div className="absolute left-0 top-0 h-full w-full">
          <Image
            src="/backceres.jpg"
            alt="Image"
            fill
            style={{
              objectFit: 'cover',
            }}
          />
        </div>
      </div>
      <div className="p-4 lg:p-8 h-full flex items-center">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Ingresar al Panel
            </h1>
            <p className="text-sm text-muted-foreground">
              Ingresa con tu correo para acceder al panel de control.
            </p>
          </div>
          <UserAuthForm />
          
         
        </div>
      </div>
    </div>
  );
}