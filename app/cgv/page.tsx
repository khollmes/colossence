import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conditions Générales de Vente — Colossence",
};

export default function CGVPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-300">
      {/* Header */}
      <header className="border-b border-gray-800 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-white tracking-tight">
            Colossence
          </Link>
          <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors">
            ← Retour à l&apos;accueil
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-10">
          Conditions Générales de Vente
        </h1>

        <div className="space-y-10 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">1. Objet</h2>
            <p>
              Les présentes Conditions Générales de Vente (CGV) régissent les relations contractuelles entre la société
              Colossence (ci-après « le Prestataire ») et tout client professionnel (ci-après « le Client ») qui
              souscrit à l&apos;abonnement au service de secrétariat IA proposé sur le site colossence.com.
            </p>
            <p className="mt-3">
              Toute souscription implique l&apos;acceptation sans réserve des présentes CGV.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">2. Description du service</h2>
            <p>
              Colossence propose un service de secrétariat basé sur l&apos;intelligence artificielle permettant aux
              artisans du dépannage (plombiers, serruriers, électriciens, chauffagistes, etc.) de :
            </p>
            <ul className="mt-3 ml-5 space-y-2 list-disc">
              <li>Recevoir et gérer les appels entrants automatiquement ;</li>
              <li>Prendre des rendez-vous clients selon les disponibilités définies par l&apos;artisan ;</li>
              <li>Recevoir des notifications en temps réel pour chaque nouvelle demande.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">3. Tarification</h2>
            <p>Les offres disponibles sont les suivantes :</p>
            <ul className="mt-3 ml-5 space-y-2 list-disc">
              <li>
                <strong className="text-white">Offre Mensuelle :</strong> 250 € HT/mois, sans engagement, résiliable
                à tout moment.
              </li>
              <li>
                <strong className="text-white">Offre Annuelle :</strong> 2 000 € HT/an (soit environ 167 € HT/mois),
                avec engagement d&apos;un an.
              </li>
            </ul>
            <p className="mt-3">
              Un forfait de mise en service de <strong className="text-white">50 € HT</strong> est facturé une seule
              fois à l&apos;inscription, quel que soit l&apos;abonnement choisi.
            </p>
            <p className="mt-3">
              Les prix sont indiqués en euros hors taxes. La TVA applicable au taux en vigueur est ajoutée lors
              de la facturation.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">4. Période d&apos;essai</h2>
            <p>
              Le premier mois d&apos;abonnement est offert à tout nouveau Client, sous réserve du paiement des frais
              de mise en service de 50 € HT. L&apos;abonnement choisi ne sera débité qu&apos;à l&apos;issue de cette
              période d&apos;essai de 30 jours calendaires, sauf résiliation avant terme.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">5. Modalités de paiement</h2>
            <p>
              Le paiement est effectué en ligne par carte bancaire via la plateforme sécurisée Stripe. Le Client
              autorise le débit automatique de son moyen de paiement à chaque échéance.
            </p>
            <p className="mt-3">
              En cas d&apos;échec de paiement, Colossence se réserve le droit de suspendre l&apos;accès au service
              après mise en demeure restée sans effet pendant 7 jours.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">6. Résiliation</h2>
            <p>
              <strong className="text-white">Offre Mensuelle :</strong> Le Client peut résilier à tout moment depuis
              son espace client. La résiliation prend effet à la fin de la période en cours ; aucun remboursement
              prorata temporis n&apos;est effectué.
            </p>
            <p className="mt-3">
              <strong className="text-white">Offre Annuelle :</strong> En cas de résiliation anticipée, les mensualités
              restantes sont dues dans leur intégralité, sauf manquement grave de la part de Colossence.
            </p>
            <p className="mt-3">
              Colossence peut résilier le contrat en cas de non-paiement, de violation des présentes CGV ou d&apos;usage
              frauduleux du service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">7. Obligations du Client</h2>
            <p>Le Client s&apos;engage à :</p>
            <ul className="mt-3 ml-5 space-y-2 list-disc">
              <li>Fournir des informations exactes lors de l&apos;inscription ;</li>
              <li>Utiliser le service conformément à sa destination et à la législation en vigueur ;</li>
              <li>Ne pas utiliser le service à des fins illicites ou contraires aux bonnes mœurs ;</li>
              <li>Maintenir la confidentialité de ses identifiants de connexion.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">8. Responsabilité</h2>
            <p>
              Colossence met en œuvre tous les moyens raisonnables pour assurer la continuité du service
              (disponibilité cible de 99 %). Toutefois, Colossence ne saurait être tenu responsable des
              interruptions de service dues à des cas de force majeure, des pannes de tiers (opérateurs
              téléphoniques, fournisseurs cloud) ou des maintenances planifiées.
            </p>
            <p className="mt-3">
              La responsabilité de Colossence est limitée au montant des sommes effectivement versées par le Client
              au cours des trois derniers mois.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">9. Protection des données</h2>
            <p>
              Les données traitées dans le cadre du service sont soumises à notre{" "}
              <Link href="/confidentialite" className="text-blue-400 hover:text-blue-300 underline">
                Politique de confidentialité
              </Link>
              . Colossence agit en qualité de sous-traitant pour les données personnelles des clients finaux
              de l&apos;artisan, conformément au RGPD.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">10. Modification des CGV</h2>
            <p>
              Colossence se réserve le droit de modifier les présentes CGV à tout moment. Le Client sera informé
              de toute modification par email avec un préavis de 30 jours. En l&apos;absence d&apos;opposition dans
              ce délai, les nouvelles CGV seront réputées acceptées.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">11. Droit applicable et litiges</h2>
            <p>
              Les présentes CGV sont soumises au droit français. En cas de litige, les parties s&apos;engagent à
              rechercher une solution amiable. À défaut, les tribunaux compétents du ressort du siège social de
              Colossence seront saisis.
            </p>
          </section>
        </div>

        <p className="mt-14 text-sm text-gray-500">Dernière mise à jour : juin 2026</p>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 px-4 mt-8">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Colossence. Tous droits réservés.</p>
          <nav className="flex gap-6">
            <Link href="/mentions-legales" className="hover:text-white transition-colors">Mentions légales</Link>
            <Link href="/cgv" className="hover:text-white transition-colors">CGV</Link>
            <Link href="/confidentialite" className="hover:text-white transition-colors">Confidentialité</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
