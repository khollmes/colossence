"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UsersRound, Tag, CalendarClock, Bot, PhoneCall, CreditCard, Receipt, LogOut, Menu, X, AlertTriangle } from "lucide-react";
import { signOut } from "next-auth/react";

const navItems = [
  {
    href: "/dashboard/equipe",
    label: "Gestion d'équipe",
    icon: UsersRound,
    testid: "nav-equipe",
  },
  {
    href: "/dashboard/tarifs",
    label: "Tarifs",
    icon: Tag,
    testid: "nav-tarifs",
  },
  {
    href: "/dashboard/horaires",
    label: "Horaires",
    icon: CalendarClock,
    testid: "nav-horaires",
  },
  {
    href: "/dashboard/secretariat",
    label: "Secrétariat IA",
    icon: Bot,
    testid: "nav-secretariat",
  },
  {
    href: "/dashboard/appels",
    label: "Appels",
    icon: PhoneCall,
    testid: "nav-appels",
  },
  {
    href: "/dashboard/subscription",
    label: "Abonnement",
    icon: CreditCard,
    testid: "nav-subscription",
  },
  {
    href: "/dashboard/billing",
    label: "Facturation",
    icon: Receipt,
    testid: "nav-billing",
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // État du menu sur mobile (ouvert / fermé). Sur desktop, la sidebar est toujours visible.
  const [mobileOpen, setMobileOpen] = useState(false);

  // À chaque changement de page, on referme le menu mobile automatiquement.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ─── Barre du haut : visible UNIQUEMENT sur mobile (md:hidden) ─── */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between bg-white border-b border-gray-200 px-4 h-14">
        <span className="text-lg font-bold text-indigo-600">Colossence</span>
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Ouvrir le menu"
          className="p-2 -mr-2 text-gray-700"
          data-testid="btn-open-menu"
        >
          <Menu className="w-6 h-6" />
        </button>
      </header>

      <div className="flex">
        {/* Voile sombre derrière la sidebar quand le menu mobile est ouvert.
            Un clic dessus referme le menu. Masqué sur desktop (md:hidden). */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/40 md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* ─── Sidebar ───
            - Mobile : positionnée en "fixed", glisse depuis la gauche (translate-x).
            - Desktop (md+) : redevient "static" et toujours visible (md:translate-x-0). */}
        <aside
          data-testid="sidebar"
          className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-200 md:static md:translate-x-0 ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-indigo-600">Colossence</h1>
              <p className="text-xs text-gray-500 mt-1">Espace client</p>
            </div>
            {/* Bouton fermer : mobile uniquement */}
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Fermer le menu"
              className="md:hidden p-1 text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              // Une entrée est "active" si l'URL courante correspond à son href.
              const isActive =
                pathname === item.href || pathname.startsWith(item.href);
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

        {/* ─── Contenu principal ─── */}
        <main className="flex-1 flex flex-col min-h-screen">
          <PastDueBanner />
          <div className="flex-1 p-4 sm:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

// Bannière d'alerte affichée si le dernier paiement a échoué (statut PAST_DUE).
// Conservée du layout précédent : ce n'est pas une entrée de navigation mais une
// sécurité métier (éviter une coupure de service sans prévenir le client).
function PastDueBanner() {
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
