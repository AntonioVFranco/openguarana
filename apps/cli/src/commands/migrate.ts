import type { Command } from 'commander'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { parse, stringify } from 'yaml'

export function registerMigrateCommand(program: Command): void {
  program
    .command('migrate')
    .description('Migrate from openclaw.config.yaml to guarana.config.yaml')
    .action(() => {
      if (!existsSync('openclaw.config.yaml')) {
        process.stdout.write('No openclaw.config.yaml found. Nothing to migrate.\n')
        return
      }

      if (existsSync('guarana.config.yaml')) {
        process.stderr.write('guarana.config.yaml already exists. Remove it first.\n')
        process.exit(1)
      }

      const raw    = readFileSync('openclaw.config.yaml', 'utf-8')
      const parsed = parse(raw) as Record<string, unknown>

      const guaranaConfig = {
        ...parsed,
        memory: {
          diary:            true,
          graph:            false,
          extract_entities: true,
          ...(parsed['memory'] as Record<string, unknown> ?? {}),
        },
        professional: {
          enabled: false,
          ...(parsed['professional'] as Record<string, unknown> ?? {}),
        },
      }

      writeFileSync('guarana.config.yaml', stringify(guaranaConfig))
      process.stdout.write('Migration complete: guarana.config.yaml created.\n')
      process.stdout.write('Your openclaw.config.yaml is unchanged.\n')
    })
}
