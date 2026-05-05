import { LandingHeader } from '@/components/landing/LandingHeader';
import { HeroSection } from '@/components/landing/HeroSection';
import { InstitutionalCards } from '@/components/landing/InstitutionalCards';
import { StatsSection } from '@/components/landing/StatsSection';
import { ResourcesSection } from '@/components/landing/ResourcesSection';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { LandingFooter } from '@/components/landing/LandingFooter';
import BookCarousel from '@/components/landing/BookCarousel';
import InspirationSection from '@/components/landing/InspirationSection';

export default function HomePage() {
  return (
    <>
      {/* Header Fixo */}
      <LandingHeader />

      {/* Hero Section */}
      <HeroSection />

      {/* Cards Institucionais */}
      <InstitutionalCards />

      {/* Seção Inspiracional com Ilustrações */}
      <InspirationSection />

      {/* Novos Livros - Carrossel */}
      <BookCarousel
        title="Novos Livros"
        subtitle="Confira os lançamentos mais recentes da nossa biblioteca"
        apiEndpoint="/livros-novos"
        limit={12}
      />

      {/* Seção de Estatísticas Animadas */}
      <StatsSection />

      {/* Seção de Recursos com Tabs */}
      <ResourcesSection />

      {/* Todos os Livros - Carrossel */}
      <BookCarousel
        title="Acervo Disponível"
        subtitle="Explore nossa coleção completa de livros acadêmicos"
        apiEndpoint="/livros"
        limit={16}
      />

      {/* Seção de Depoimentos */}
      <TestimonialsSection />

      {/* Footer Completo */}
      <LandingFooter />
    </>
  );
}