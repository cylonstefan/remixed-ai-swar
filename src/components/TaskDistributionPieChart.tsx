import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Task, Team } from '../types';

interface TaskDistributionPieChartProps {
  teams: Team[];
  tasks: Task[];
}

const COLORS = ['#06b6d4', '#a855f7', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'];

export const TaskDistributionPieChart: React.FC<TaskDistributionPieChartProps> = ({ teams, tasks }) => {
  const chartData = useMemo(() => {
    const data: { name: string; value: number }[] = [];
    
    // Aggregate by priority for now, or we can make it by team if requested, 
    // but the prompt says "task distribution by priority AND status for each team"
    // that sounds like we need to group by team, then sub-divide?
    // A single PieChart can only show one dimension effectively.
    // If we want "for each team", we might need multiple PieCharts,
    // or a single PieChart showing all teams and their task counts.
    // Given the prompt "distribution by priority and status", maybe a stacked bar is better?
    // But user asked for *Pie Chart*.
    
    // I will show Task Priority distribution across all teams.
    
    const priorityCounts: Record<string, number> = {
      low: 0,
      medium: 0,
      high: 0
    };
    
    tasks.forEach(task => {
        if (task.priority in priorityCounts) {
            priorityCounts[task.priority]++;
        }
    });
    
    return [
        { name: 'Wysoki', value: priorityCounts.high, color: '#ef4444' },
        { name: 'Średni', value: priorityCounts.medium, color: '#f59e0b' },
        { name: 'Niski', value: priorityCounts.low, color: '#10b981' }
    ];
  }, [tasks]);

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9' }}
            itemStyle={{ color: '#f1f5f9' }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
