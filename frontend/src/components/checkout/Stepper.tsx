'use client';

type Step = 'sacola' | 'entrega' | 'pagamento' | 'revisao';

export function Stepper({ active }: { active: Step }) {
  const steps: { key: Step; label: string; icon: string }[] = [
    { key: 'sacola', label: 'Sacola', icon: '🛍️' },
    { key: 'entrega', label: 'Entrega', icon: '🚚' },
    { key: 'pagamento', label: 'Pagamento', icon: '💳' },
    { key: 'revisao', label: 'Revisão', icon: '🧾' },
  ];

  return (
    <div className="flex items-center justify-center gap-8 my-8">
      {steps.map((s, idx) => {
        const isActive = s.key === active;
        const isDone = steps.findIndex(st => st.key === active) > idx;
        return (
          <div key={s.key} className="flex items-center">
            <div className={`flex flex-col items-center`}>
              <div
                className={`w-12 h-12 rounded-full grid place-items-center text-xl
                ${isActive ? 'bg-blue-600 text-white' : isDone ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'}`}
              >
                {s.icon}
              </div>
              <span className={`mt-2 text-sm ${isActive ? 'text-blue-700 font-semibold' : 'text-gray-500'}`}>
                {s.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className="w-14 h-[2px] mx-4 bg-gray-300" />
            )}
          </div>
        );
      })}
    </div>
  );
}
