import PricingPlans from "@/components/PricingPlans";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Nos tarifs</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Choisissez la formule qui vous convient. Profitez d&apos;un premier
            mois offert pour tester notre secrétariat IA.
          </p>
        </div>

        <PricingPlans />
      </div>
    </div>
  );
}
