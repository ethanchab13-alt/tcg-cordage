import Image from 'next/image'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#006341] px-4 py-12">
      {/* Logo TCG */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <Image
          src="/icons/tcg-logo.png"
          alt="Tennis Club La Garde"
          width={80}
          height={80}
          className="rounded-full bg-white p-1"
          priority
        />
        <span className="text-white text-sm font-medium tracking-wide uppercase opacity-80">
          Tennis Club La Garde
        </span>
      </div>

      {/* Carte centrale */}
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl p-8">
        {children}
      </div>

      <p className="mt-6 text-white/50 text-xs">
        © {new Date().getFullYear()} Tennis Club La Garde
      </p>
    </div>
  )
}
