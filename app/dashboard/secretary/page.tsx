"use client";

import { useState, useEffect } from "react";

interface SecretaryData {
  consignes: string;
  messageAccueil: string;
  horaires: string;
  telephoneATransferer: string;
}

export default function SecretaryPage() {
  const [form, setForm] = useState<SecretaryData>({
    consignes: "",
    messageAccueil: "",
    horaires: "",
    telephoneATransferer: "",
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/secretary")
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) {
          setForm({
            consignes: data.consignes || "",
            messageAccueil: data.messageAccueil || "",
            horaires: data.horaires || "",
            telephoneATransferer: data.telephoneATransferer || "",
          });
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaved(false);
    setError("");

    try {
      const res = await fetch("/api/secretary", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError(data.error || "Erreur lors de la sauvegarde");
      }
    } catch {
      setError("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Secrétariat IA</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-6 max-w-2xl">
        <div>
          <label htmlFor="messageAccueil" className="block text-sm font-medium text-gray-700 mb-1">
            Message d&apos;accueil
          </label>
          <textarea
            id="messageAccueil"
            value={form.messageAccueil}
            onChange={(e) => setForm({ ...form, messageAccueil: e.target.value })}
            rows={3}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Bonjour, vous êtes bien chez..."
          />
        </div>

        <div>
          <label htmlFor="consignes" className="block text-sm font-medium text-gray-700 mb-1">
            Consignes pour l&apos;IA
          </label>
          <textarea
            id="consignes"
            value={form.consignes}
            onChange={(e) => setForm({ ...form, consignes: e.target.value })}
            rows={4}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Instructions spécifiques pour votre secrétariat IA..."
          />
        </div>

        <div>
          <label htmlFor="horaires" className="block text-sm font-medium text-gray-700 mb-1">
            Horaires d&apos;ouverture
          </label>
          <input
            id="horaires"
            type="text"
            value={form.horaires}
            onChange={(e) => setForm({ ...form, horaires: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Lun-Ven 8h-18h, Sam 9h-12h"
          />
        </div>

        <div>
          <label htmlFor="telephoneATransferer" className="block text-sm font-medium text-gray-700 mb-1">
            Téléphone à transférer
          </label>
          <input
            id="telephoneATransferer"
            type="tel"
            value={form.telephoneATransferer}
            onChange={(e) => setForm({ ...form, telephoneATransferer: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="06 12 34 56 78"
          />
        </div>

        {error && (
          <p className="text-red-600 text-sm">{error}</p>
        )}

        {saved && (
          <p className="text-green-600 text-sm">✅ Configuration sauvegardée avec succès</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 cursor-pointer"
        >
          {loading ? "Enregistrement..." : "Enregistrer"}
        </button>
      </form>
    </div>
  );
}
