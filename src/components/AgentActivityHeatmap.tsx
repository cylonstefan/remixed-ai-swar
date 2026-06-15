import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const data = [
  { day: 'Pn', hour: 8, activity: 20 },
  { day: 'Pn', hour: 12, activity: 50 },
  { day: 'Wt', hour: 9, activity: 30 },
  { day: 'Sr', hour: 14, activity: 80 },
  { day: 'Czw', hour: 11, activity: 40 },
  { day: 'Pt', hour: 10, activity: 60 },
  { day: 'Sb', hour: 15, activity: 10 },
];

export const AgentActivityHeatmap = () => {
    const days = ['Pn', 'Wt', 'Sr', 'Czw', 'Pt', 'Sb', 'Nd'];
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
        <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
            <h3 className="text-white font-bold mb-4">Aktywność Agentów (Heatmap)</h3>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <XAxis type="category" dataKey="day" name="Dzień" />
                        <YAxis type="number" dataKey="hour" name="Godzina" domain={[0, 23]} />
                        <ZAxis type="number" dataKey="activity" range={[50, 400]} />
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                        <Scatter name="Aktywność" data={data} fill="#8884d8">
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.activity > 50 ? '#06b6d4' : '#64748b'} />
                            ))}
                        </Scatter>
                    </ScatterChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
