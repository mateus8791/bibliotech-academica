import { InstitutionalCards } from '@/components/landing/InstitutionalCards';

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section (você pode adicionar depois) */}
      <section className="h-screen bg-gradient-to-br from-blue-600 to-blue-800 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-6xl font-bold mb-4">Bem-vindo ao Bibliotech</h1>
          <p className="text-xl mb-8">Sua biblioteca digital completa</p>
          <button className="px-8 py-4 bg-white text-blue-600 rounded-full font-bold text-lg hover:bg-gray-100 transition-colors">
            Começar Agora
          </button>
        </div>
      </section>

      {/* Cards Institucionais */}
      <InstitutionalCards />

      {/* Outras seções... */}
    </main>
  );
}