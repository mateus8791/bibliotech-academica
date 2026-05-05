// Arquivo: frontend/src/app/dashboard/emprestimos/components/EmprestimosChart.tsx
'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';

interface ChartData {
  name: string;
  Empréstimos: number;
}

export const EmprestimosChart = ({ data }: { data: ChartData[] }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 100, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" allowDecimals={false} />
        <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} interval={0} />
        <Tooltip cursor={{ fill: '#f3f4f6' }} />
        <Legend />
        <Bar dataKey="Empréstimos" fill="#3b82f6" />
      </BarChart>
    </ResponsiveContainer>
  );
};