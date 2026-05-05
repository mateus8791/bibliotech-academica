'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Users, GraduationCap, Library } from 'lucide-react';

interface StatItemProps {
  icon: React.ReactNode;
  value: string;
  label: string;
  suffix?: string;
  delay?: number;
}

function StatItem({ icon, value, label, suffix = '', delay = 0 }: StatItemProps) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Extrai o número do valor (ex: "+17mil" -> 17)
  const targetNumber = parseInt(value.replace(/\D/g, ''), 10);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const duration = 2000; // 2 segundos
    const steps = 60;
    const increment = targetNumber / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      setCount(Math.min(Math.ceil(increment * currentStep), targetNumber));

      if (currentStep >= steps) {
        clearInterval(timer);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [isVisible, targetNumber]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isVisible ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay }}
      className="flex flex-col items-center text-center space-y-3"
    >
      {/* Ícone */}
      <div className="text-cyan-400 mb-2">
        {icon}
      </div>

      {/* Número Animado */}
      <div className="flex items-baseline space-x-1">
        <span className="text-white text-5xl font-bold">
          +{count}
        </span>
        <span className="text-white text-3xl font-bold">
          {suffix}
        </span>
      </div>

      {/* Label */}
      <p className="text-gray-300 text-sm leading-tight max-w-[200px]">
        {label}
      </p>
    </motion.div>
  );
}

export function StatsSection() {
  return (
    <section className="bg-[#0B1F3F] py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          <StatItem
            icon={<BookOpen size={56} strokeWidth={1.5} />}
            value="17"
            suffix="mil"
            label="títulos disponíveis"
            delay={0}
          />

          <StatItem
            icon={<Library size={56} strokeWidth={1.5} />}
            value="40"
            suffix=""
            label="áreas de conhecimento"
            delay={0.1}
          />

          <StatItem
            icon={<Users size={56} strokeWidth={1.5} />}
            value="4"
            suffix="milhões"
            label="de usuários ativos"
            delay={0.2}
          />

          <StatItem
            icon={<GraduationCap size={56} strokeWidth={1.5} />}
            value="560"
            suffix=""
            label="instituições parceiras"
            delay={0.3}
          />
        </div>
      </div>
    </section>
  );
}
