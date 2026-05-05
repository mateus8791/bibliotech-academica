import { LandingHeader } from '@/components/landing/LandingHeader';
import { FAQSection } from '@/components/landing/FAQSection';
import { LandingFooter } from '@/components/landing/LandingFooter';

export const metadata = {
  title: 'Perguntas Frequentes - Biblioteca Virtual',
  description: 'Tire suas dúvidas sobre a plataforma, recursos técnicos e modelo de contratação da Biblioteca Virtual.',
};

export default function FAQPage() {
  return (
    <>
      {/* Header */}
      <LandingHeader />

      {/* FAQ Section */}
      <FAQSection />

      {/* Footer */}
      <LandingFooter />
    </>
  );
}
