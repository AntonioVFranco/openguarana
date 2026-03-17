#!/usr/bin/env node
import { program } from 'commander'
import { registerStartCommand }   from './commands/start.js'
import { registerMigrateCommand } from './commands/migrate.js'

program
  .name('guarana')
  .description('OpenGuarana — a secure, team-native AI assistant')
  .version('0.1.0')

registerStartCommand(program)
registerMigrateCommand(program)

program.parse()
