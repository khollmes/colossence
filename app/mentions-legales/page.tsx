import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentions légales — Colossence",
};

export default function MentionsLegalesPage() {
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
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-10">Mentions légales</h1>

        <div className="space-y-10 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">1. Éditeur du site</h2>
            <p>
              Le site <strong className="text-white">colossence.com</strong> est édité par la société Colossence,
              société par actions simplifiée (SAS) au capital de [MONTANT] €,
              immatriculée au Registre du Commerce et des Sociétés de [VILLE] sous le numéro SIRET [SIRET],
              dont le siège social est situé au [ADRESSE COMPLÈTE].
            </p>
            <p className="mt-3">
              Directeur de la publication : [NOM DU DIRIGEANT]<br />
              Email : contact@colossence.com
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">2. Hébergement</h2>
            <p>
              Le site est hébergé par la société Vercel Inc., dont le siège social est situé au
              340 Pine Street, Suite 701, San Francisco, CA 94104, États-Unis.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">3. Propriété intellectuelle</h2>
            <p>
              L&apos;ensemble des contenus présents sur le site (textes, images, graphismes, logos, icônes, sons,
              logiciels…) est la propriété exclusive de Colossence ou de ses partenaires et est protégé par les lois
              françaises et internationales relatives à la propriété intellectuelle.
            </p>
            <p className="mt-3">
              Toute reproduction, représentation, modification, publication ou adaptation de tout ou partie des éléments
              du site, quel que soit le moyen ou le procédé utilisé, est interdite sans l&apos;autorisation écrite préalable
              de Colossence.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">4. Liens hypertextes</h2>
            <p>
              Le site peut contenir des liens vers d&apos;autres sites Internet. Colossence n&apos;exerce aucun contrôle sur
              ces sites et n&apos;assume aucune responsabilité quant à leur contenu ou leur politique de confidentialité.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">5. Limitation de responsabilité</h2>
            <p>
              Colossence s&apos;efforce de fournir des informations exactes et à jour sur ce site, mais ne peut garantir
              l&apos;exactitude, la complétude ou l&apos;actualité des informations diffusées. Colossence décline toute
              responsabilité pour tout dommage résultant d&apos;une intrusion frauduleuse d&apos;un tiers ou d&apos;une
              indisponibilité du service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">6. Données personnelles</h2>
            <p>
              Pour en savoir plus sur la collecte et le traitement de vos données personnelles, consultez notre{" "}
              <Link href="/confidentialite" className="text-blue-400 hover:text-blue-300 underline">
                Politique de confidentialité
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">7. Droit applicable</h2>
            <p>
              Les présentes mentions légales sont régies par le droit français. En cas de litige, les tribunaux
              français seront seuls compétents.
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
