import HsCodeExplorer from "@/components/HsCodeExplorer";

export default function HsCodeSearchPage() {
  return (
    <div className="flex flex-col mx-auto max-w-7xl min-h-[calc(100vh-200px)]">
      {/* Hero Banner */}
      <div className="bg-[#0a0d12] rounded-3xl p-8 sm:p-12 mb-8 relative overflow-hidden shadow-2xl border border-gray-800">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent"></div>
        <div className="relative z-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">HS Code Search</h1>
          <p className="text-gray-400 max-w-xl leading-relaxed">
            Search the harmonized system to accurately classify your products for international trade and customs compliance.
          </p>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="w-full">
        <HsCodeExplorer />
      </div>
    </div>
  );
}
