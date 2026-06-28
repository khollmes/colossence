"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import frLocale from "@fullcalendar/core/locales/fr";
import type { DateSelectArg, EventClickArg, EventInput } from "@fullcalendar/core";
import {
  Info,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Moon,
  Trash2,
  X,
  Users,
} from "lucide-react";

// ─────────────────────────── Types locaux ───────────────────────────
type Member = { id: string; firstName: string; lastName: string };
type Slot = {
  id: string;
  teamMemberId: string;
  dayOfWeek: number; // 0 = dimanche … 6 = samedi (convention JS Date.getDay())
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  teamMember: { id: string; firstName: string; lastName: string };
};

// Noms des jours (index = valeur de getDay()).
const DAY_NAMES = [
  "dimanche",
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
];

// Palette de couleurs distinctes attribuées aux membres dans l'ordre.
const COLORS = [
  "#6366f1", // indigo
  "#ec4899", // rose
  "#f59e0b", // ambre
  "#10b981", // émeraude
  "#3b82f6", // bleu
  "#8b5cf6", // violet
  "#ef4444", // rouge
  "#14b8a6", // teal
];

// ─────────────────────── Helpers de mapping date ↔ "semaine type" ───────────────────────
//
// 🔑 LE POINT CLÉ DU PROMPT : FullCalendar travaille avec de VRAIES dates, mais nous
// voulons une "semaine type" (lundi → dimanche) sans date précise. L'astuce :
//   - On affiche la semaine RÉELLE en cours (FullCalendar le fait par défaut).
//   - On masque les dates dans l'en-tête (on ne montre que "lundi", "mardi"…).
//   - Quand l'utilisateur crée un créneau, on ne retient QUE le jour de la semaine
//     (date.getDay() → 0-6) et l'heure ("HH:MM"). La date exacte est jetée.
//   - Pour réafficher un créneau stocké (dayOfWeek + heures), on recalcule une date
//     réelle DANS la semaine courante qui tombe sur le bon jour.

// Lundi 00:00 de la semaine en cours.
function getMonday(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  const day = date.getDay(); // 0=dim … 6=sam
  const diff = day === 0 ? -6 : 1 - day; // recule jusqu'au lundi
  date.setDate(date.getDate() + diff);
  return date;
}

// Applique une heure "HH:MM" (ou "24:00" = minuit le lendemain) à une date.
function withTime(base: Date, time: string): Date {
  const d = new Date(base);
  const [h, m] = time.split(":").map(Number);
  d.setHours(h, m, 0, 0); // setHours(24, …) bascule automatiquement au lendemain 00:00
  return d;
}

// Date réelle, dans la semaine courante, correspondant à un dayOfWeek (0-6) + une heure.
function dateForDayTime(dayOfWeek: number, time: string): Date {
  const monday = getMonday();
  // Décalage depuis lundi : lundi(1)→0, mardi(2)→1, …, dimanche(0)→6.
  const offset = (dayOfWeek + 6) % 7;
  const base = new Date(monday);
  base.setDate(monday.getDate() + offset);
  return withTime(base, time);
}

// Formate une date en "HH:MM" (on ne garde que l'heure du jour).
function formatHHMM(d: Date): string {
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

// Couleur d'un membre selon son rang dans la liste (stable et automatique).
function colorForMember(memberId: string, members: Member[]): string {
  const idx = members.findIndex((m) => m.id === memberId);
  return COLORS[(idx < 0 ? 0 : idx) % COLORS.length];
}

// Découpe la plage de nuit en sous-plages tenant DANS une journée.
// Si la nuit chevauche minuit (ex : 18:00 → 08:00), on renvoie deux morceaux.
function nightRanges(start: string, end: string): [string, string][] {
  if (start === end) return [];
  if (start < end) return [[start, end]]; // ne chevauche pas minuit
  return [
    ["00:00", end], // du début de journée jusqu'à la fin de nuit
    [start, "24:00"], // du début de nuit jusqu'à minuit
  ];
}

export default function HorairesPage() {
  // FullCalendar manipule le DOM : on ne le rend qu'après le montage côté client
  // (évite les soucis de rendu serveur / hydratation).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const calendarRef = useRef<FullCalendar>(null);

  // ── Données ──
  const [members, setMembers] = useState<Member[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [nightStartTime, setNightStartTime] = useState("18:00");
  const [nightEndTime, setNightEndTime] = useState("08:00");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // ── Formulaire heures de nuit (champs séparés des valeurs enregistrées) ──
  const [nightStartInput, setNightStartInput] = useState("18:00");
  const [nightEndInput, setNightEndInput] = useState("08:00");
  const [savingNight, setSavingNight] = useState(false);

  // ── Modale de création (après un glissement sur la grille) ──
  const [pendingSelection, setPendingSelection] = useState<{
    start: Date;
    end: Date;
  } | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // ── Modale de suppression ──
  const [slotToDelete, setSlotToDelete] = useState<Slot | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ─────────────────────── Chargement initial ───────────────────────
  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [membersRes, slotsRes, nightRes] = await Promise.all([
        fetch("/api/team"),
        fetch("/api/oncall"),
        fetch("/api/night-hours"),
      ]);

      if (!membersRes.ok || !slotsRes.ok || !nightRes.ok) {
        setError("Impossible de charger le planning.");
        return;
      }

      const membersData: Member[] = await membersRes.json();
      const slotsData: Slot[] = await slotsRes.json();
      const nightData = await nightRes.json();

      setMembers(membersData);
      setSlots(slotsData);
      setNightStartTime(nightData.nightStartTime);
      setNightEndTime(nightData.nightEndTime);
      setNightStartInput(nightData.nightStartTime);
      setNightEndInput(nightData.nightEndTime);
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Recharge uniquement les créneaux (après création / suppression).
  const reloadSlots = useCallback(async () => {
    const res = await fetch("/api/oncall");
    if (res.ok) setSlots(await res.json());
  }, []);

  // Le message de succès disparaît tout seul.
  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(null), 4000);
    return () => clearTimeout(timer);
  }, [success]);

  // ─────────────────────── Événements affichés sur le calendrier ───────────────────────
  const events: EventInput[] = useMemo(() => {
    // 1. Bande de nuit (événements "background" gris) sur les 7 jours.
    const monday = getMonday();
    const nightEvents: EventInput[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      for (const [s, e] of nightRanges(nightStartTime, nightEndTime)) {
        nightEvents.push({
          start: withTime(day, s),
          end: withTime(day, e),
          display: "background",
          color: "#e5e7eb", // gris clair
        });
      }
    }

    // 2. Créneaux d'astreinte (un par membre, avec sa couleur).
    const slotEvents: EventInput[] = slots.map((slot) => {
      const start = dateForDayTime(slot.dayOfWeek, slot.startTime);
      let end = dateForDayTime(slot.dayOfWeek, slot.endTime);
      // endTime <= startTime → le créneau chevauche minuit → il finit le lendemain.
      if (end <= start) end = new Date(end.getTime() + 24 * 60 * 60 * 1000);
      const color = colorForMember(slot.teamMemberId, members);
      return {
        id: slot.id,
        title: `${slot.teamMember.firstName} ${slot.teamMember.lastName}`,
        start,
        end,
        backgroundColor: color,
        borderColor: color,
        extendedProps: { slotId: slot.id },
      };
    });

    return [...nightEvents, ...slotEvents];
  }, [slots, members, nightStartTime, nightEndTime]);

  // ─────────────────────── Interactions calendrier ───────────────────────

  // Fin d'un glissement : on retient le jour + les heures, et on ouvre la modale "membre".
  function handleSelect(info: DateSelectArg) {
    if (members.length === 0) return; // pas de membre → rien à assigner
    setPendingSelection({ start: info.start, end: info.end });
    setSelectedMemberId(members[0].id);
    setCreateError(null);
    calendarRef.current?.getApi().unselect(); // enlève la surbrillance de sélection
  }

  // Clic sur un bloc existant → on propose de le supprimer.
  function handleEventClick(arg: EventClickArg) {
    const slotId = arg.event.extendedProps.slotId as string | undefined;
    if (!slotId) return; // clic sur la bande de nuit (background) → on ignore
    const slot = slots.find((s) => s.id === slotId);
    if (slot) setSlotToDelete(slot);
  }

  // ─────────────────────── Actions réseau ───────────────────────
  async function handleCreate() {
    if (!pendingSelection || !selectedMemberId) return;
    // On NE garde que le jour de la semaine (0-6) et les heures — la date est jetée.
    const dayOfWeek = pendingSelection.start.getDay();
    const startTime = formatHHMM(pendingSelection.start);
    const endTime = formatHHMM(pendingSelection.end);

    setCreating(true);
    setCreateError(null);
    try {
      const res = await fetch("/api/oncall", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamMemberId: selectedMemberId, dayOfWeek, startTime, endTime }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setCreateError(data.error ?? "Création impossible.");
        return;
      }
      setPendingSelection(null);
      setSuccess("Créneau d'astreinte ajouté.");
      await reloadSlots();
    } catch {
      setCreateError("Impossible de contacter le serveur.");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete() {
    if (!slotToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/oncall/${slotToDelete.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Suppression impossible.");
        return;
      }
      setSlotToDelete(null);
      setSuccess("Créneau supprimé.");
      await reloadSlots();
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setDeleting(false);
    }
  }

  async function handleSaveNight() {
    setSavingNight(true);
    setError(null);
    try {
      const res = await fetch("/api/night-hours", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nightStartTime: nightStartInput, nightEndTime: nightEndInput }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Enregistrement impossible.");
        return;
      }
      const updated = await res.json();
      // Met à jour les valeurs enregistrées → la bande grise du calendrier se redessine.
      setNightStartTime(updated.nightStartTime);
      setNightEndTime(updated.nightEndTime);
      setSuccess("Heures de nuit enregistrées.");
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setSavingNight(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* ── En-tête ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Horaires &amp; astreintes</h1>
        <p className="text-sm text-gray-500 mt-1">
          Définissez qui est de garde, et quand.
        </p>
      </div>

      {/* ── Encadré pédagogique ── */}
      <div className="flex gap-3 bg-indigo-50 border border-indigo-100 rounded-xl p-4">
        <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <p className="text-sm text-indigo-900 leading-relaxed">
          Glissez sur la grille pour définir les créneaux d&apos;astreinte. Chaque
          membre a sa couleur. En dehors des heures d&apos;ouverture, les appels
          sont transférés au membre de garde.
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
          {/* ─────────────── SECTION 1 : Heures de nuit ─────────────── */}
          <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Moon className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-semibold text-gray-900">Heures de nuit</h2>
            </div>
            <p className="text-sm text-gray-500">
              Pendant ces heures, le supplément nuit s&apos;applique automatiquement
              à vos tarifs.
            </p>
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label
                  htmlFor="night-start"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Début
                </label>
                <input
                  id="night-start"
                  type="time"
                  value={nightStartInput}
                  onChange={(e) => setNightStartInput(e.target.value)}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                />
              </div>
              <div>
                <label
                  htmlFor="night-end"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Fin
                </label>
                <input
                  id="night-end"
                  type="time"
                  value={nightEndInput}
                  onChange={(e) => setNightEndInput(e.target.value)}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                />
              </div>
              <button
                onClick={handleSaveNight}
                disabled={savingNight}
                className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
              >
                {savingNight && <Loader2 className="w-4 h-4 animate-spin" />}
                Enregistrer
              </button>
            </div>
          </section>

          {/* ── Invitation à créer un membre si l'équipe est vide ── */}
          {members.length === 0 && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <Users className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-900">
                Vous n&apos;avez pas encore de membre d&apos;équipe. Pour planifier
                des astreintes, commencez par en créer un dans la{" "}
                <Link href="/dashboard/equipe" className="font-semibold underline">
                  page Gestion d&apos;équipe
                </Link>
                .
              </p>
            </div>
          )}

          {/* ─────────────── SECTION 2 : Le calendrier ─────────────── */}
          <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
            {mounted && (
              <FullCalendar
                ref={calendarRef}
                plugins={[timeGridPlugin, interactionPlugin]}
                initialView="timeGridWeek"
                locale={frLocale}
                firstDay={1} // la semaine commence le lundi
                headerToolbar={false} // pas de navigation : c'est une semaine TYPE
                // On n'affiche QUE le nom du jour (pas la date) → effet "semaine type".
                dayHeaderFormat={{ weekday: "long" }}
                allDaySlot={false}
                slotMinTime="06:00:00"
                slotMaxTime="24:00:00"
                slotDuration="00:30:00"
                // Affichage 24h (pas d'AM/PM).
                slotLabelFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
                eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
                height="auto"
                // Sélection possible seulement s'il y a au moins un membre à assigner.
                selectable={members.length > 0}
                selectMirror
                // Un créneau = un seul jour : on refuse une sélection à cheval sur 2 jours.
                selectAllow={(span) => {
                  const lastInstant = new Date(span.end.getTime() - 1); // end est exclusif
                  return span.start.getDay() === lastInstant.getDay();
                }}
                select={handleSelect}
                eventClick={handleEventClick}
                events={events}
              />
            )}
          </section>

          {/* ─────────────── Légende des membres ─────────────── */}
          {members.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <span className="text-sm font-medium text-gray-500">Légende :</span>
              {members.map((member) => (
                <span key={member.id} className="flex items-center gap-2 text-sm text-gray-700">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: colorForMember(member.id, members) }}
                  />
                  {member.firstName} {member.lastName}
                </span>
              ))}
            </div>
          )}
        </>
      )}

      {/* ─────────────── Modale : choisir le membre de garde ─────────────── */}
      {pendingSelection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !creating && setPendingSelection(null)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative bg-white w-full max-w-sm rounded-2xl shadow-xl"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Qui est de garde ?</h2>
              <button
                onClick={() => setPendingSelection(null)}
                className="p-1 text-gray-400 hover:text-gray-600"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Rappel du créneau choisi */}
              <p className="text-sm text-gray-500">
                {DAY_NAMES[pendingSelection.start.getDay()]} de{" "}
                <strong>{formatHHMM(pendingSelection.start)}</strong> à{" "}
                <strong>{formatHHMM(pendingSelection.end)}</strong>
              </p>

              {createError && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  {createError}
                </div>
              )}

              <div>
                <label
                  htmlFor="member-select"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Membre de l&apos;équipe
                </label>
                <select
                  id="member-select"
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition bg-white"
                >
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.firstName} {member.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-1">
                <button
                  onClick={() => setPendingSelection(null)}
                  disabled={creating}
                  className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
                >
                  {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                  Ajouter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────── Modale : confirmer la suppression ─────────────── */}
      {slotToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !deleting && setSlotToDelete(null)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative bg-white w-full max-w-sm rounded-2xl shadow-xl p-6"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Supprimer ce créneau ?
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {slotToDelete.teamMember.firstName}{" "}
                  {slotToDelete.teamMember.lastName} — {DAY_NAMES[slotToDelete.dayOfWeek]}{" "}
                  de {slotToDelete.startTime} à {slotToDelete.endTime}.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setSlotToDelete(null)}
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
