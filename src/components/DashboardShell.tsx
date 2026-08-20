"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import ChangePasswordModal from "./ChangePasswordModal";

// Lucide Icons (SVGs)
const Icons = {
  Dashboard: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>,
  Buyers: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>,
  Suppliers: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"></path><path d="M17 18h1"></path><path d="M12 18h1"></path><path d="M7 18h1"></path></svg>,
  Search: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>,
  Calculator: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"></rect><line x1="8" y1="6" x2="16" y2="6"></line><line x1="16" y1="14" x2="16" y2="14.01"></line><line x1="12" y1="14" x2="12" y2="14.01"></line><line x1="8" y1="14" x2="8" y2="14.01"></line><line x1="16" y1="10" x2="16" y2="10.01"></line><line x1="12" y1="10" x2="12" y2="10.01"></line><line x1="8" y1="10" x2="8" y2="10.01"></line><line x1="16" y1="18" x2="16" y2="18.01"></line><line x1="12" y1="18" x2="12" y2="18.01"></line><line x1="8" y1="18" x2="8" y2="18.01"></line></svg>,
  Inbox: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path></svg>,
  Users: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="19" y1="8" x2="19" y2="14"></line><line x1="22" y1="11" x2="16" y2="11"></line></svg>,
  CreditCard: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>,
  Upload: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>,
  Bell: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>,
  Settings: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>,
  LogOut: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>,
  User: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>,
  ChevronLeft: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>,
  ChevronRight: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>,
  Menu: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>,
  FileText: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>,
};

type NavGroup = {
  title: string;
  items: { href: string; label: string; icon: keyof typeof Icons }[];
};

export default function DashboardShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: { name: string; role: "admin" | "user"; planType?: string; expiresAt?: string; batch?: string };
}) {
  const pathname = usePathname();
  const router = useRouter();
  
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [alertsCount, setAlertsCount] = useState(0);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Initialize collapse state from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("pp_sidebar_collapsed");
    if (stored) {
      setTimeout(() => setIsCollapsed(stored === "true"), 0);
    }
  }, []);

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("pp_sidebar_collapsed", String(newState));
  };

  useEffect(() => {
    if (user.role === "admin") {
      fetch("/api/admin/subscriptions/alerts")
        .then(res => res.json())
        .then(data => {
          if (data.alerts) setAlertsCount(data.alerts.length);
        })
        .catch(console.error);
    }
  }, [user.role]);

  // Click outside for dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  // Define Navigation based on role
  const navigation: NavGroup[] = [
    {
      title: "MAIN",
      items: [
        { href: "/dashboard", label: "Dashboard", icon: "Dashboard" },
      ],
    },
    {
      title: "TRADE INTELLIGENCE",
      items: [
        { href: "/dashboard/find-buyer", label: "Find Buyers", icon: "Buyers" },
        { href: "/dashboard/find-supplier", label: "Find Suppliers", icon: "Suppliers" },
        { href: "/dashboard/hs-code-search", label: "HS Codes", icon: "Search" },
        { href: "/dashboard/calculators", label: "Calculators", icon: "Calculator" },
        { href: "/dashboard/document-builder", label: "Document Builder", icon: "FileText" },
      ],
    },
  ];

  if (user.role === "admin") {
    navigation.push({
      title: "MANAGEMENT",
      items: [
        { href: "/dashboard/inquiries", label: "Inquiries", icon: "Inbox" },
        { href: "/dashboard/admin/users", label: "Users", icon: "Users" },
        { href: "/dashboard/admin/subscriptions", label: "Subscriptions", icon: "CreditCard" },
        { href: "/dashboard/admin/statements", label: "Bank Statements", icon: "FileText" },
        { href: "/dashboard/admin/invoices", label: "Invoice Generator", icon: "Calculator" },
        { href: "/dashboard/admin/invoices/records", label: "Invoice Records", icon: "FileText" },
      ],
    });
    navigation.push({
      title: "DATA",
      items: [
        { href: "/dashboard/admin/data-upload", label: "Upload Data", icon: "Upload" },
      ],
    });
  } else {
    navigation[1].items.push({
      href: "/dashboard/inquiries", 
      label: "Inquiries", 
      icon: "Inbox" 
    });
  }

  return (
    <div className="flex h-full w-full bg-[#F7F9FC] text-[#17233D] overflow-hidden font-sans">
      
      {/* 
        -----------------------------------------
        LEFT SIDEBAR (Desktop) 
        -----------------------------------------
      */}
      <aside 
        className={`hidden md:flex flex-col bg-white border-r border-[#E5E7EB] transition-all duration-300 ease-in-out z-20 print:hidden ${isCollapsed ? "w-[76px]" : "w-[260px]"}`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-[60px] px-4 border-b border-[#E5E7EB]">
          <Link href="/dashboard" className={`flex items-center gap-2 overflow-hidden whitespace-nowrap transition-opacity ${isCollapsed ? "w-8" : "w-auto"}`}>
            <Logo />
          </Link>
          <button 
            onClick={toggleSidebar} 
            className="p-1.5 text-[#64748B] hover:bg-gray-100 rounded-md transition-colors"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <Icons.ChevronRight /> : <Icons.ChevronLeft />}
          </button>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-8 scrollbar-thin">
          {navigation.map((group) => (
            <div key={group.title}>
              {!isCollapsed && (
                <h4 className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                  {group.title}
                </h4>
              )}
              {isCollapsed && <div className="h-4" />} {/* Spacer for collapsed groups */}
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const active = pathname === item.href;
                  const Icon = Icons[item.icon];
                  return (
                    <li key={item.href}>
                      <Link 
                        href={item.href}
                        title={isCollapsed ? item.label : undefined}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                          active 
                            ? "bg-[#F97316]/10 text-[#F97316] font-semibold" 
                            : "text-[#64748B] hover:bg-gray-50 hover:text-[#17233D] font-medium"
                        }`}
                      >
                        <div className="shrink-0"><Icon /></div>
                        {!isCollapsed && <span className="text-[14px]">{item.label}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

        </nav>
      </aside>

      {/* 
        -----------------------------------------
        MOBILE DRAWER
        -----------------------------------------
      */}
      <div className={`md:hidden fixed inset-0 z-50 transition-opacity duration-300 ${isMobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
        <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setIsMobileOpen(false)} />
        <div className={`absolute inset-y-0 left-0 w-[260px] bg-white shadow-xl flex flex-col transform transition-transform duration-300 ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="flex items-center justify-between h-[60px] px-4 border-b border-[#E5E7EB]">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Logo />
            </Link>
          </div>
          <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-6">
            {navigation.map((group) => (
              <div key={group.title}>
                <h4 className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-[#64748B]">{group.title}</h4>
                <ul className="space-y-1">
                  {group.items.map((item) => {
                    const active = pathname === item.href;
                    const Icon = Icons[item.icon];
                    return (
                      <li key={item.href}>
                        <Link 
                          href={item.href}
                          onClick={() => setIsMobileOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${active ? "bg-[#F97316]/10 text-[#F97316] font-semibold" : "text-[#64748B] hover:bg-gray-50 text-[#17233D] font-medium"}`}
                        >
                          <Icon /> <span className="text-[14px]">{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      </div>

      {/* 
        -----------------------------------------
        MAIN CONTENT AREA
        -----------------------------------------
      */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        {/* Top Bar */}
        <header className="h-[60px] bg-white border-b border-[#E5E7EB] flex items-center justify-between px-4 sm:px-6 z-40 shrink-0 relative print:hidden">
          
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden p-1 text-[#64748B] hover:text-[#17233D]"
              onClick={() => setIsMobileOpen(true)}
            >
              <Icons.Menu />
            </button>
          </div>

          <div className="flex items-center gap-4">
            
            {/* Notifications Bell */}
            <div className="relative" ref={notificationsRef}>
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} 
                className="relative text-[#64748B] hover:text-[#17233D] transition-colors p-1"
              >
                <Icons.Bell />
                {alertsCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                )}
              </button>

              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-[#E5E7EB] rounded-xl shadow-lg py-2 z-50">
                  <div className="px-4 pb-2 border-b border-[#E5E7EB] flex items-center justify-between">
                    <span className="text-[14px] font-semibold text-[#17233D]">Notifications</span>
                    {alertsCount > 0 && (
                      <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-[10px] font-bold">{alertsCount} New</span>
                    )}
                  </div>
                  <div className="p-4 flex flex-col items-center justify-center text-center">
                    {alertsCount > 0 ? (
                      <p className="text-[13px] text-[#64748B] mb-3">You have {alertsCount} new alerts.</p>
                    ) : (
                      <p className="text-[13px] text-[#64748B] mb-3">You have no new notifications.</p>
                    )}
                    <Link 
                      href="/dashboard/admin/subscriptions"
                      onClick={() => setIsNotificationsOpen(false)}
                      className="text-[#2563EB] hover:text-[#1D4ED8] text-[13px] font-semibold"
                    >
                      View All Alerts &rarr;
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Menu */}
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <div className="flex flex-col text-right hidden sm:flex">
                  <span className="text-[13px] font-semibold text-[#17233D] leading-tight">{user.name}</span>
                  <span className="text-[11px] text-[#64748B] font-medium flex items-center justify-end gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Online
                  </span>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-[13px] font-bold shadow-sm">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <svg className="w-4 h-4 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-[#E5E7EB] rounded-xl shadow-lg py-1 z-50">
                  <div className="px-4 py-3 border-b border-[#E5E7EB] bg-gray-50/50 rounded-t-xl">
                    <p className="text-[14px] font-semibold text-[#17233D] truncate">{user.name}</p>
                    <p className="text-[12px] font-medium text-[#64748B] mt-0.5">
                      {user.role === 'admin' ? 'Administrator' : `${user.planType?.toUpperCase()} Plan`}
                    </p>
                  </div>
                  <div className="py-1">
                    <button onClick={() => { setIsDropdownOpen(false); setPasswordModalOpen(true); }} className="w-full flex items-center px-4 py-2 text-[13px] font-medium text-[#64748B] hover:bg-gray-50 hover:text-[#17233D]">
                      Account Settings
                    </button>
                    <button onClick={() => { setIsDropdownOpen(false); handleLogout(); }} className="w-full flex items-center px-4 py-2 text-[13px] font-medium text-rose-500 hover:bg-rose-50">
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

        </header>

        {/* Scrollable Dashboard Content */}
        <main className="flex-1 overflow-y-auto bg-[#F7F9FC] print:bg-white print:overflow-visible">
          <div className="p-4 sm:p-8 print:p-0">
            {children}
          </div>
        </main>
      </div>

      <ChangePasswordModal open={passwordModalOpen} onClose={() => setPasswordModalOpen(false)} />
    </div>
  );
}
