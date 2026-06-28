"use client";

import { useState, useEffect } from "react";
import PhoneField from "@/components/PhoneField";
import { validatePhone } from "@/lib/validation/phone";

interface ProfileData {
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  nomEntreprise: string;
  siret: string;
  metier: string;
  zoneIntervention: string;
  tarifs: string;
}

export default function ProfilePage() {
  const [form, setForm] = useState<ProfileData>({
    prenom: "",
    nom: "",
    email: "",
    telephone: "",
    nomEntreprise: "",
    siret: "",
    metier: "",
    zoneIntervention: "",
    tarifs: "",
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [phoneError, setPhoneError] = useState<string | undefined>();

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) {
          setForm({
            prenom: data.prenom || "",
            nom: data.nom || "",
            email: data.email || "",
            telephone: data.telephone || "",
            nomEntreprise: data.nomEntreprise || "",
            siret: data.siret || "",
            metier: data.metier || "",
            zoneIntervention: data.zoneIntervention || "",
            tarifs: data.tarifs || "",
          });
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Valide le téléphone avant d'envoyer au serveur
    const phoneResult = validatePhone(form.telephone, "FR");
    if (form.telephone && !phoneResult.valid) {
      setPhoneError(phoneResult.error ?? "Numéro invalide");
      return;
    }
    setPhoneError(undefined);

    setLoading(true);
    setSaved(false);
    setError("");

    try {
      const res = await fetch("/api/profile", {
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

  const metiers = [
    { value: "SERRURIER", label: "Serrurier" },
    { value: "PLOMBIER", label: "Plombier" },
    { value: "ELECTRICIEN", label: "Électricien" },
    { value: "GARAGE", label: "Garage" },
    { value: "CHAUFFAGISTE", label: "Chauffagiste" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Profil</h1>

      <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">
        {/* Informations personnelles */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Informations personnelles</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="prenom" className="block text-sm font-medium text-gray-700 mb-1">
                Prénom
              </label>
              <input
                id="prenom"
                type="text"
                value={form.prenom}
                onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="nom" className="block text-sm font-medium text-gray-700 mb-1">
                Nom
              </label>
              <input
                id="nom"
                type="text"
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={form.email}
              disabled
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
            />
          </div>

          <PhoneField
            id="telephone"
            label="Téléphone"
            value={form.telephone}
            onChange={(v) => {
              setForm({ ...form, telephone: v });
              setPhoneError(undefined);
            }}
            error={phoneError}
          />
        </div>

        {/* Informations entreprise */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Entreprise</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="nomEntreprise" className="block text-sm font-medium text-gray-700 mb-1">
                Nom de l&apos;entreprise
              </label>
              <input
                id="nomEntreprise"
                type="text"
                value={form.nomEntreprise}
                onChange={(e) => setForm({ ...form, nomEntreprise: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="siret" className="block text-sm font-medium text-gray-700 mb-1">
                SIRET
              </label>
              <input
                id="siret"
                type="text"
                value={form.siret}
                onChange={(e) => setForm({ ...form, siret: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="metier" className="block text-sm font-medium text-gray-700 mb-1">
              Métier
            </label>
            <select
              id="metier"
              value={form.metier}
              onChange={(e) => setForm({ ...form, metier: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Sélectionner un métier</option>
              {metiers.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="zoneIntervention" className="block text-sm font-medium text-gray-700 mb-1">
              Zone d&apos;intervention
            </label>
            <input
              id="zoneIntervention"
              type="text"
              value={form.zoneIntervention}
              onChange={(e) => setForm({ ...form, zoneIntervention: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Paris et Île-de-France"
            />
          </div>

          <div>
            <label htmlFor="tarifs" className="block text-sm font-medium text-gray-700 mb-1">
              Tarifs
            </label>
            <input
              id="tarifs"
              type="text"
              value={form.tarifs}
              onChange={(e) => setForm({ ...form, tarifs: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="À partir de 50€"
            />
          </div>
        </div>

        {error && <p className="text-red-600 text-sm" data-testid="profile-error">{error}</p>}
        {saved && <p className="text-green-600 text-sm" data-testid="profile-success">✅ Profil mis à jour avec succès</p>}

        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 cursor-pointer"
          data-testid="btn-save-profile"
        >
          {loading ? "Enregistrement..." : "Enregistrer"}
        </button>
      </form>
    </div>
  );
}
