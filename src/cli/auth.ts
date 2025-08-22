import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { setApiKey, getApiKey, clearApiKey, listKeys } from '../llm/keys.js';

export function registerAuthCommands(program: Command) {
  const auth = program.command('auth').description('Manage provider API credentials for Snow-Flow');

  auth
    .command('login')
    .description('Interactive login to store API keys for a provider')
    .option('--provider <provider>', 'Provider id (openai|google|openrouter|openai-compatible|ollama)')
    .action(async (opts) => {
      const p = opts.provider || (await inquirer.prompt([{ name: 'provider', message: 'Provider', type: 'list', choices: ['openai','google','openrouter','openai-compatible','ollama'] }])).provider;
      const existing = getApiKey(p);
      const { apiKey } = await inquirer.prompt([{ name: 'apiKey', message: `API key for ${p}${existing ? ' (leave blank to keep existing)' : ''}`, type: 'password', mask: '*' }]);
      if (!apiKey && existing) {
        console.log(chalk.yellow('Keeping existing key.'));
        return;
      }
      if (!apiKey) {
        console.error(chalk.red('No key entered. Aborting.'));
        process.exit(1);
      }
      setApiKey(p, apiKey);
      console.log(chalk.green(`Saved API key for ${p}.`));
    });

  auth
    .command('set-key')
    .description('Set API key non-interactively')
    .requiredOption('--provider <provider>', 'Provider id')
    .requiredOption('--api-key <key>', 'API key value')
    .action((opts) => {
      setApiKey(opts.provider, opts.apiKey);
      console.log(chalk.green(`Saved API key for ${opts.provider}.`));
    });

  auth
    .command('show')
    .description('Show configured providers (keys partially masked)')
    .action(() => {
      const entries = listKeys();
      for (const [p, v] of Object.entries(entries)) {
        const mask = v ? `${v.substring(0,4)}…${v.substring(v.length-4)}` : '—';
        console.log(`${p.padEnd(18)} ${mask}`);
      }
    });

  auth
    .command('clear')
    .description('Clear a stored API key')
    .requiredOption('--provider <provider>', 'Provider id')
    .action((opts) => {
      clearApiKey(opts.provider);
      console.log(chalk.yellow(`Cleared API key for ${opts.provider}.`));
    });
}

