import { Generator, getConfig } from '@tanstack/router-generator'
await new Generator({ config: getConfig({ autoCodeSplitting: true }, process.cwd()), root: process.cwd() }).run()
