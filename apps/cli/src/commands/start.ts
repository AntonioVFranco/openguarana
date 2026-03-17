import type { Command } from 'commander'
import { readFileSync, existsSync } from 'node:fs'
import { loadConfig, createGateway } from '@openguarana/core'

const DEFAULT_CONFIG_PATH = 'guarana.config.yaml'

export function registerStartCommand(program: Command): void {
  program
    .command('start')
    .description('Start the OpenGuarana gateway')
    .option('-c, --config <path>', 'config file path', DEFAULT_CONFIG_PATH)
    .action(async (opts: { config: string }) => {
      const configPath = opts.config
      if (!existsSync(configPath)) {
        process.stderr.write(`Config file not found: ${configPath}\n`)
        process.stderr.write('Run: guarana migrate  (if migrating from OpenClaw)\n')
        process.stderr.write('  or create guarana.config.yaml manually.\n')
        process.exit(1)
      }

      const yaml    = readFileSync(configPath, 'utf-8')
      const config  = loadConfig(yaml)
      const gateway = createGateway(config)

      process.on('SIGINT',  () => { void gateway.stop().then(() => process.exit(0)) })
      process.on('SIGTERM', () => { void gateway.stop().then(() => process.exit(0)) })

      await gateway.start()
    })
}
