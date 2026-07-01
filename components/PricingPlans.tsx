"use client";

import { useState } from "react";

type PlanEnum =
  | "STANDARD_MENSUEL"
  | "STANDARD_ANNUEL"
  | "FULLIA_MENSUEL"
  | "FULLIA_ANNUEL";

type Billing = "mensuel" | "annuel";

interface PlanConfig {
  name: string;
  description: string;
  price: number;
  unit: string;
  planEnum: PlanEnum;
  badge?: string;
  savings?: number;
  perCallNote: string | null;
  featured: boolean;
}

const PLANS: Record<Billing, PlanConfig[]> = {
  mensuel: [
    {
      name: "Standard",
      description:
        "L'appel sonne d'abord chez la personne de garde pendant 4 sec (délai personnalisable). Si pas de réponse, l'IA prend le relais.",
      price: 70,
      unit: "mois",
      planEnum: "STANDARD_MENSUEL",
      badge: "1er mois offert",
      perCallNote: "+ 2 €/appel traité",
      featured: false,
    },
    {
      name: "Full IA",
      description: "L'IA répond à 100% des appels, immédiatement.",
      price: 250,
      unit: "mois",
      planEnum: "FULLIA_MENSUEL",
      badge: "1er mois offert",
      perCallNote: "500 appels inclus, puis 0,50 €/appel",
      featured: true,
    },
  ],
  annuel: [
    {
      name: "Standard",
      description:
        "L'appel sonne d'abord chez la personne de garde pendant 4 sec (délai personnalisable). Si pas de réponse, l'IA prend le relais.",
      price: 700,
      unit: "an",
      planEnum: "STANDARD_ANNUEL",
      savings: 140, // 70 × 12 = 840 − 700
      perCallNote: "+ 2 €/appel traité",
      featured: false,
    },
    {
      name: "Full IA",
      description: "L'IA répond à 100% des appels, immédiatement.",
      price: 2000,
      unit: "an",
      planEnum: "FULLIA_ANNUEL",
      savings: 1000, // 250 × 12 = 3 000 − 2 000
      perCallNote: "500 appels/mois inclus, puis 0,50 €/appel",
      featured: true,
    },
  ],
};

function CheckIcon() {
  return (
    <svg
      className="w-5 h-5 text-green-500 shrink-0"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function PlanCard({
  plan,
  onSelect,
  isLoading,
}: {
  plan: PlanConfig;
  onSelect: (p: PlanEnum) => void;
  isLoading: boolean;
}) {
  return (
    <div
      className={`relative bg-white rounded-2xl flex flex-col p-8 ${
        plan.featured
          ? "border-2 border-indigo-600 shadow-lg shadow-indigo-100"
          : "border border-gray-200 shadow-sm"
      }`}
    >
      {plan.featured && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="bg-indigo-600 text-white text-sm font-semibold px-4 py-1 rounded-full whitespace-nowrap">
            Recommandé
          </span>
        </div>
      )}

      {/* En-tête */}
      <div className="mb-4">
        <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
        <p className="text-sm text-gray-500 mt-1 leading-relaxed">
          {plan.description}
        </p>
      </div>

      {/* Prix */}
      <div className="mb-6">
        <div className="flex items-end gap-1">
          <span className="text-4xl font-bold text-gray-900">{plan.price} €</span>
          <span className="text-gray-500 pb-1">/{plan.unit}</span>
        </div>
        {plan.savings !== undefined && (
          <p className="text-sm text-green-600 font-medium mt-1">
            Économisez {plan.savings} €/an
          </p>
        )}
        {plan.badge && (
          <span className="inline-block mt-2 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-full px-3 py-0.5">
            {plan.badge}
          </span>
        )}
      </div>

      {/* Features */}
      <ul className="space-y-3 mb-8 flex-1 text-sm text-gray-700">
        <li className="flex items-center gap-3">
          <CheckIcon />
          50 € de frais d&apos;installation de ligne (unique)
        </li>
        {plan.perCallNote !== null ? (
          <li className="flex items-center gap-3">
            <CheckIcon />
            {plan.perCallNote}
          </li>
        ) : (
          <li className="flex items-center gap-3">
            <CheckIcon />
            Tout compris, aucun frais par appel
          </li>
        )}
        <li className="flex items-center gap-3">
          <CheckIcon />
          Secrétariat IA complet
        </li>
      </ul>

      <button
        onClick={() => onSelect(plan.planEnum)}
        disabled={isLoading}
        className={`w-full py-3 px-6 rounded-xl font-semibold transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
          plan.featured
            ? "bg-indigo-600 text-white hover:bg-indigo-700"
            : "bg-gray-900 text-white hover:bg-gray-800"
        }`}
      >
        {isLoading ? "Redirection…" : "Choisir cette offre"}
      </button>
    </div>
  );
}

export default function PricingPlans() {
  const [billing, setBilling] = useState<Billing>("mensuel");
  const [loading, setLoading] = useState<PlanEnum | null>(null);

  const handleSelect = async (planEnum: PlanEnum) => {
    setLoading(planEnum);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planEnum }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error ?? "Une erreur est survenue.");
        setLoading(null);
      }
    } catch {
      alert("Une erreur est survenue.");
      setLoading(null);
    }
  };

  const plans = PLANS[billing];

  return (
    <div>
      {/* Toggle mensuel / annuel */}
      <div className="flex justify-center mb-10">
        <div className="inline-flex items-center bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setBilling("mensuel")}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              billing === "mensuel"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Mensuel
          </button>
          <button
            onClick={() => setBilling("annuel")}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              billing === "annuel"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Annuel
            <span className="ml-2 text-xs font-semibold text-green-600">
              −2 mois
            </span>
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="grid sm:grid-cols-2 gap-8 max-w-3xl mx-auto">
        {plans.map((plan) => (
          <PlanCard
            key={plan.planEnum}
            plan={plan}
            onSelect={handleSelect}
            isLoading={loading === plan.planEnum}
          />
        ))}
      </div>

      <p className="text-center text-sm text-gray-400 mt-8">
        Paiement sécurisé par Stripe. Vous pouvez annuler à tout moment.
      </p>
    </div>
  );
}
