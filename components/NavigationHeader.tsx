import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from "@/components/ui/menubar";
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
          <MenubarTrigger>Explore Ideas</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Browse Categories</MenubarItem>
            <MenubarItem>Search</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
      
      {/* Right-aligned menu */}
      <Menubar className="border-none bg-transparent">
        <MenubarMenu>
          <MenubarTrigger>Sign In / Register</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Sign In</MenubarItem>
            <MenubarItem>Create Account</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </div>
  );
}
