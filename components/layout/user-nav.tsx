"use client";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut, useSession } from "next-auth/react";
import {
  LogOutIcon,
  UserCircleIcon,
  CreditCardIcon,
  BellIcon,
  MoreVerticalIcon
} from "lucide-react";

export function UserNav() {
  const { data: session } = useSession();

  const userName = session?.user?.username ?? "Usuario";
  const userEmail = session?.user?.email ?? "Usuario";
  const userImage = session?.user?.image ?? "";
  const userInitial = (userName?.[0] ?? userEmail[0]).toUpperCase();

  if (session) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-auto px-2 flex items-center gap-2 rounded-full">
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarImage src={userImage} alt={userName ?? userEmail} />
              <AvatarFallback className="rounded-lg">{userInitial}</AvatarFallback>
            </Avatar>
            <div className="hidden lg:grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{userName ?? userEmail}</span>
              {userName && <span className="truncate text-xs text-muted-foreground">{userEmail}</span>}
            </div>
            <MoreVerticalIcon className="ml-auto size-4 hidden lg:block" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 rounded-lg" align="end" forceMount>
          <DropdownMenuLabel className="font-normal p-0">
             <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={userImage} alt={userName ?? userEmail} />
                  <AvatarFallback className="rounded-lg">{userInitial}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{userName ?? userEmail}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {userEmail}
                  </span>
                </div>
              </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem>
              <UserCircleIcon className="mr-2 h-4 w-4" />
              Cuenta
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => signOut()}>
            <LogOutIcon className="mr-2 h-4 w-4" />
            Cerrar Sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
  return null;
}
