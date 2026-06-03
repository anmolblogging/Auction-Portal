// Generates a static WC2026 player dataset from ESPN squads + Transfermarkt
// market values.
//
//   node scripts/generate-wc-squads.mjs
//
// Output: src/lib/wcSquads.ts  (export const WC2026_PLAYERS: Player[])
//
// - Squad membership + position come from ESPN's public WC2026 rosters
//   (G/D/M/F -> Goalkeeper / Defender / Midfielder / Forward; ESPN files
//   wingers under Midfielder and keeps only strikers under F).
// - Each team is capped to its 26 most valuable players (≈ the real squad).
// - TIER IS PER-PLAYER, by Transfermarkt market value — NOT by country. A
//   star from a small nation outranks a squad filler from a big one.

import { writeFileSync } from 'node:fs';

const ESPN = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world';
const TM = 'https://transfermarkt-api.fly.dev';

const SQUAD_CAP = 26;
const CONCURRENCY = 5;

const POSITION = { G: 'Goalkeeper', D: 'Defender', M: 'Midfielder', F: 'Forward' };
const POSITION_ORDER = { Goalkeeper: 0, Defender: 1, Midfielder: 2, Forward: 3 };
const POSITION_ADJ = { Forward: 100, Midfielder: 50, Defender: 20, Goalkeeper: 0 };

// Market-value bands (EUR) -> tier. Performance proxy, country-agnostic.
function tierForValue(mv) {
  if (mv >= 60_000_000) return 1;
  if (mv >= 30_000_000) return 2;
  if (mv >= 12_000_000) return 3;
  if (mv >= 4_000_000) return 4;
  return 5;
}
// Base (starting) prices tuned for a ~10,000L per-team budget.
const TIER_BASE = { 1: 900, 2: 550, 3: 320, 4: 160, 5: 80 };

function initials(name) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 3).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Normalise a country/nationality to a comparable token across ESPN & TM.
function natKey(s) {
  const x = (s || '')
    .normalize('NFD') // split accents into base letter + combining mark
    .toLowerCase()
    .replace(/[^a-z]/g, ''); // strips combining marks and punctuation
  const alias = {
    unitedstates: 'usa', us: 'usa', usmnt: 'usa',
    czechrepublic: 'czechia',
    koreasouth: 'southkorea', republicofkorea: 'southkorea', korearep: 'southkorea',
    cotedivoire: 'ivorycoast',
    drcongo: 'congodr', congo: 'congodr', democraticrepublicofcongo: 'congodr',
    turkey: 'turkiye',
    bosniaandherzegovina: 'bosniaherzegovina',
    caboverde: 'capeverde',
    curacao: 'curacao',
  };
  return alias[x] || x;
}

async function getJSON(url, tries = 4) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { accept: 'application/json' } });
      if (res.status === 429) {
        await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      if (i === tries - 1) throw e;
      await new Promise((r) => setTimeout(r, 800 * (i + 1)));
    }
  }
}

// Best nationality-matched market value from one TM search query.
async function searchValue(query, want) {
  let data;
  try {
    data = await getJSON(`${TM}/players/search/${encodeURIComponent(query)}`);
  } catch {
    return 0;
  }
  const results = (data?.results || []).filter((r) => typeof r.marketValue === 'number');
  if (!results.length) return 0;
  const natMatch = results.filter((r) => (r.nationalities || []).some((n) => natKey(n) === want));
  const pool = natMatch.length ? natMatch : results;
  pool.sort((a, b) => (b.marketValue || 0) - (a.marketValue || 0));
  return pool[0].marketValue || 0;
}

// Transfermarkt market value, disambiguated by nationality. Falls back to a
// reversed token order (e.g. ESPN "Kim Min-Jae" -> TM "Min-Jae Kim") for
// family-name-first listings that the direct query misses.
async function marketValue(name, country) {
  const want = natKey(country);
  let mv = await searchValue(name, want);
  if (mv === 0) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      const reversed = [...parts].reverse().join(' ');
      if (reversed !== name) mv = await searchValue(reversed, want);
    }
  }
  return mv;
}

// Run async mapper over items with bounded concurrency.
async function mapPool(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: limit }, worker));
  return out;
}

async function main() {
  const teamsData = await getJSON(`${ESPN}/teams`);
  const teams = (teamsData.sports?.[0]?.leagues?.[0]?.teams || []).map((t) => t.team);
  console.log(`Found ${teams.length} teams`);

  // 1. Collect every rostered player (squad membership + position) from ESPN.
  const raw = [];
  for (const team of teams) {
    const country = team.displayName;
    let roster;
    try {
      roster = await getJSON(`${ESPN}/teams/${team.id}/roster`);
    } catch (e) {
      console.warn(`! Roster failed for ${country}: ${e.message}`);
      continue;
    }
    for (const a of roster.athletes || []) {
      const role = POSITION[a.position?.abbreviation];
      const name = a.displayName || a.fullName;
      if (!role || !name) continue;
      raw.push({ name, country, role });
    }
  }
  console.log(`Collected ${raw.length} rostered players. Fetching market values…`);

  // 2. Look up Transfermarkt market value for each (bounded concurrency).
  let done = 0;
  await mapPool(raw, CONCURRENCY, async (p) => {
    p.mv = await marketValue(p.name, p.country);
    if (++done % 100 === 0) console.log(`  …${done}/${raw.length}`);
  });

  // 3. Cap each team to its 26 most valuable players.
  const byTeam = new Map();
  for (const p of raw) {
    if (!byTeam.has(p.country)) byTeam.set(p.country, []);
    byTeam.get(p.country).push(p);
  }
  const kept = [];
  for (const [country, list] of byTeam) {
    list.sort((a, b) => b.mv - a.mv);
    const top = list.slice(0, SQUAD_CAP);
    kept.push(...top);
    const valued = top.filter((p) => p.mv > 0).length;
    console.log(`  ${country}: kept ${top.length} (with value: ${valued})`);
  }

  // 4. Build final players: tier by value, base from tier + position.
  let id = 1000;
  const players = kept.map((p) => {
    const tierNum = tierForValue(p.mv);
    return {
      id: id++,
      name: p.name,
      country: p.country,
      role: p.role,
      tier: `Tier ${tierNum}`,
      tierNum,
      mv: p.mv,
      base: TIER_BASE[tierNum] + (POSITION_ADJ[p.role] || 0),
      img: initials(p.name),
    };
  });

  // 5. Order: tier 1 -> 5, then GK -> FWD, then most valuable first, then name.
  players.sort(
    (x, y) =>
      x.tierNum - y.tierNum ||
      POSITION_ORDER[x.role] - POSITION_ORDER[y.role] ||
      y.mv - x.mv ||
      x.name.localeCompare(y.name)
  );

  const dist = [0, 0, 0, 0, 0, 0];
  players.forEach((p) => dist[p.tierNum]++);

  const rows = players
    .map(
      (p) =>
        `  { id: ${p.id}, name: ${JSON.stringify(p.name)}, country: ${JSON.stringify(p.country)}, role: ${JSON.stringify(p.role)}, tier: ${JSON.stringify(p.tier)}, base: ${p.base}, img: ${JSON.stringify(p.img)}, nat: '' },`
    )
    .join('\n');

  const header = `// AUTO-GENERATED by scripts/generate-wc-squads.mjs — do not edit by hand.\n// Source: ESPN WC2026 rosters (squad + position) + Transfermarkt market values.\n// ${players.length} players (max ${SQUAD_CAP}/team). Tier is per-player by market\n// value: T1 ${dist[1]}, T2 ${dist[2]}, T3 ${dist[3]}, T4 ${dist[4]}, T5 ${dist[5]}.\nimport type { Player } from './types';\n\nexport const WC2026_PLAYERS: Player[] = [\n`;
  writeFileSync('src/lib/wcSquads.ts', header + rows + '\n];\n');
  console.log(`\nWrote src/lib/wcSquads.ts with ${players.length} players. Tier spread: T1=${dist[1]} T2=${dist[2]} T3=${dist[3]} T4=${dist[4]} T5=${dist[5]}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
