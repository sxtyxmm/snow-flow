/**
 * Tests for Dependency Detector
 */

import { DependencyDetector } from '../src/utils/dependency-detector';

describe('DependencyDetector', () => {
  describe('detectDependencies', () => {
    it('should detect Chart.js usage', () => {
      const code = `
        const ctx = document.getElementById('myChart');
        const myChart = new Chart(ctx, {
          type: 'bar',
          data: chartData
        });
      `;
      
      const deps = DependencyDetector.detectDependencies(code);
      expect(deps).toHaveLength(1);
      expect(deps[0].name).toBe('Chart.js');
    });

    it('should detect moment.js usage', () => {
      const code = `
        const now = moment();
        const formatted = moment().format('YYYY-MM-DD');
      `;
      
      const deps = DependencyDetector.detectDependencies(code);
      expect(deps).toHaveLength(1);
      expect(deps[0].name).toBe('moment.js');
    });

    it('should detect multiple dependencies', () => {
      const code = `
        const chart = new Chart(ctx, config);
        const date = moment().format();
        const result = _.map(data, transform);
      `;
      
      const deps = DependencyDetector.detectDependencies(code);
      expect(deps).toHaveLength(3);
      expect(deps.map(d => d.name)).toContain('Chart.js');
      expect(deps.map(d => d.name)).toContain('moment.js');
      expect(deps.map(d => d.name)).toContain('lodash');
    });

    it('should detect jQuery usage', () => {
      const code = `
        $(document).ready(function() {
          $('#myButton').click(handleClick);
          $.ajax({url: '/api/data'});
        });
      `;
      
      const deps = DependencyDetector.detectDependencies(code);
      expect(deps).toHaveLength(1);
      expect(deps[0].name).toBe('jQuery');
    });

    it('should detect Bootstrap CSS classes', () => {
      const html = `
        <div class="container">
          <button class="btn btn-primary">Click me</button>
          <div class="modal fade">Modal content</div>
        </div>
      `;
      
      const deps = DependencyDetector.detectDependencies(html);
      const bootstrapDeps = deps.filter(d => d.name.includes('Bootstrap'));
      expect(bootstrapDeps.length).toBeGreaterThan(0);
    });

    it('should not detect dependencies in comments', () => {
      const code = `
        // This is a comment about Chart.js
        /* Another comment mentioning moment() */
        const data = processData();
      `;
      
      const deps = DependencyDetector.detectDependencies(code);
      expect(deps).toHaveLength(0);
    });
  });

  describe('analyzeWidget', () => {
    it('should analyze all widget components', () => {
      const widget = {
        template: '<canvas id="chart"></canvas>',
        client_script: 'new Chart(ctx, config);',
        server_script: 'const data = [];',
        css: '.chart-container { width: 100%; }'
      };
      
      const deps = DependencyDetector.analyzeWidget(widget);
      expect(deps).toHaveLength(1);
      expect(deps[0].name).toBe('Chart.js');
    });

    it('should handle missing widget components', () => {
      const widget = {
        template: '<div>Simple widget</div>'
      };
      
      const deps = DependencyDetector.analyzeWidget(widget);
      expect(deps).toHaveLength(0);
    });
  });

  describe('generateScriptTags', () => {
    it('should generate script tags for JS dependencies', () => {
      const deps = DependencyDetector.detectDependencies('new Chart()');
      const tags = DependencyDetector.generateScriptTags(deps);
      
      expect(tags).toContain('<script src="');
      expect(tags).toContain('chart.js');
      expect(tags).toContain('</script>');
    });

    it('should use minified URLs when available', () => {
      const deps = DependencyDetector.detectDependencies('new Chart()');
      const tags = DependencyDetector.generateScriptTags(deps, true);
      
      expect(tags).toContain('.min.js');
    });

    it('should generate link tags for CSS dependencies', () => {
      const deps = DependencyDetector.detectDependencies('<div class="container btn-primary"></div>');
      const cssDeps = deps.filter(d => d.type === 'css');
      
      if (cssDeps.length > 0) {
        const tags = DependencyDetector.generateScriptTags(cssDeps);
        expect(tags).toContain('<link rel="stylesheet"');
        expect(tags).toContain('bootstrap');
      }
    });

    it('should include integrity attributes when available', () => {
      const deps = DependencyDetector.detectDependencies('$(document).ready()');
      const tags = DependencyDetector.generateScriptTags(deps);
      
      if (deps[0].integrity) {
        expect(tags).toContain('integrity=');
        expect(tags).toContain('crossorigin="anonymous"');
      }
    });
  });

  describe('isDependencyLoaded', () => {
    it('should detect if dependency is already loaded', () => {
      const themeContent = `
        <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
        <script src="/scripts/custom.js"></script>
      `;
      
      const chartDep = DependencyDetector.detectDependencies('new Chart()')[0];
      const isLoaded = DependencyDetector.isDependencyLoaded(themeContent, chartDep);
      
      expect(isLoaded).toBe(true);
    });

    it('should detect dependency by name', () => {
      const themeContent = `
        <!-- Chart.js library -->
        <script src="/vendor/Chart.js"></script>
      `;
      
      const chartDep = DependencyDetector.detectDependencies('new Chart()')[0];
      const isLoaded = DependencyDetector.isDependencyLoaded(themeContent, chartDep);
      
      expect(isLoaded).toBe(true);
    });

    it('should return false if dependency not loaded', () => {
      const themeContent = `
        <script src="/scripts/app.js"></script>
      `;
      
      const chartDep = DependencyDetector.detectDependencies('new Chart()')[0];
      const isLoaded = DependencyDetector.isDependencyLoaded(themeContent, chartDep);
      
      expect(isLoaded).toBe(false);
    });
  });

  describe('getMissingDependencies', () => {
    it('should return only missing dependencies', () => {
      const themeContent = `
        <script src="https://cdn.jsdelivr.net/npm/moment@2.29.4/moment.min.js"></script>
      `;
      
      const code = `
        new Chart(ctx);
        moment().format();
        _.map(data);
      `;
      
      const allDeps = DependencyDetector.detectDependencies(code);
      const missingDeps = DependencyDetector.getMissingDependencies(allDeps, themeContent);
      
      expect(missingDeps.map(d => d.name)).toContain('Chart.js');
      expect(missingDeps.map(d => d.name)).toContain('lodash');
      expect(missingDeps.map(d => d.name)).not.toContain('moment.js');
    });

    it('should return empty array if all dependencies loaded', () => {
      const themeContent = `
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/moment"></script>
      `;
      
      const code = `
        new Chart(ctx);
        moment().format();
      `;
      
      const allDeps = DependencyDetector.detectDependencies(code);
      const missingDeps = DependencyDetector.getMissingDependencies(allDeps, themeContent);
      
      expect(missingDeps).toHaveLength(0);
    });
  });
});