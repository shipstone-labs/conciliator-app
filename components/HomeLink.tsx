import Image from 'next/image'
import Link from 'next/link'

export default function HomeLink() {
  return (
    <span className="fixed top-6 left-6 w-12">
      <Link
        href="/"
        className="bg-muted w-12 h-12 flex items-center justify-center rounded-full shadow-xl hover:bg-muted/80 transition-all z-50 overflow-hidden border border-white/10"
      >
        <Image
          src="/svg/Black+Yellow.svg"
          alt="Home"
          width={26}
          height={26}
          className="transform scale-125"
        />
      </Link>
    </span>
  )
}
