/**
 * BLACKOUT Protocol CLI
 *
 * Terminal interface for displaying kill confirmation.
 *
 * Usage:
 *   npx blackout-protocol          - Show status
 *   npx blackout-protocol kill     - Show kill confirmation
 *   npx blackout-protocol --plain  - Force plain text (no ANSI colors)
 *
 * @license MIT
 * @see https://github.com/Blackout-Threat-Intel/blackout-protocol
 */

const VERSION = '1.0.0'

// Check for plain text mode (no ANSI) - for web terminals
const args = process.argv.slice(2)
const forcePlain = args.includes('--plain') || args.includes('-p')
const isTTY = process.stdout.isTTY
const useColors = isTTY && !forcePlain

// =============================================================================
// COLORS
// =============================================================================

const C = {
  reset: useColors ? '\x1b[0m' : '',
  bright: useColors ? '\x1b[1m' : '',
  dim: useColors ? '\x1b[2m' : '',
  lime: useColors ? '\x1b[38;2;204;255;0m' : '',
  magenta: useColors ? '\x1b[38;2;255;0;153m' : '',
  orange: useColors ? '\x1b[38;2;255;107;0m' : '',
  red: useColors ? '\x1b[38;2;255;0;0m' : '',
  green: useColors ? '\x1b[38;2;0;255;0m' : '',
  cyan: useColors ? '\x1b[38;2;0;255;255m' : '',
  white: useColors ? '\x1b[37m' : '',
  gray: useColors ? '\x1b[38;2;136;136;136m' : '',
  darkgray: useColors ? '\x1b[38;2;102;102;102m' : '',
}

// =============================================================================
// HELPERS
// =============================================================================

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const KILL_LIST = [
  'rb2b.com',
  '*.rb2b.com',
  'api.rb2b.com',
  'cdn.rb2b.com',
  'track.rb2b.com',
  'pixel.rb2b.com',
  'events.rb2b.com',
  'data.rb2b.com',
  'collect.rb2b.com',
  'rb2b.io',
  '*.rb2b.io',
  'rb2b.net',
  '*.rb2b.net',
  'ddwl4m2hdecbv.cloudfront.net',
]

// =============================================================================
// CLI COMMANDS
// =============================================================================

function printStatus(): void {
  console.log()
  console.log(`${C.lime}${C.bright}  BLACKOUT${C.reset} ${C.dim}v${VERSION}${C.reset}`)
  console.log()
  console.log(`${C.cyan}  Status:${C.reset}   ${C.green}ARMED${C.reset}`)
  console.log(`${C.cyan}  Targets:${C.reset}  ${KILL_LIST.length} domains`)
  console.log(`${C.cyan}  Mode:${C.reset}     ${C.lime}BLACKOUT${C.reset} ${C.dim}(full block)${C.reset}`)
  console.log()
}

async function printKill(): Promise<void> {
  console.log()
  console.log(`${C.lime}${C.bright}  BLACKOUT${C.reset} ${C.dim}v${VERSION}${C.reset}`)
  console.log()

  // THREAT flash
  console.log(`${C.red}${C.bright}  \u2588\u2588 THREAT DETECTED \u2588\u2588${C.reset}`)
  await sleep(200)

  console.log(`${C.dim}  RB2B SURVEILLANCE${C.reset}`)
  await sleep(100)

  // NEUTRALIZED
  console.log(`${C.green}${C.bright}  \u2593\u2593 NEUTRALIZED \u2593\u2593${C.reset}`)
  await sleep(150)

  console.log()
  console.log(`${C.cyan}  KILL LIST:${C.reset}`)
  console.log()

  // Cinematic BLOCKED scroll
  for (const domain of KILL_LIST) {
    const padded = domain.padEnd(28)
    console.log(`${C.dim}  \u2591${C.reset} ${padded} ${C.red}${C.bright}BLOCKED${C.reset}`)
    await sleep(60)
  }

  console.log()
  console.log(`${C.green}  Zero traffic escaped.${C.reset}`)
  console.log(`${C.dim}  Synthetic 200 OK returned.${C.reset}`)
  console.log()
}

function printHelp(): void {
  console.log()
  console.log(`${C.lime}${C.bright}  BLACKOUT${C.reset} ${C.dim}v${VERSION}${C.reset}`)
  console.log()
  console.log(`${C.white}  Usage:${C.reset}`)
  console.log(`    ${C.lime}blackout-protocol${C.reset}         Status`)
  console.log(`    ${C.lime}blackout-protocol kill${C.reset}    Show kill confirmation`)
  console.log(`    ${C.lime}blackout-protocol help${C.reset}    This help`)
  console.log()
  console.log(`${C.white}  Options:${C.reset}`)
  console.log(`    ${C.dim}--plain, -p${C.reset}               Disable ANSI colors`)
  console.log()
  console.log(`${C.white}  Learn more:${C.reset}`)
  console.log(`    ${C.cyan}https://github.com/Blackout-Threat-Intel/blackout-protocol${C.reset}`)
  console.log()
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  const command = args.filter(a => !a.startsWith('-'))[0] || 'status'

  switch (command) {
    case 'kill':
    case 'neutralize':
    case 'blocked':
    case 'blackout':
      await printKill()
      break
    case 'help':
      printHelp()
      break
    case 'status':
    default:
      printStatus()
      break
  }
}

main()
