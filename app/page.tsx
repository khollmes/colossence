"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone,
  Clock,
  CalendarCheck,
  Wrench,
  Droplets,
  Zap,
  Car,
  Flame,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";

// ─── Animations ──────────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.15 } },
};

// ─── Header ──────────────────────────────────────────────────────────────────

function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gray-950/80 backdrop-blur-md border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <Link href="/" className="text-2xl font-bold text-white tracking-tight">
          Colossence
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-gray-300 hover:text-white transition-colors">
            Accueil
          </Link>
          <Link href="/pricing" className="text-gray-300 hover:text-white transition-colors">
            Tarifs
          </Link>
          <Link href="/login" className="text-gray-300 hover:text-white transition-colors">
            Connexion
          </Link>
          <Link
            href="/register"
            className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors"
          >
            Essai gratuit
          </Link>
        </nav>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden text-gray-300 hover:text-white"
          aria-label="Menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile nav */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden bg-gray-950 border-b border-gray-800"
          >
            <div className="flex flex-col gap-4 px-4 py-6">
              <Link href="/" className="text-gray-300 hover:text-white" onClick={() => setMobileOpen(false)}>
                Accueil
              </Link>
              <Link href="/pricing" className="text-gray-300 hover:text-white" onClick={() => setMobileOpen(false)}>
                Tarifs
              </Link>
              <Link href="/login" className="text-gray-300 hover:text-white" onClick={() => setMobileOpen(false)}>
                Connexion
              </Link>
              <Link
                href="/register"
                className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-center"
                onClick={() => setMobileOpen(false)}
              >
                Essai gratuit
              </Link>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

// ─── Hero ────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-blue-600/20 blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-indigo-600/15 blur-[100px] animate-pulse" />
      </div>

      <div className="max-w-5xl mx-auto text-center">
        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight"
        >
          Votre secrétariat IA
          <span className="block text-blue-400">pour artisans du dépannage</span>
        </motion.h1>

        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.2 }}
          className="mt-6 text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto"
        >
          Ne perdez plus un seul client. Notre intelligence artificielle répond à vos appels 24h/24,
          prend les rendez-vous et gère votre planning pendant que vous êtes sur le terrain.
        </motion.p>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.4 }}
          className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link
            href="/register"
            className="px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-lg transition-all hover:scale-105 shadow-lg shadow-blue-600/25"
          >
            Démarrer l&apos;essai gratuit (1er mois offert)
          </Link>
          <Link
            href="/pricing"
            className="px-8 py-4 rounded-xl border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white font-semibold text-lg transition-all"
          >
            Voir les tarifs
          </Link>
        </motion.div>

        {/* Animated visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="mt-16 relative mx-auto max-w-2xl"
        >
          <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 sm:p-8 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <div className="space-y-3 text-left">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1 }}
                className="bg-gray-800 rounded-lg p-3 max-w-xs"
              >
                <p className="text-sm text-gray-300">📞 Appel entrant : 06 12 34 56 78</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.5 }}
                className="bg-blue-600/20 border border-blue-500/30 rounded-lg p-3 max-w-sm ml-auto"
              >
                <p className="text-sm text-blue-200">
                  🤖 Bonjour ! Vous êtes bien chez Martin Plomberie. Comment puis-je vous aider ?
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 2 }}
                className="bg-gray-800 rounded-lg p-3 max-w-xs"
              >
                <p className="text-sm text-gray-300">J&apos;ai une fuite d&apos;eau urgente...</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 2.5 }}
                className="bg-blue-600/20 border border-blue-500/30 rounded-lg p-3 max-w-sm ml-auto"
              >
                <p className="text-sm text-blue-200">
                  🤖 Je comprends l&apos;urgence. Je vous propose un créneau aujourd&apos;hui à 14h. Cela vous convient ?
                </p>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Bénéfices ───────────────────────────────────────────────────────────────

const benefits = [
  {
    icon: Phone,
    title: "Ne ratez plus aucun appel",
    description:
      "Chaque appel est pris en charge instantanément par votre secrétaire IA, même quand vous êtes en intervention.",
  },
  {
    icon: Clock,
    title: "Disponible 24h/24, 7j/7",
    description:
      "Vos clients peuvent vous joindre à toute heure. Fini les appels manqués le soir et le week-end.",
  },
  {
    icon: CalendarCheck,
    title: "Prise de RDV automatique",
    description:
      "L'IA planifie les interventions selon vos disponibilités et envoie les confirmations automatiquement.",
  },
];

function Benefits() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-16"
        >
          <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold text-white">
            Pourquoi choisir Colossence ?
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-4 text-gray-400 text-lg max-w-2xl mx-auto">
            Un secrétariat intelligent conçu spécialement pour les artisans du dépannage.
          </motion.p>
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-3 gap-8"
        >
          {benefits.map((benefit) => (
            <motion.div
              key={benefit.title}
              variants={fadeUp}
              className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 hover:border-blue-500/50 transition-colors"
            >
              <div className="w-14 h-14 rounded-xl bg-blue-600/20 flex items-center justify-center mb-6">
                <benefit.icon className="w-7 h-7 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">{benefit.title}</h3>
              <p className="text-gray-400">{benefit.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ─── Métiers ─────────────────────────────────────────────────────────────────

const metiers = [
  { icon: Wrench, label: "Serrurier" },
  { icon: Droplets, label: "Plombier" },
  { icon: Zap, label: "Électricien" },
  { icon: Car, label: "Garage" },
  { icon: Flame, label: "Chauffagiste" },
];

function Metiers() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900/30">
      <div className="max-w-6xl mx-auto">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-16"
        >
          <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold text-white">
            Pour tous les métiers du dépannage
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-4 text-gray-400 text-lg">
            Une solution adaptée à votre activité.
          </motion.p>
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6"
        >
          {metiers.map((metier) => (
            <motion.div
              key={metier.label}
              variants={fadeUp}
              className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 text-center hover:border-blue-500/50 hover:bg-gray-800/50 transition-all group"
            >
              <div className="w-16 h-16 rounded-full bg-blue-600/20 flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-600/30 transition-colors">
                <metier.icon className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-white font-semibold">{metier.label}</h3>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ─── Comment ça marche ───────────────────────────────────────────────────────

const steps = [
  {
    step: "1",
    title: "Inscrivez-vous",
    description: "Créez votre compte en 2 minutes et configurez votre secrétariat IA selon votre métier.",
  },
  {
    step: "2",
    title: "Configurez votre IA",
    description:
      "Définissez vos horaires, tarifs et consignes. L'IA s'adapte à votre façon de travailler.",
  },
  {
    step: "3",
    title: "Recevez vos clients",
    description:
      "Votre secrétaire IA prend les appels, planifie les RDV et vous notifie en temps réel.",
  },
];

function HowItWorks() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-16"
        >
          <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold text-white">
            Comment ça marche ?
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-4 text-gray-400 text-lg">
            Opérationnel en 3 étapes simples.
          </motion.p>
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-3 gap-8"
        >
          {steps.map((item) => (
            <motion.div key={item.step} variants={fadeUp} className="text-center">
              <div className="w-14 h-14 rounded-full bg-blue-600 text-white text-xl font-bold flex items-center justify-center mx-auto mb-6">
                {item.step}
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
              <p className="text-gray-400">{item.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ─── Tarification ────────────────────────────────────────────────────────────

function Pricing() {
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
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900/30" id="tarifs">
      <div className="max-w-4xl mx-auto">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-16"
        >
          <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold text-white">
            Tarifs simples et transparents
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-4 text-gray-400 text-lg max-w-2xl mx-auto">
            Profitez d&apos;un mois d&apos;essai gratuit. 50€ de frais de mise en ligne (unique).
          </motion.p>
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-2 gap-8"
        >
          {/* Mensuel */}
          <motion.div
            variants={fadeUp}
            className="bg-gray-900/60 border border-gray-800 rounded-2xl p-8 flex flex-col"
          >
            <h3 className="text-2xl font-bold text-white">Mensuel</h3>
            <p className="text-gray-400 mt-1">Flexibilité maximale</p>
            <div className="mt-6 mb-6">
              <span className="text-5xl font-bold text-white">250€</span>
              <span className="text-gray-400 text-lg">/mois</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {["1er mois offert", "Sans engagement", "Secrétariat IA complet", "Support prioritaire"].map(
                (item) => (
                  <li key={item} className="flex items-center text-gray-300">
                    <svg className="w-5 h-5 text-blue-400 mr-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {item}
                  </li>
                )
              )}
            </ul>
            <button
              onClick={() => handleCheckout("MENSUEL")}
              disabled={loading !== null}
              className="w-full py-3 px-6 rounded-xl font-semibold text-white bg-gray-800 hover:bg-gray-700 border border-gray-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading === "MENSUEL" ? "Redirection..." : "Choisir le mensuel"}
            </button>
          </motion.div>

          {/* Annuel */}
          <motion.div
            variants={fadeUp}
            className="relative bg-gray-900/60 border-2 border-blue-500 rounded-2xl p-8 flex flex-col"
          >
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="bg-blue-600 text-white text-sm font-semibold px-4 py-1 rounded-full">
                Économisez 1000€/an
              </span>
            </div>
            <h3 className="text-2xl font-bold text-white">Annuel</h3>
            <p className="text-gray-400 mt-1">Meilleur rapport qualité-prix</p>
            <div className="mt-6 mb-6">
              <span className="text-5xl font-bold text-white">2000€</span>
              <span className="text-gray-400 text-lg">/an</span>
              <p className="text-sm text-gray-500 mt-1">soit ~167€/mois</p>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {["1er mois offert", "Économie de 1000€/an", "Secrétariat IA complet", "Support prioritaire"].map(
                (item) => (
                  <li key={item} className="flex items-center text-gray-300">
                    <svg className="w-5 h-5 text-blue-400 mr-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {item}
                  </li>
                )
              )}
            </ul>
            <button
              onClick={() => handleCheckout("ANNUEL")}
              disabled={loading !== null}
              className="w-full py-3 px-6 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors disabled:opacity-50 cursor-pointer shadow-lg shadow-blue-600/25"
            >
              {loading === "ANNUEL" ? "Redirection..." : "Choisir l'annuel"}
            </button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────

const faqs = [
  {
    question: "Comment fonctionne le mois d'essai gratuit ?",
    answer:
      "Vous vous inscrivez, configurez votre secrétariat IA et profitez de 30 jours gratuits. Seuls les frais de mise en ligne (50€) sont facturés à l'inscription. Aucun prélèvement d'abonnement pendant l'essai.",
  },
  {
    question: "L'IA peut-elle gérer des urgences ?",
    answer:
      "Oui ! L'IA identifie les urgences et peut transférer l'appel directement sur votre téléphone ou planifier une intervention rapide selon vos consignes.",
  },
  {
    question: "Puis-je personnaliser les réponses de l'IA ?",
    answer:
      "Absolument. Vous définissez le message d'accueil, les consignes de prise de RDV, vos horaires et vos tarifs. L'IA s'adapte à votre façon de travailler.",
  },
  {
    question: "Comment l'IA gère-t-elle mon planning ?",
    answer:
      "L'IA connaît vos disponibilités et propose des créneaux adaptés à vos clients. Vous recevez une notification à chaque nouveau rendez-vous.",
  },
  {
    question: "Puis-je annuler à tout moment ?",
    answer:
      "Oui, avec la formule mensuelle vous êtes sans engagement. Vous pouvez résilier à tout moment depuis votre espace client.",
  },
  {
    question: "Mes données sont-elles sécurisées ?",
    answer:
      "Toutes vos données sont hébergées en France et protégées conformément au RGPD. Nous ne revendons jamais vos informations.",
  },
];

function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-16"
        >
          <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold text-white">
            Questions fréquentes
          </motion.h2>
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="space-y-4"
        >
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              variants={fadeUp}
              className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-5 text-left cursor-pointer"
              >
                <span className="text-white font-medium pr-4">{faq.question}</span>
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 shrink-0 transition-transform ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                />
              </button>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-5 text-gray-400">{faq.answer}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ─── Footer ──────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t border-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <h4 className="text-white font-bold text-lg mb-4">Colossence</h4>
            <p className="text-gray-400 text-sm">
              Secrétariat IA pour artisans du dépannage. Ne perdez plus jamais un client.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Navigation</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Accueil
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Tarifs
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Connexion
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Légal</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/mentions-legales" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Mentions légales
                </Link>
              </li>
              <li>
                <Link href="/cgv" className="text-gray-400 hover:text-white text-sm transition-colors">
                  CGV
                </Link>
              </li>
              <li>
                <Link href="/confidentialite" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Politique de confidentialité
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Contact</h4>
            <ul className="space-y-2">
              <li className="text-gray-400 text-sm">contact@colossence.com</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800 text-center">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} Colossence. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}

// ─── Page principale ─────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-950">
      <Header />
      <main>
        <Hero />
        <Benefits />
        <Metiers />
        <HowItWorks />
        <Pricing />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
