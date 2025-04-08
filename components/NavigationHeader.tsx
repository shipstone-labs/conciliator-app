import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "@/components/ui/menubar";
import Image from "next/image";
import Link from "next/link";
import { AuthButton } from "./AuthButton";

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
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>
              New <MenubarShortcut>⌘N</MenubarShortcut>
            </MenubarItem>
            <MenubarItem>Open</MenubarItem>
            <MenubarSeparator />
            <MenubarItem>Save</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger>Edit</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>
              Undo <MenubarShortcut>⌘Z</MenubarShortcut>
            </MenubarItem>
            <MenubarItem>
              Redo <MenubarShortcut>⇧⌘Z</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem>Cut</MenubarItem>
            <MenubarItem>Copy</MenubarItem>
            <MenubarItem>Paste</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
      
      {/* Right-aligned Sign In button */}
      <div className="ml-4">
        <AuthButton 
          text="Sign In / Register" 
          className="bg-primary hover:bg-primary/80 text-black font-medium rounded-md shadow-md" 
        />
      </div>
    </div>
  );
}
