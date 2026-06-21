"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CreditCard,
  Receipt,
  Bot,
  User,
  LogOut,
  AlertTriangle,
} from "lucide-react";
import { signOut } from "next-auth/react";

const navItems = [
  { href: "/dashboard", label: "Vue d'ensemble", icon: LayoutDashboard, testid: "nav-overview" },
  { href: "/dashboard/subscription", label: "Abonnement", icon: CreditCard, testid: "nav-subscription" },
  { href: "/dashboard/billing", label: "Facturation", icon: Receipt, testid: "nav-billing" },
  { href: "/dashboard/secretary", label: "Secrétariat IA", icon: Bot, testid: "nav-secretary" },
  { href: "/dashboard/profile", label: "Profil", icon: User, testid: "nav-profile" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col" data-testid="sidebar">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-indigo-600">Colossence</h1>
          <p className="text-xs text-gray-500 mt-1">Espace client</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                data-testid={item.testid}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 w-full transition-colors cursor-pointer"
            data-testid="btn-logout"
          >
            <LogOut className="w-5 h-5" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-screen">
        <PastDueBanner />
        <div className="flex-1 p-8">{children}</div>
      </main>
    </div>
  );
}

function PastDueBanner() {
  // This component will be hydrated client-side; it fetches subscription status
  return <PastDueBannerClient />;
}

function PastDueBannerClient() {
  // We use a simple fetch to check status - could be enhanced with SWR/React Query
  const [isPastDue, setIsPastDue] = useState(false);

  useEffect(() => {
    fetch("/api/subscription-status")
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "PAST_DUE") setIsPastDue(true);
      })
      .catch(() => {});
  }, []);

  if (!isPastDue) return null;

  return (
    <div className="bg-red-600 text-white px-6 py-3 flex items-center gap-3">
      <AlertTriangle className="w-5 h-5 shrink-0" />
      <p className="text-sm font-medium">
        Votre paiement a échoué. Veuillez mettre à jour votre moyen de paiement
        pour éviter une interruption de service.
      </p>
      <Link
        href="/dashboard/subscription"
        className="ml-auto text-sm font-semibold underline whitespace-nowrap"
      >
        Gérer l&apos;abonnement
      </Link>
    </div>
  );
}

