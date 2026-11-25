#!/usr/bin/env node
// Small bookkeeping for the scoreboard. Writes only to this kit's .cache folder.
//   node scripts/mark.mjs live-ok <tool>     a sign-in tool passed its live read-only check
//   node scripts/mark.mjs recheck <tool>     forget that, so the scoreboard asks again
//   node scripts/mark.mjs restarted          the member restarted Claude Code (clears every
//                                            "needs restart" row; use after the live check)
import { loadKit, toolById, readCache, writeCache, today } from './lib.mjs';

const [cmd, id] = process.argv.slice(2);
const kit = loadKit();
if (cmd === 'restarted') {
  writeCache('needs-restart', {});
  console.log('CLEARED needs-restart');
} else if ((cmd === 'live-ok' || cmd === 'recheck') && toolById(kit, id)) {
  const c = readCache('live-ok');
  if (cmd === 'live-ok') c[id] = today(); else delete c[id];
  writeCache('live-ok', c);
  console.log(cmd === 'live-ok' ? `MARKED ${id} live-ok ${today()}` : `CLEARED ${id}`);
} else {
  console.error('Usage: node scripts/mark.mjs live-ok <tool> | recheck <tool> | restarted');
  process.exit(2);
}
