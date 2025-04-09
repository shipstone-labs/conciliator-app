import Image from "next/image";
import Link from "next/link";
import { Menu } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

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

      {/* Main menu items - simplified without Menubar */}
      <nav className="flex items-center space-x-6 flex-grow bg-transparent">
        <div className="px-3 py-2 text-sm font-medium text-white hover:text-primary/90 cursor-pointer transition-colors">
          What is SafeIdea?
        </div>
        <Link 
          href="/list-ip"
          className="px-3 py-2 text-sm font-medium text-white hover:text-primary/90 cursor-pointer transition-colors"
        >
          Explore Ideas
        </Link>
      </nav>

      {/* Account menu (hamburger) using DropdownMenu instead of MenubarMenu */}
      <div className="ml-4">
        <DropdownMenu>
          <DropdownMenuTrigger className="cursor-pointer h-10 w-10 flex items-center justify-center rounded-full hover:bg-muted/30">
            <Menu className="h-5 w-5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-background/95 backdrop-blur-sm border border-white/10 rounded-xl shadow-lg p-2 min-w-[180px]">
            <DropdownMenuItem className="px-3 py-2 hover:bg-white/10 rounded-lg cursor-pointer">
              Account
            </DropdownMenuItem>
            <DropdownMenuItem className="px-3 py-2 hover:bg-white/10 rounded-lg cursor-pointer">
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
