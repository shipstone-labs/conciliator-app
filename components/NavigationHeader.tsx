import { Menubar, MenubarMenu, MenubarTrigger, MenubarContent, MenubarItem } from "@/components/ui/menubar";
import { Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function NavigationHeader() {
  return (
    <div className="flex w-full items-center justify-between">
      {/* Logo on left */}
      <Link href="/" className="mr-4">
        <Image
          src="/svg/Black+Yellow.svg"
          alt="SafeIdea Logo"
          width={32}
          height={32}
          className="rounded-full"
        />
      </Link>

      {/* Main menu items */}
      <Menubar className="border-none bg-transparent flex-grow">
        <MenubarMenu>
          <MenubarTrigger>What is SafeIdea?</MenubarTrigger>
        </MenubarMenu>
        <MenubarMenu>
          <Link href="/list-ip">
            <MenubarTrigger>Explore Ideas</MenubarTrigger>
          </Link>
        </MenubarMenu>
      </Menubar>

      {/* Account menu (hamburger) */}
      <div className="ml-4">
        <MenubarMenu>
          <MenubarTrigger className="cursor-pointer h-10 w-10 flex items-center justify-center rounded-full hover:bg-muted/30">
            <Menu className="h-5 w-5" />
          </MenubarTrigger>
          <MenubarContent align="end" className="bg-background/95 backdrop-blur-sm border border-white/10 rounded-xl shadow-lg p-2 min-w-[180px]">
            <MenubarItem className="px-3 py-2 hover:bg-white/10 rounded-lg cursor-pointer">
              Account
            </MenubarItem>
            <MenubarItem className="px-3 py-2 hover:bg-white/10 rounded-lg cursor-pointer">
              Sign Out
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </div>
    </div>
  );
}
