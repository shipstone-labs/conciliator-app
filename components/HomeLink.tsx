import Image from "next/image";
import Link from "next/link";
import LogoffButton from "./LogoffButton";

export default function HomeLink() {
  return (
    <span className="fixed top-6 left-6 w-12">
      <Link
        href="/"
        className=" bg-primary/80 backdrop-blur-lg text-black w-12 h-12 flex items-center justify-center rounded-full shadow-lg hover:bg-primary transition-all hover:scale-110 border border-white/20"
      >
        🏠
      </Link>
      <LogoffButton className="bg-primary/80 backdrop-blur-lg text-black w-12 h-12 flex items-center justify-center rounded-full shadow-lg hover:bg-primary transition-all hover:scale-110 border border-white/20 p-2">
        <Image src="/svg/logout.svg" alt="Logout" width={24} height={24} />
      </LogoffButton>
    </span>
  );
}
