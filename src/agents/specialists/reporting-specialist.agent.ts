/**
 * Reporting Specialist Agent - Handles reports, dashboards, and analytics
 */

import { BaseSnowAgent, AgentCapabilities } from '../base/base-snow-agent.js';
import { Task } from '../../types/snow-flow.types.js';

export interface ReportingRequirements {
  reportType: 'list' | 'chart' | 'dashboard' | 'kpi';
  dataSource: string;
  fields: string[];
  filters: ReportFilter[];
  grouping?: string[];
  aggregations?: ReportAggregation[];
  visualization?: VisualizationConfig;
  scheduling?: ScheduleConfig;
}

export interface ReportFilter {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: string;
}

export interface ReportAggregation {
  field: string;
  function: 'count' | 'sum' | 'average' | 'min' | 'max';
  alias?: string;
}

export interface VisualizationConfig {
  chartType: 'bar' | 'line' | 'pie' | 'donut' | 'scatter' | 'gauge';
  colors?: string[];
  title: string;
  xAxis?: string;
  yAxis?: string;
}

export interface ScheduleConfig {
  frequency: 'daily' | 'weekly' | 'monthly';
  recipients: string[];
  format: 'pdf' | 'excel' | 'csv';
}

export class ReportingSpecialistAgent extends BaseSnowAgent {
  constructor() {
    const capabilities: AgentCapabilities = {
      primarySkills: [
        'report_creation',
        'dashboard_design',
        'data_visualization',
        'analytics_setup',
        'kpi_tracking'
      ],
      secondarySkills: [
        'data_analysis',
        'performance_metrics',
        'automated_reporting',
        'chart_configuration'
      ],
      complexity: 'medium',
      autonomy: 'semi-autonomous'
    };

    super('reporting-specialist', 'ReportingSpecialist', capabilities);
  }

  async execute(task: Task, input?: any): Promise<any> {
    await this.startTask(task);
    
    try {
      const taskType = task.metadata?.type || 'report_analysis';
      let result;
      
      switch (taskType) {
        case 'report_creation':
          result = await this.createReport(input?.requirements || {});
          break;
        case 'dashboard_creation':
          result = await this.createDashboard(input?.config || {});
          break;
        case 'kpi_setup':
          result = await this.setupKPI(input?.metrics || {});
          break;
        default:
          result = await this.analyzeReportingRequirements(task.description, input);
      }
      
      await this.completeTask(result);
      return result;
      
    } catch (error) {
      await this.handleError(error as Error);
      throw error;
    }
  }

  async analyzeReportingRequirements(description: string, context?: any): Promise<ReportingRequirements> {
    const normalizedDesc = description.toLowerCase();
    
    return {
      reportType: this.determineReportType(normalizedDesc),
      dataSource: this.identifyDataSource(normalizedDesc),
      fields: this.extractFields(normalizedDesc),
      filters: this.extractFilters(normalizedDesc),
      grouping: this.extractGrouping(normalizedDesc),
      aggregations: this.extractAggregations(normalizedDesc),
      visualization: this.configureVisualization(normalizedDesc),
      scheduling: this.extractScheduling(normalizedDesc)
    };
  }

  async createReport(requirements: ReportingRequirements): Promise<any> {
    return {
      type: 'report',
      name: `auto_report_${Date.now()}`,
      table: requirements.dataSource,
      fields: requirements.fields,
      filters: requirements.filters,
      groupBy: requirements.grouping,
      orderBy: ['sys_created_on DESC'],
      format: 'list',
      sharing: 'public',
      schedule: requirements.scheduling
    };
  }

  async createDashboard(config: any): Promise<any> {
    return {
      type: 'dashboard',
      name: config.name || `auto_dashboard_${Date.now()}`,
      layout: 'grid',
      widgets: [
        {
          type: 'report_widget',
          title: 'Summary Statistics',
          report: config.primaryReport,
          size: 'medium'
        },
        {
          type: 'chart_widget',
          title: 'Trend Analysis',
          chartType: 'line',
          dataSource: config.dataSource,
          size: 'large'
        }
      ],
      filters: config.globalFilters || [],
      refreshInterval: config.refreshInterval || 300000 // 5 minutes
    };
  }

  async setupKPI(metrics: any): Promise<any> {
    return {
      type: 'kpi',
      name: metrics.name || `auto_kpi_${Date.now()}`,
      metric: metrics.metric || 'count',
      table: metrics.table || 'incident',
      condition: metrics.condition || '',
      target: metrics.target || 100,
      thresholds: {
        green: metrics.green || 90,
        yellow: metrics.yellow || 70,
        red: metrics.red || 50
      },
      updateFrequency: metrics.frequency || 'hourly'
    };
  }

  private determineReportType(description: string): 'list' | 'chart' | 'dashboard' | 'kpi' {
    if (description.includes('dashboard')) return 'dashboard';
    if (description.includes('chart') || description.includes('graph')) return 'chart';
    if (description.includes('kpi') || description.includes('metric')) return 'kpi';
    return 'list';
  }

  private identifyDataSource(description: string): string {
    const tableMatches = description.match(/\b(incident|problem|change_request|task|sys_user)\b/);
    return tableMatches ? tableMatches[0] : 'incident';
  }

  private extractFields(description: string): string[] {
    const fields = ['number', 'short_description', 'state', 'priority', 'assigned_to'];
    if (description.includes('date')) fields.push('sys_created_on');
    if (description.includes('category')) fields.push('category');
    return fields;
  }

  private extractFilters(description: string): ReportFilter[] {
    const filters: ReportFilter[] = [];
    if (description.includes('active')) {
      filters.push({ field: 'active', operator: 'equals', value: 'true' });
    }
    if (description.includes('high priority')) {
      filters.push({ field: 'priority', operator: 'equals', value: '1' });
    }
    return filters;
  }

  private extractGrouping(description: string): string[] | undefined {
    if (description.includes('by state')) return ['state'];
    if (description.includes('by priority')) return ['priority'];
    if (description.includes('by category')) return ['category'];
    return undefined;
  }

  private extractAggregations(description: string): ReportAggregation[] | undefined {
    const aggregations: ReportAggregation[] = [];
    if (description.includes('count')) {
      aggregations.push({ field: 'sys_id', function: 'count', alias: 'total_count' });
    }
    return aggregations.length > 0 ? aggregations : undefined;
  }

  private configureVisualization(description: string): VisualizationConfig | undefined {
    if (description.includes('chart') || description.includes('graph')) {
      return {
        chartType: description.includes('pie') ? 'pie' : 'bar',
        title: 'Auto-generated Chart',
        xAxis: 'state',
        yAxis: 'count'
      };
    }
    return undefined;
  }

  private extractScheduling(description: string): ScheduleConfig | undefined {
    if (description.includes('daily') || description.includes('weekly') || description.includes('monthly')) {
      return {
        frequency: description.includes('daily') ? 'daily' : 
                  description.includes('weekly') ? 'weekly' : 'monthly',
        recipients: ['admin@company.com'],
        format: 'pdf'
      };
    }
    return undefined;
  }
}