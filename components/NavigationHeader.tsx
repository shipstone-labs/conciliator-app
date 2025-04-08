import {
  Menubar,
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
        <Link href="/">
          <MenubarMenu>
            <MenubarTrigger>What is SafeIdea?</MenubarTrigger>
          </MenubarMenu>
        </Link>
        <Link href="/list-ip">
          <MenubarMenu>
            <MenubarTrigger>Explore Ideas</MenubarTrigger>
          </MenubarMenu>
        </Link>
      </Menubar>
      
      {/* Spacer for the right side to maintain balanced layout */}
      <div className="ml-4 w-[150px]"></div>
    </div>
  );
}
