"use client";

import { useState, useEffect, useCallback, FormEvent } from "react";
import { parsePhoneNumber } from "libphonenumber-js";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Info,
  Loader2,
  AlertCircle,
  CheckCircle2,
  UsersRound,
} from "lucide-react";
import PhoneField from "@/components/PhoneField";
import { validatePhone } from "@/lib/validation/phone";

// Forme d'un membre tel que renvoyé par l'API /api/team.
type TeamMember = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string; // stocké en E.164 (ex : "+33612345678")
  isActive: boolean;
  createdAt: string;
};

// Met en forme un numéro E.164 pour l'affichage ("+33 6 12 34 56 78").
// Si le numéro est invalide pour une raison ou une autre, on l'affiche tel quel.
function formatPhone(e164: string): string {
  try {
    return parsePhoneNumber(e164).formatInternational();
  } catch {
    return e164;
  }
}

export default function EquipePage() {
  // ── État de la liste ──
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // ── État du formulaire (modale d'ajout / d'édition) ──
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // ── État de la suppression (modale de confirmation) ──
  const [deletingMember, setDeletingMember] = useState<TeamMember | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Charge la liste des membres depuis l'API.
  const fetchMembers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/team");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Impossible de charger l'équipe.");
        setMembers([]);
        return;
      }
      setMembers(await res.json());
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Au montage de la page : on récupère la liste.
  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Le message de succès disparaît tout seul au bout de 4 secondes.
  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(null), 4000);
    return () => clearTimeout(timer);
  }, [success]);

  // Ouvre la modale en mode "ajout" (champs vides).
  function openAdd() {
    setEditingMember(null);
    setFirstName("");
    setLastName("");
    setPhone("");
    setFormError(null);
    setPhoneError(null);
    setIsFormOpen(true);
  }

  // Ouvre la modale en mode "édition" (champs pré-remplis).
  function openEdit(member: TeamMember) {
    setEditingMember(member);
    setFirstName(member.firstName);
    setLastName(member.lastName);
    setPhone(member.phone);
    setFormError(null);
    setPhoneError(null);
    setIsFormOpen(true);
  }

  function closeForm() {
    if (submitting) return; // on n'interrompt pas un envoi en cours
    setIsFormOpen(false);
  }

  // Création (POST) ou modification (PATCH) selon le mode.
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setPhoneError(null);

    // Validation côté client AVANT d'appeler l'API (retour immédiat à l'utilisateur).
    const fn = firstName.trim();
    const ln = lastName.trim();
    if (!fn || !ln) {
      setFormError("Le prénom et le nom sont obligatoires.");
      return;
    }
    const phoneCheck = validatePhone(phone, "FR");
    if (!phoneCheck.valid) {
      setPhoneError(phoneCheck.error ?? "Numéro de téléphone invalide.");
      return;
    }

    setSubmitting(true);
    try {
      const isEdit = editingMember !== null;
      const res = await fetch(
        isEdit ? `/api/team/${editingMember.id}` : "/api/team",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ firstName: fn, lastName: ln, phone }),
        }
      );

      if (!res.ok) {
        // L'API renvoie { error: "..." } : on l'affiche dans la modale.
        const data = await res.json().catch(() => ({}));
        setFormError(data.error ?? "Une erreur est survenue.");
        return;
      }

      setIsFormOpen(false);
      setSuccess(
        isEdit ? "Membre modifié avec succès." : "Membre ajouté avec succès."
      );
      await fetchMembers();
    } catch {
      setFormError("Impossible de contacter le serveur.");
    } finally {
      setSubmitting(false);
    }
  }

  // Suppression logique (soft delete) après confirmation.
  async function handleDelete() {
    if (!deletingMember) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/team/${deletingMember.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Suppression impossible.");
        return;
      }
      setDeletingMember(null);
      setSuccess("Membre supprimé.");
      await fetchMembers();
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* ── En-tête + bouton d'ajout ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion d&apos;équipe</h1>
          <p className="text-sm text-gray-500 mt-1">
            Les collaborateurs qui peuvent recevoir les appels transférés.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors shadow-sm"
          data-testid="btn-add-member"
        >
          <Plus className="w-4 h-4" />
          Ajouter un membre
        </button>
      </div>

      {/* ── Encadré pédagogique ── */}
      <div className="flex gap-3 bg-indigo-50 border border-indigo-100 rounded-xl p-4">
        <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <p className="text-sm text-indigo-900 leading-relaxed">
          Ajoutez les membres de votre équipe. Leurs numéros permettront au
          secrétariat IA de leur transférer les appels selon vos horaires. Ces
          fiches ne sont <strong>pas</strong> des comptes : vos collaborateurs
          n&apos;ont rien à installer ni à se connecter.
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

      {/* ── Carte contenant le tableau ── */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          // État de chargement
          <div className="flex items-center justify-center py-16 text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Chargement…
          </div>
        ) : members.length === 0 ? (
          // État vide
          <div className="flex flex-col items-center justify-center text-center px-6 py-16">
            <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
              <UsersRound className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">
              Aucun membre pour l&apos;instant
            </h3>
            <p className="text-sm text-gray-500 mt-1 max-w-sm">
              Ajoutez votre premier collaborateur pour que le secrétariat puisse
              lui transférer des appels.
            </p>
            <button
              onClick={openAdd}
              className="mt-5 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Ajouter un membre
            </button>
          </div>
        ) : (
          // Tableau des membres (scroll horizontal si l'écran est étroit)
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-6 py-3">Prénom</th>
                  <th className="px-6 py-3">Nom</th>
                  <th className="px-6 py-3">Téléphone</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {members.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {member.firstName}
                    </td>
                    <td className="px-6 py-4 text-gray-700">{member.lastName}</td>
                    <td className="px-6 py-4 text-gray-700 font-mono text-xs">
                      {formatPhone(member.phone)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-4">
                        <button
                          onClick={() => openEdit(member)}
                          className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                        >
                          <Pencil className="w-4 h-4" />
                          Modifier
                        </button>
                        <button
                          onClick={() => setDeletingMember(member)}
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

      {/* ─────────────── Modale d'ajout / édition ─────────────── */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Fond semi-transparent : un clic referme la modale */}
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
                {editingMember ? "Modifier le membre" : "Ajouter un membre"}
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="firstName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Prénom
                    <span className="text-red-500 ml-1" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  />
                </div>
                <div>
                  <label
                    htmlFor="lastName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Nom
                    <span className="text-red-500 ml-1" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  />
                </div>
              </div>

              {/* On réutilise ton composant PhoneField (validation + format E.164). */}
              <PhoneField
                id="phone"
                label="Téléphone"
                value={phone}
                onChange={setPhone}
                required
                error={phoneError ?? undefined}
              />

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
                  {editingMember ? "Enregistrer" : "Ajouter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────── Modale de confirmation de suppression ─────────────── */}
      {deletingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !deleting && setDeletingMember(null)}
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
                  Supprimer ce membre ?
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {deletingMember.firstName} {deletingMember.lastName} ne recevra
                  plus d&apos;appels transférés.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setDeletingMember(null)}
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
