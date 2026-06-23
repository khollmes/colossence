import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de confidentialité — Colossence",
};

export default function ConfidentialitePage() {
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
          Politique de confidentialité
        </h1>

        <div className="space-y-10 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">1. Responsable du traitement</h2>
            <p>
              La société Colossence, [FORME JURIDIQUE] immatriculée sous le numéro SIRET [SIRET],
              dont le siège social est situé au [ADRESSE], est responsable du traitement de vos données
              personnelles collectées via le site colossence.com.
            </p>
            <p className="mt-3">
              Contact DPO / responsable de la protection des données : contact@colossence.com
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">2. Données collectées</h2>
            <p>Nous collectons les données suivantes :</p>
            <ul className="mt-3 ml-5 space-y-2 list-disc">
              <li>
                <strong className="text-white">Données d&apos;identification :</strong> nom, prénom, adresse email,
                numéro de téléphone, nom de l&apos;entreprise ;
              </li>
              <li>
                <strong className="text-white">Données de paiement :</strong> gérées exclusivement par Stripe ;
                Colossence ne conserve aucune donnée bancaire ;
              </li>
              <li>
                <strong className="text-white">Données d&apos;usage :</strong> journaux de connexion, adresse IP,
                type de navigateur ;
              </li>
              <li>
                <strong className="text-white">Données métier :</strong> informations de configuration du secrétariat
                IA (disponibilités, consignes, etc.) ;
              </li>
              <li>
                <strong className="text-white">Données d&apos;appels :</strong> enregistrements audio et
                transcriptions des appels traités par l&apos;IA, avec le consentement des appelants.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">3. Finalités du traitement</h2>
            <p>Vos données sont traitées pour les finalités suivantes :</p>
            <ul className="mt-3 ml-5 space-y-2 list-disc">
              <li>Création et gestion de votre compte client ;</li>
              <li>Fourniture et amélioration du service de secrétariat IA ;</li>
              <li>Facturation et gestion des paiements ;</li>
              <li>Envoi de notifications liées au service (nouveaux appels, rendez-vous) ;</li>
              <li>Support client et traitement de vos demandes ;</li>
              <li>Respect de nos obligations légales et réglementaires ;</li>
              <li>Envoi d&apos;informations commerciales (avec votre consentement).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">4. Base légale</h2>
            <ul className="mt-2 ml-5 space-y-2 list-disc">
              <li>
                <strong className="text-white">Exécution du contrat :</strong> traitement nécessaire à la fourniture
                du service souscrit.
              </li>
              <li>
                <strong className="text-white">Obligation légale :</strong> conservation des données de facturation
                (10 ans).
              </li>
              <li>
                <strong className="text-white">Intérêt légitime :</strong> amélioration du service, sécurité.
              </li>
              <li>
                <strong className="text-white">Consentement :</strong> communications marketing.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">5. Durée de conservation</h2>
            <ul className="mt-2 ml-5 space-y-2 list-disc">
              <li>Données de compte : durée de la relation contractuelle + 3 ans ;</li>
              <li>Données de facturation : 10 ans (obligation légale) ;</li>
              <li>Journaux de connexion : 12 mois ;</li>
              <li>Enregistrements d&apos;appels : 30 jours glissants ;</li>
              <li>Données marketing : 3 ans après le dernier contact.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">6. Destinataires des données</h2>
            <p>Vos données peuvent être partagées avec :</p>
            <ul className="mt-3 ml-5 space-y-2 list-disc">
              <li>
                <strong className="text-white">Stripe</strong> — traitement sécurisé des paiements ;
              </li>
              <li>
                <strong className="text-white">Vercel</strong> — hébergement de l&apos;application ;
              </li>
              <li>
                <strong className="text-white">Fournisseurs IA</strong> — traitement des appels et transcriptions ;
              </li>
              <li>
                <strong className="text-white">Autorités compétentes</strong> — en cas d&apos;obligation légale.
              </li>
            </ul>
            <p className="mt-3">
              Vos données ne sont jamais revendues à des tiers à des fins commerciales.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">7. Transferts hors UE</h2>
            <p>
              Certains sous-traitants (Stripe, Vercel) peuvent traiter des données hors de l&apos;Union européenne.
              Ces transferts sont encadrés par des garanties appropriées (clauses contractuelles types de la
              Commission européenne, décisions d&apos;adéquation).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">8. Vos droits</h2>
            <p>Conformément au RGPD (Règlement UE 2016/679), vous disposez des droits suivants :</p>
            <ul className="mt-3 ml-5 space-y-2 list-disc">
              <li><strong className="text-white">Droit d&apos;accès :</strong> obtenir une copie de vos données ;</li>
              <li><strong className="text-white">Droit de rectification :</strong> corriger des données inexactes ;</li>
              <li><strong className="text-white">Droit à l&apos;effacement :</strong> demander la suppression de vos données ;</li>
              <li><strong className="text-white">Droit à la limitation :</strong> limiter le traitement de vos données ;</li>
              <li><strong className="text-white">Droit à la portabilité :</strong> récupérer vos données dans un format structuré ;</li>
              <li><strong className="text-white">Droit d&apos;opposition :</strong> vous opposer à certains traitements ;</li>
              <li>
                <strong className="text-white">Droit de retirer votre consentement</strong> à tout moment pour
                les traitements basés sur celui-ci.
              </li>
            </ul>
            <p className="mt-4">
              Pour exercer ces droits, contactez-nous à{" "}
              <a href="mailto:contact@colossence.com" className="text-blue-400 hover:text-blue-300 underline">
                contact@colossence.com
              </a>
              . Vous disposez également du droit d&apos;introduire une réclamation auprès de la{" "}
              <strong className="text-white">CNIL</strong> (Commission Nationale de l&apos;Informatique et des Libertés,
              www.cnil.fr).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">9. Cookies</h2>
            <p>
              Le site utilise des cookies strictement nécessaires au fonctionnement du service (session
              d&apos;authentification, sécurité). Aucun cookie publicitaire ou de tracking tiers n&apos;est
              déposé sans votre consentement.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">10. Sécurité</h2>
            <p>
              Colossence met en œuvre des mesures techniques et organisationnelles adaptées pour protéger
              vos données contre l&apos;accès non autorisé, la perte ou la destruction : chiffrement des données
              en transit (TLS), chiffrement au repos, contrôle d&apos;accès strict, journalisation des accès.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">11. Modification de la politique</h2>
            <p>
              La présente politique peut être mise à jour. En cas de modification substantielle, nous vous
              informerons par email. La date de dernière mise à jour est indiquée en bas de page.
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
