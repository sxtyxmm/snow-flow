export interface SpecialistOptions {
  sharedMemory?: boolean;
  context?: any;
  outputFormat?: 'json' | 'markdown' | 'code';
}

export abstract class BaseSpecialist {
  protected name: string;
  protected role: string;
  protected expertise: string[];
  protected options: SpecialistOptions;
  
  constructor(name: string, role: string, expertise: string[], options: SpecialistOptions = {}) {
    this.name = name;
    this.role = role;
    this.expertise = expertise;
    this.options = options;
  }
  
  abstract execute(task: string, context?: any): Promise<any>;
  
  protected async logProgress(message: string): Promise<void> {
    console.log(`${this.role} ${this.name}: ${message}`);
  }
  
  protected async analyzeTask(task: string): Promise<any> {
    return {
      task,
      complexity: this.assessComplexity(task),
      estimatedTime: this.estimateTime(task),
      dependencies: this.identifyDependencies(task)
    };
  }
  
  protected assessComplexity(task: string): 'low' | 'medium' | 'high' {
    if (task.length > 200 || task.includes('complex') || task.includes('advanced')) {
      return 'high';
    }
    if (task.length > 100 || task.includes('integrate') || task.includes('optimize')) {
      return 'medium';
    }
    return 'low';
  }
  
  protected estimateTime(task: string): string {
    const complexity = this.assessComplexity(task);
    switch (complexity) {
      case 'high': return '30-60 minutes';
      case 'medium': return '15-30 minutes';
      case 'low': return '5-15 minutes';
    }
  }
  
  protected identifyDependencies(task: string): string[] {
    const dependencies = [];
    
    if (task.includes('database') || task.includes('table')) {
      dependencies.push('database_design');
    }
    if (task.includes('API') || task.includes('integration')) {
      dependencies.push('api_specification');
    }
    if (task.includes('security') || task.includes('permission')) {
      dependencies.push('security_requirements');
    }
    
    return dependencies;
  }
}