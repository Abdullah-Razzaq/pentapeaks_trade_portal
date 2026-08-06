
type SidebarContext = "buyer" | "supplier" | "hs-code" | "tariff";

export default function MentorshipSidebar({ context }: { context: SidebarContext }) {
  let title = "Need Expert Guidance?";
  let copy = "Consult with Pentapeaks experts to execute your global trade deals with confidence.";

  if (context === "buyer") {
    title = "Closing Buyer Deals?";
    copy = "Learn exact frameworks for verifying global importers, structuring contracts, and ensuring safe payments.";
  } else if (context === "supplier") {
    title = "Sourcing Reliable Suppliers?";
    copy = "Master the art of factory vetting, quality control, and negotiating the best terms for import.";
  } else if (context === "hs-code") {
    title = "Stuck on Classification?";
    copy = "Incorrect HS Codes can lead to massive penalties. Get mentored on complex global trade compliance.";
  } else if (context === "tariff") {
    title = "Optimizing Duty Structures?";
    copy = "Discover legal frameworks and Free Trade Agreements to minimize your import/export landed costs.";
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col transition hover:shadow-md sticky top-24">
      {/* Dynamic Header Image / Pattern */}
      <div className="relative h-40 w-full bg-[#0a0d12] group overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-gray-900 to-gray-800 opacity-80"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1578575437130-527eed3abbec?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-30 mix-blend-overlay group-hover:scale-105 transition-transform duration-700"></div>
        <div className="absolute inset-0 flex flex-col p-6 justify-end">
          <div className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-md border border-white/20 uppercase tracking-widest w-max mb-2">
            Pentapeaks Mentorship
          </div>
          <h4 className="font-bold text-white tracking-wide text-lg drop-shadow-md leading-tight">{title}</h4>
        </div>
      </div>
      
      {/* Content Body */}
      <div className="p-6 bg-gradient-to-b from-gray-50 to-white flex-1 flex flex-col">
        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
          {copy}
        </p>

        <div className="flex flex-col gap-3 mt-auto">
          <a 
            href="https://pentapeaks.com/mentorship#enroll" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0a0d12] px-4 py-3 text-sm font-bold text-white transition hover:bg-gray-800 shadow-lg hover:shadow-xl group"
          >
            <span>Apply for Mentorship</span>
            <svg className="h-4 w-4 transition group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
          </a>
          
          <a 
            href="https://wa.me/923086222283" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-50 px-4 py-3 text-sm font-bold text-green-700 border border-green-200 transition hover:bg-green-100 shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            <span>Ask via WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
}
