export const detectBottlenecks = (tasks: any[]) => {
  const bottlenecks = [];
  // Detect tasks stuck in 'active' for too long, or many active tasks
  const activeTasks = tasks.filter(t => t.status === 'active');
  if (activeTasks.length > 5) {
      bottlenecks.push({
          type: 'bottleneck',
          title: 'Zatory w Dostawach',
          message: `Wykryto ${activeTasks.length} aktywnych zadań. Może to spowalniać przepływ.`
      });
  }
  return bottlenecks;
};
