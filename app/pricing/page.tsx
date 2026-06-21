"use client";

import { useState } from "react";

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleCheckout = async (plan: "MENSUEL" | "ANNUEL") => {
    setLoading(plan);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Une erreur est survenue");
      }
    } catch {
      alert("Une erreur est survenue");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Nos tarifs
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Choisissez la formule qui vous convient. Profitez d&apos;un mois
            d&apos;essai gratuit pour tester notre secrétariat IA.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Formule Mensuelle */}
          <div className="relative bg-white rounded-2xl shadow-lg border border-gray-200 p-8 flex flex-col" data-testid="plan-mensuel">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Mensuel</h2>
              <p className="text-gray-500 mt-1">Flexibilité maximale</p>
            </div>

            <div className="mb-6">
              <span className="text-5xl font-bold text-gray-900">250€</span>
              <span className="text-gray-500 text-lg">/mois</span>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              <li className="flex items-center text-gray-700">
                <svg className="w-5 h-5 text-green-500 mr-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                1er mois offert (essai gratuit 30 jours)
              </li>
              <li className="flex items-center text-gray-700">
                <svg className="w-5 h-5 text-green-500 mr-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                50€ de frais de mise en ligne (unique)
              </li>
              <li className="flex items-center text-gray-700">
                <svg className="w-5 h-5 text-green-500 mr-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Secrétariat IA complet
              </li>
              <li className="flex items-center text-gray-700">
                <svg className="w-5 h-5 text-green-500 mr-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Sans engagement
              </li>
            </ul>

            <button
              onClick={() => handleCheckout("MENSUEL")}
              disabled={loading !== null}
              className="w-full py-3 px-6 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              data-testid="btn-subscribe-mensuel"
            >
              {loading === "MENSUEL" ? "Redirection..." : "Démarrer l'essai gratuit"}
            </button>
          </div>

          {/* Formule Annuelle */}
          <div className="relative bg-white rounded-2xl shadow-lg border-2 border-indigo-600 p-8 flex flex-col" data-testid="plan-annuel">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="bg-indigo-600 text-white text-sm font-semibold px-4 py-1 rounded-full">
                Économisez 1000€/an
              </span>
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Annuel</h2>
              <p className="text-gray-500 mt-1">Meilleur rapport qualité-prix</p>
            </div>

            <div className="mb-6">
              <span className="text-5xl font-bold text-gray-900">2000€</span>
              <span className="text-gray-500 text-lg">/an</span>
              <p className="text-sm text-gray-500 mt-1">soit ~167€/mois</p>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              <li className="flex items-center text-gray-700">
                <svg className="w-5 h-5 text-green-500 mr-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                1er mois offert (essai gratuit 30 jours)
              </li>
              <li className="flex items-center text-gray-700">
                <svg className="w-5 h-5 text-green-500 mr-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                50€ de frais de mise en ligne (unique)
              </li>
              <li className="flex items-center text-gray-700">
                <svg className="w-5 h-5 text-green-500 mr-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Secrétariat IA complet
              </li>
              <li className="flex items-center text-gray-700">
                <svg className="w-5 h-5 text-green-500 mr-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Économie de 1000€ par rapport au mensuel
              </li>
            </ul>

            <button
              onClick={() => handleCheckout("ANNUEL")}
              disabled={loading !== null}
              className="w-full py-3 px-6 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              data-testid="btn-subscribe-annuel"
            >
              {loading === "ANNUEL" ? "Redirection..." : "Démarrer l'essai gratuit"}
            </button>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-sm text-gray-500 mt-8">
          Paiement sécurisé par Stripe. Vous pouvez annuler à tout moment.
        </p>
      </div>
    </div>
  );
}
