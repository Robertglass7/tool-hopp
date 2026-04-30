import React, { useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  Home, Search, Wrench, Calendar, MessageSquare, User, Menu, X,
  Sparkles, Truck, Shield, ArrowLeft, LayoutDashboard
} from "lucide-react";

// Preserve scroll positions per bottom-tab page
const scrollPositions = {};

const bottomNavItems = [
  { title: "Browse", url: "Browse", icon: Search },
  { title: "My Tools", url: "MyTools", icon: Wrench },
  { title: "Bookings", url: "Bookings", icon: Calendar },
  { title: "Messages", url: "Messages", icon: MessageSquare },
  { title: "Profile", url: "Profile", icon: User },
];

const sidebarItems = [
  { title: "Browse Tools", url: "Browse", icon: Search },
  { title: "My Tools", url: "MyTools", icon: Wrench },
  { title: "Hopper Service", url: "HopperSubscription", icon: Truck },
  { title: "Bookings", url: "Bookings", icon: Calendar },
  { title: "Messages", url: "Messages", icon: MessageSquare },
  { title: "AI Assistant", url: "AIAssistant", icon: Sparkles },
  { title: "Hopper Dashboard", url: "HopperDashboard", icon: LayoutDashboard },
  { title: "Renter Pass", url: "RenterPass", icon: Shield },
  { title: "How It Works", url: "HowItWorks", icon: Home },
  { title: "Profile", url: "Profile", icon: User },
];

const adminItems = [
  { title: "Admin Panel", url: "AdminDashboard", icon: Shield },
];

// Pages that are "child" pages and should show a back button
const childPages = ["ToolDetail", "AddTool", "BecomeHopper", "RenterPass", "HopperSubscription", "AIAssistant", "HowItWorks", "HopperDashboard", "AdminDashboard"];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const isChildPage = childPages.includes(currentPageName);
  const mainRef = useRef(null);
  const prevPage = useRef(currentPageName);

  // Save & restore scroll positions when switching bottom tabs
  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    // Save outgoing page scroll
    if (prevPage.current && prevPage.current !== currentPageName) {
      scrollPositions[prevPage.current] = el.scrollTop;
    }
    prevPage.current = currentPageName;
    // Restore incoming page scroll
    const saved = scrollPositions[currentPageName] ?? 0;
    requestAnimationFrame(() => { el.scrollTop = saved; });
  }, [currentPageName]);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  const fullSidebarItems = user?.role === 'admin' ? [...sidebarItems, ...adminItems] : sidebarItems;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900">
      <style>{`
        :root {
          --primary: 142 76% 36%;
          --primary-foreground: 0 0% 100%;
          --secondary: 142 40% 25%;
          --secondary-foreground: 0 0% 100%;
          --background: 142 45% 15%;
          --card: 142 35% 20%;
          --card-foreground: 0 0% 95%;
        }
      `}</style>

      {/* ── Mobile Header ── */}
      <header
        className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-green-950 border-b border-green-700 shadow-lg mobile-header"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="flex items-center justify-between px-4 py-3">
          {isChildPage ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="text-green-100 hover:bg-green-800 min-w-[44px] min-h-[44px]"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
          ) : (
            <Link to={createPageUrl("Browse")} className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <Wrench className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-orange-400 to-orange-300 bg-clip-text text-transparent">
                ToolHopp
              </span>
            </Link>
          )}

          {isChildPage ? (
            <span className="text-white font-semibold text-lg">{currentPageName?.replace(/([A-Z])/g, ' $1').trim()}</span>
          ) : (
            <span className="text-xl font-bold bg-gradient-to-r from-orange-400 to-orange-300 bg-clip-text text-transparent">
              ToolHopp
            </span>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-green-100 hover:bg-green-800 min-w-[44px] min-h-[44px]"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>

        {/* Slide-down extra menu */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-green-950 border-b border-green-700 shadow-lg">
            <nav className="p-4 space-y-2">
              {fullSidebarItems.map((item) => {
                const isActive = location.pathname === createPageUrl(item.url);
                return (
                  <Link
                    key={item.title}
                    to={createPageUrl(item.url)}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all min-h-[44px] ${
                      isActive
                        ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md"
                        : "hover:bg-green-800 text-green-100"
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.title}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden lg:block fixed left-0 top-0 bottom-0 w-72 bg-green-950 border-r border-green-700 shadow-xl">
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-green-700">
            <Link to={createPageUrl("Browse")} className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <Wrench className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-orange-300 bg-clip-text text-transparent">
                  ToolHopp
                </h1>
                <p className="text-xs text-green-300">Rent. Share. Save.</p>
              </div>
            </Link>
          </div>

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {fullSidebarItems.map((item) => {
              const isActive = location.pathname === createPageUrl(item.url);
              return (
                <Link
                  key={item.title}
                  to={createPageUrl(item.url)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md"
                      : "hover:bg-green-800 text-green-100"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.title}</span>
                </Link>
              );
            })}
          </nav>

          {user && (
            <div className="p-4 border-t border-green-700">
              <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-green-900">
                {user.profile_photo ? (
                  <img src={user.profile_photo} alt={user.full_name} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center text-white font-semibold">
                    {user.full_name?.[0] || user.email[0].toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-green-100 text-sm truncate">{user.full_name || "User"}</p>
                  <p className="text-xs text-green-400 truncate">{user.email}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ── Main Content with route transition ── */}
      <main
        ref={mainRef}
        className="lg:ml-72 pt-16 lg:pt-0 min-h-screen mobile-content lg:pb-0 overflow-y-auto"
        style={{ height: "100dvh" }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.18, ease: "easeInOut" }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ── Mobile Bottom Navigation Bar ── */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-green-950 border-t border-green-700 flex"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {bottomNavItems.map((item) => {
          const isActive = location.pathname === createPageUrl(item.url);
          return (
            <Link
              key={item.url}
              to={createPageUrl(item.url)}
              className={`flex-1 flex flex-col items-center justify-center py-2 min-h-[56px] transition-colors ${
                isActive ? "text-orange-400" : "text-green-400"
              }`}
            >
              <item.icon className={`w-6 h-6 ${isActive ? "text-orange-400" : "text-green-400"}`} />
              <span className={`text-[10px] mt-1 font-medium ${isActive ? "text-orange-400" : "text-green-400"}`}>
                {item.title}
              </span>
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-orange-400 rounded-full" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}