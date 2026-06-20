"use client";

import { useState } from "react";

export default function PortalButton() {
  const [loading, setLoading] = useState(false);

  const handlePortal = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Erreur lors de l'ouverture du portail");
      }
    } catch {
      alert("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePortal}
      disabled={loading}
      className="px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 cursor-pointer"
    >
      {loading ? "Chargement..." : "Gérer mon abonnement (Stripe)"}
    </button>
  );
}
