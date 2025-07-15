import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import logger from '../utils/logger';

/**
 * Claude Code Integration Module
 * Handles integration with Claude Code for AI generation without API costs
 */
export class ClaudeCodeIntegration {
  private promptsDir: string;
  private outputsDir: string;
  private sessionDir: string;

  constructor() {
    this.promptsDir = path.join(process.cwd(), '.claude-code', 'prompts');
    this.outputsDir = path.join(process.cwd(), '.claude-code', 'outputs');
    this.sessionDir = path.join(process.cwd(), '.claude-code', 'sessions');
    
    this.ensureDirectories();
  }

  private ensureDirectories(): void {
    [this.promptsDir, this.outputsDir, this.sessionDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Create a prompt file for Claude Code processing
   */
  async createPrompt(promptId: string, prompt: string, context: any = {}): Promise<string> {
    const promptFile = path.join(this.promptsDir, `${promptId}.md`);
    
    const fullPrompt = `# ServiceNow Component Generation

**Prompt ID:** ${promptId}
**Timestamp:** ${new Date().toISOString()}
**Context:** ${JSON.stringify(context, null, 2)}

## Instructions

Please generate the ServiceNow component based on the following requirements.
Return the response as valid JSON that matches the ServiceNow API structure.

## Requirements

${prompt}

## Output Format

Please provide the output as a JSON object. Example:

\`\`\`json
{
  "sys_id": "generated-uuid",
  "name": "component-name",
  "table": "table-name",
  "script": "// Generated script content",
  "description": "Component description",
  "sys_class_name": "sys_script",
  "sys_package": "app-scope",
  "sys_scope": "app-scope"
}
\`\`\`

---

**Next Steps:**
1. Review the requirements above
2. Generate the JSON response
3. Save the output to: \`${this.outputsDir}/${promptId}.json\`

You can also use the interactive mode: \`npm run claude-interactive\`
`;

    fs.writeFileSync(promptFile, fullPrompt);
    logger.info(`Created prompt file: ${promptFile}`);
    
    return promptFile;
  }

  /**
   * Wait for or check if output exists
   */
  async getOutput(promptId: string, timeoutMs: number = 30000): Promise<any> {
    const outputFile = path.join(this.outputsDir, `${promptId}.json`);
    
    // Check if output already exists
    if (fs.existsSync(outputFile)) {
      const output = fs.readFileSync(outputFile, 'utf8');
      try {
        return JSON.parse(output);
      } catch (error) {
        logger.error(`Failed to parse output file: ${outputFile}`, error);
        return null;
      }
    }

    // Wait for output with timeout
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Timeout waiting for output: ${outputFile}`));
      }, timeoutMs);

      const checkForOutput = () => {
        if (fs.existsSync(outputFile)) {
          clearTimeout(timeout);
          try {
            const output = fs.readFileSync(outputFile, 'utf8');
            resolve(JSON.parse(output));
          } catch (error) {
            reject(error);
          }
        } else {
          setTimeout(checkForOutput, 1000);
        }
      };

      checkForOutput();
    });
  }

  /**
   * Start interactive session with Claude Code
   */
  async startInteractiveSession(sessionId: string): Promise<void> {
    const sessionFile = path.join(this.sessionDir, `${sessionId}.json`);
    
    const sessionData = {
      sessionId,
      startTime: new Date().toISOString(),
      promptsDir: this.promptsDir,
      outputsDir: this.outputsDir,
      pendingPrompts: this.getPendingPrompts(),
      instructions: [
        "Welcome to Snow-flow Claude Code Integration!",
        "",
        "Available prompts to process:",
        ...this.getPendingPrompts().map(p => `  - ${p}`),
        "",
        "To process a prompt:",
        "1. Open the prompt file in Claude Code",
        "2. Generate the response",
        "3. Save as JSON to the outputs directory",
        "",
        "Commands:",
        "- npm run claude-process-next : Process next pending prompt",
        "- npm run claude-status : Check session status",
        "- npm run claude-cleanup : Clean up processed files"
      ]
    };

    fs.writeFileSync(sessionFile, JSON.stringify(sessionData, null, 2));
    logger.info(`Interactive session started: ${sessionFile}`);
  }

  /**
   * Get list of pending prompts
   */
  private getPendingPrompts(): string[] {
    const promptFiles = fs.readdirSync(this.promptsDir)
      .filter(f => f.endsWith('.md'))
      .map(f => f.replace('.md', ''));

    const outputFiles = fs.readdirSync(this.outputsDir)
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace('.json', ''));

    return promptFiles.filter(promptId => !outputFiles.includes(promptId));
  }

  /**
   * Process next pending prompt automatically
   */
  async processNextPrompt(): Promise<string | null> {
    const pendingPrompts = this.getPendingPrompts();
    
    if (pendingPrompts.length === 0) {
      logger.info('No pending prompts to process');
      return null;
    }

    const promptId = pendingPrompts[0];
    const promptFile = path.join(this.promptsDir, `${promptId}.md`);
    
    logger.info(`Processing prompt: ${promptId}`);
    
    // In a real implementation, you might:
    // 1. Open the prompt file in Claude Code
    // 2. Use Claude Code's API if available
    // 3. Or provide instructions for manual processing
    
    return promptFile;
  }

  /**
   * Generate status report
   */
  getStatus(): any {
    const pendingPrompts = this.getPendingPrompts();
    const outputFiles = fs.readdirSync(this.outputsDir)
      .filter(f => f.endsWith('.json'));

    return {
      pendingPrompts: pendingPrompts.length,
      completedPrompts: outputFiles.length,
      pendingList: pendingPrompts,
      completedList: outputFiles.map(f => f.replace('.json', '')),
      promptsDir: this.promptsDir,
      outputsDir: this.outputsDir
    };
  }

  /**
   * Clean up processed files
   */
  async cleanup(olderThanDays: number = 7): Promise<void> {
    const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);
    
    // Clean up old prompts with corresponding outputs
    const promptFiles = fs.readdirSync(this.promptsDir);
    const outputFiles = fs.readdirSync(this.outputsDir);
    
    for (const promptFile of promptFiles) {
      const promptPath = path.join(this.promptsDir, promptFile);
      const stats = fs.statSync(promptPath);
      
      if (stats.mtime.getTime() < cutoffTime) {
        const promptId = promptFile.replace('.md', '');
        const outputFile = `${promptId}.json`;
        
        if (outputFiles.includes(outputFile)) {
          // Both prompt and output exist, safe to clean up
          fs.unlinkSync(promptPath);
          fs.unlinkSync(path.join(this.outputsDir, outputFile));
          logger.info(`Cleaned up processed prompt: ${promptId}`);
        }
      }
    }
  }
}

// Export singleton instance
export const claudeCodeIntegration = new ClaudeCodeIntegration();