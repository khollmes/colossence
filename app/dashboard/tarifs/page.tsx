"use client";

import { useState, useEffect, useCallback, FormEvent } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Info,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Tag,
  Settings2,
} from "lucide-react";

// ── Types locaux (volontairement découplés du client Prisma) ──
type PricingType = "STANDARD" | "NIGHT_SURCHARGE" | "HOLIDAY_SURCHARGE" | "TRAVEL";

type PricingItem = {
  id: string;
  name: string;
  price: number; // en CENTIMES (ex : 15000 = 150 €)
  type: PricingType;
  isActive: boolean;
  createdAt: string;
};

// Ordre d'affichage fixe des lignes spéciales + petite explication sous chacune.
const SPECIAL_TYPES: PricingType[] = [
  "NIGHT_SURCHARGE",
  "HOLIDAY_SURCHARGE",
  "TRAVEL",
];
const SPECIAL_HELP: Record<string, string> = {
  NIGHT_SURCHARGE: "Appliqué aux interventions de nuit (généralement 20h–7h).",
  HOLIDAY_SURCHARGE: "Appliqué les dimanches et jours fériés.",
  TRAVEL: "Forfait facturé pour le déplacement jusqu'au client.",
};

// Formate des CENTIMES en euros à la française : 15000 → "150,00 €".
function formatPrice(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

// Convertit la saisie utilisateur (euros) en nombre.
// Accepte la virgule ET le point comme séparateur décimal. Renvoie null si invalide.
function parseEuros(raw: string): number | null {
  const normalized = raw.trim().replace(",", ".");
  if (normalized === "") return null;
  const value = Number(normalized);
  if (!isFinite(value) || value <= 0) return null;
  return value;
}

export default function TarifsPage() {
  // ── Données ──
  const [items, setItems] = useState<PricingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // ── Modale de formulaire (ajout/édition d'un standard, ou édition d'un spécial) ──
  const [formOpen, setFormOpen] = useState(false);
  // L'item en cours d'édition (null = création d'une nouvelle prestation standard).
  const [formItem, setFormItem] = useState<PricingItem | null>(null);
  // Pour un spécial, on ne modifie que le prix (le nom est figé).
  const [isSpecialForm, setIsSpecialForm] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [priceInput, setPriceInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // ── Modale de confirmation de suppression (standards uniquement) ──
  const [deletingItem, setDeletingItem] = useState<PricingItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/pricing");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Impossible de charger les tarifs.");
        setItems([]);
        return;
      }
      setItems(await res.json());
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Le message de succès disparaît tout seul au bout de 4 secondes.
  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(null), 4000);
    return () => clearTimeout(timer);
  }, [success]);

  // Standards d'un côté, spéciaux (dans l'ordre fixe) de l'autre.
  const standardItems = items.filter((item) => item.type === "STANDARD");
  const specialItems = SPECIAL_TYPES.map((type) =>
    items.find((item) => item.type === type)
  );

  // ── Ouverture des modales ──
  function openAddStandard() {
    setFormItem(null);
    setIsSpecialForm(false);
    setNameInput("");
    setPriceInput("");
    setFormError(null);
    setFormOpen(true);
  }

  function openEditStandard(item: PricingItem) {
    setFormItem(item);
    setIsSpecialForm(false);
    setNameInput(item.name);
    setPriceInput(String(item.price / 100).replace(".", ","));
    setFormError(null);
    setFormOpen(true);
  }

  function openEditSpecial(item: PricingItem) {
    setFormItem(item);
    setIsSpecialForm(true);
    setNameInput(item.name);
    setPriceInput(String(item.price / 100).replace(".", ","));
    setFormError(null);
    setFormOpen(true);
  }

  function closeForm() {
    if (submitting) return;
    setFormOpen(false);
  }

  // Création (POST) ou modification (PATCH).
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    // Le nom n'est requis que pour une prestation standard.
    const name = nameInput.trim();
    if (!isSpecialForm && !name) {
      setFormError("Le nom de la prestation est obligatoire.");
      return;
    }

    // Le prix est saisi en euros (virgule ou point acceptés).
    const priceEuros = parseEuros(priceInput);
    if (priceEuros === null) {
      setFormError("Le prix doit être un nombre positif (ex : 150 ou 150,50).");
      return;
    }

    setSubmitting(true);
    try {
      const isEdit = formItem !== null;
      // En édition d'un spécial, on n'envoie que le prix (le nom est figé).
      const payload = isSpecialForm
        ? { price: priceEuros }
        : { name, price: priceEuros };

      const res = await fetch(
        isEdit ? `/api/pricing/${formItem.id}` : "/api/pricing",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setFormError(data.error ?? "Une erreur est survenue.");
        return;
      }

      setFormOpen(false);
      setSuccess(isEdit ? "Tarif mis à jour." : "Prestation ajoutée.");
      await fetchItems();
    } catch {
      setFormError("Impossible de contacter le serveur.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deletingItem) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/pricing/${deletingItem.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Suppression impossible.");
        return;
      }
      setDeletingItem(null);
      setSuccess("Prestation supprimée.");
      await fetchItems();
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* ── En-tête ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tarifs</h1>
        <p className="text-sm text-gray-500 mt-1">
          Vos prestations et leurs prix, annoncés par le secrétariat IA.
        </p>
      </div>

      {/* ── Encadré pédagogique ── */}
      <div className="flex gap-3 bg-indigo-50 border border-indigo-100 rounded-xl p-4">
        <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <p className="text-sm text-indigo-900 leading-relaxed">
          Renseignez vos prestations et leurs tarifs. Tous les prix sont{" "}
          <strong>TTC</strong>. C&apos;est ce montant que votre secrétariat IA
          annoncera à vos clients au téléphone.
        </p>
      </div>

      {/* ── Messages succès / erreur ── */}
      {success && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 text-sm rounded-lg px-4 py-3">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          {success}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Chargement…
        </div>
      ) : (
        <>
          {/* ─────────────── SECTION : Mes prestations ─────────────── */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <Tag className="w-5 h-5 text-indigo-600" />
                Mes prestations
              </h2>
              <button
                onClick={openAddStandard}
                className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors shadow-sm"
                data-testid="btn-add-pricing"
              >
                <Plus className="w-4 h-4" />
                Ajouter une prestation
              </button>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              {standardItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center px-6 py-14">
                  <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
                    <Tag className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900">
                    Aucune prestation pour l&apos;instant
                  </h3>
                  <p className="text-sm text-gray-500 mt-1 max-w-sm">
                    Ajoutez vos prestations (ex : « Ouverture de porte ») et leur
                    prix TTC.
                  </p>
                  <button
                    onClick={openAddStandard}
                    className="mt-5 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter une prestation
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      <tr>
                        <th className="px-6 py-3">Nom de la prestation</th>
                        <th className="px-6 py-3">Prix TTC</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {standardItems.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 font-medium text-gray-900">
                            {item.name}
                          </td>
                          <td className="px-6 py-4 text-gray-700 tabular-nums">
                            {formatPrice(item.price)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-4">
                              <button
                                onClick={() => openEditStandard(item)}
                                className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                              >
                                <Pencil className="w-4 h-4" />
                                Modifier
                              </button>
                              <button
                                onClick={() => setDeletingItem(item)}
                                className="inline-flex items-center gap-1.5 text-red-600 hover:text-red-700 text-sm font-medium"
                              >
                                <Trash2 className="w-4 h-4" />
                                Supprimer
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          {/* ─────────────── SECTION : Réglages spéciaux (distincte) ─────────────── */}
          <section className="space-y-3">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <Settings2 className="w-5 h-5 text-amber-600" />
                Réglages spéciaux
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Majorations et frais fixes. Ces lignes ne peuvent pas être
                supprimées, seulement modifiées.
              </p>
            </div>

            {/* Fond ambré + bordure pour bien la distinguer des prestations standards. */}
            <div className="bg-amber-50/60 border border-amber-200 rounded-xl divide-y divide-amber-100">
              {specialItems.map((item, index) => {
                const type = SPECIAL_TYPES[index];
                return (
                  <div
                    key={type}
                    className="flex items-center justify-between gap-4 p-4"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900">
                        {item ? item.name : "Non défini"}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {SPECIAL_HELP[type]}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="text-gray-900 font-semibold tabular-nums">
                        {item ? formatPrice(item.price) : "—"}
                      </span>
                      <button
                        onClick={() => item && openEditSpecial(item)}
                        disabled={!item}
                        className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 disabled:text-gray-400 disabled:cursor-not-allowed text-sm font-medium"
                      >
                        <Pencil className="w-4 h-4" />
                        Modifier
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}

      {/* ─────────────── Modale de formulaire ─────────────── */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeForm}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative bg-white w-full max-w-md rounded-2xl shadow-xl"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                {isSpecialForm
                  ? `Modifier — ${nameInput}`
                  : formItem
                  ? "Modifier la prestation"
                  : "Ajouter une prestation"}
              </h2>
              <button
                onClick={closeForm}
                className="p-1 text-gray-400 hover:text-gray-600"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  {formError}
                </div>
              )}

              {/* Le nom n'est éditable que pour une prestation standard. */}
              {!isSpecialForm && (
                <div>
                  <label
                    htmlFor="pricing-name"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Nom de la prestation
                    <span className="text-red-500 ml-1" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="pricing-name"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    required
                    placeholder="Ex : Ouverture de porte claquée"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="pricing-price"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Prix TTC (en euros)
                  <span className="text-red-500 ml-1" aria-hidden="true">*</span>
                </label>
                <div className="relative">
                  <input
                    id="pricing-price"
                    // type="text" (et non "number") pour accepter la virgule française.
                    type="text"
                    inputMode="decimal"
                    value={priceInput}
                    onChange={(e) => setPriceInput(e.target.value)}
                    required
                    placeholder="150,00"
                    className="w-full px-4 py-2.5 pr-9 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition tabular-nums"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                    €
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Virgule ou point acceptés (ex : 150 ou 150,50).
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────── Modale de confirmation de suppression ─────────────── */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !deleting && setDeletingItem(null)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative bg-white w-full max-w-sm rounded-2xl shadow-xl p-6"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Supprimer cette prestation ?
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  « {deletingItem.name} » ne sera plus annoncée par le
                  secrétariat.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setDeletingItem(null)}
                disabled={deleting}
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
              >
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
