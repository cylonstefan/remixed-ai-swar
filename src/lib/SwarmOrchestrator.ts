export interface Task {
    id: string;
    description: string;
    complexity: 'low' | 'medium' | 'high';
}

export interface SubTask extends Task {
    parentId: string;
    assignedLLM: string;
}

export const decomposeTask = (task: Task): SubTask[] => {
    // Basic decomposition logic
    if (task.complexity === 'low') return [{ ...task, parentId: task.id, assignedLLM: 'llama3:8b' }];
    
    // Split into smaller chunks based on complexity
    const parts = task.complexity === 'high' ? 3 : 2;
    const llm = task.complexity === 'high' ? 'deepseek-coder' : 'mistral-v0.2';
    
    return Array.from({ length: parts }).map((_, i) => ({
        id: `${task.id}-sub-${i}`,
        description: `Część ${i + 1} zadania: ${task.description}`,
        complexity: 'low',
        parentId: task.id,
        assignedLLM: llm
    }));
};
