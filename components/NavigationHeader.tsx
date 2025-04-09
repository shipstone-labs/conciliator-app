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

      {/* Main menu items - simplified without Menubar */}
      <nav className="flex items-center space-x-6 flex-grow">
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

      {/* Spacer for the right side to maintain balanced layout */}
      <div className="ml-4 w-[150px]" />
    </div>
  );
}
