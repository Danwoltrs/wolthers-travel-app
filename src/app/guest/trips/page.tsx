export default function GuestTripsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pearl-50 via-amber-50/30 to-emerald-50/20 dark:from-[#212121] dark:via-[#1a1a1a] dark:to-[#0E3D2F]/10 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/80 dark:bg-[#0E3D2F]/80 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-emerald-200/30 dark:border-emerald-800/40">
          <h1 className="text-3xl font-bold text-latte-800 dark:text-green-50 mb-6">
            Guest Trip Access
          </h1>
          <p className="text-pearl-600 dark:text-pearl-300">
            Welcome to the guest trip access page. Here you can view trip details using your access code.
          </p>
        </div>
      </div>
    </div>
  )
}