import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import Ajv from 'ajv'
import type {
  BoonStatGainEntry,
  BoonProgressionEntry,
  CostBonusEntry,
  HeroData,
  LevelInfoEntry,
  PurchaseBonusEntry,
  ScalingStatEntry,
  StartingStat,
} from '../src/types.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

const heroesJsonPath = path.join(rootDir, 'heroes.json')
const outputPath = path.join(rootDir, 'data', 'heroes-stats.json')
const schemaPath = path.join(__dirname, 'schema.json')
const API_URL = 'https://assets.deadlock-api.com/v2/heroes'
const API_TIMEOUT_MS = 10000

// ============================================================================
// Type Definitions
// ============================================================================

interface PrunedHero {
  id: number
  name: string
  starting_stats: Record<string, StartingStat>
  level_info?: Record<string, LevelInfoEntry>
  standard_level_up_upgrades?: Record<string, number>
  purchase_bonuses?: Record<string, PurchaseBonusEntry[]>
  cost_bonuses?: Record<string, CostBonusEntry[]>
  scaling_stats?: Record<string, ScalingStatEntry>
  boon_progression?: BoonProgressionEntry[]
  boon_count?: number
  boon_stat_gains?: Record<string, BoonStatGainEntry>
}

const STAT_TO_UPGRADE_MODIFIER: Record<string, string> = {
  max_health: 'MODIFIER_VALUE_BASE_HEALTH_FROM_LEVEL',
  weapon_power: 'MODIFIER_VALUE_BASE_BULLET_DAMAGE_FROM_LEVEL',
  light_melee_damage: 'MODIFIER_VALUE_BASE_MELEE_DAMAGE_FROM_LEVEL',
  heavy_melee_damage: 'MODIFIER_VALUE_BASE_MELEE_DAMAGE_FROM_LEVEL',
  bullet_armor_damage_reduction: 'MODIFIER_VALUE_BULLET_ARMOR_DAMAGE_RESIST',
  tech_armor_damage_reduction: 'MODIFIER_VALUE_TECH_ARMOR_DAMAGE_RESIST',
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function normalizeLevelInfo(
  levelInfo: unknown,
): Record<string, LevelInfoEntry> | undefined {
  if (!isRecord(levelInfo)) return undefined

  const normalized: Record<string, LevelInfoEntry> = {}

  for (const [level, entry] of Object.entries(levelInfo)) {
    if (!isRecord(entry)) continue
    normalized[level] = {
      ...entry,
      required_gold:
        typeof entry.required_gold === 'number' ? entry.required_gold : undefined,
      bonus_currencies: Array.isArray(entry.bonus_currencies)
        ? entry.bonus_currencies.filter((v): v is string => typeof v === 'string')
        : undefined,
      use_standard_upgrade:
        typeof entry.use_standard_upgrade === 'boolean'
          ? entry.use_standard_upgrade
          : undefined,
    }
  }

  return Object.keys(normalized).length > 0 ? normalized : undefined
}

function normalizeNumberRecord(
  value: unknown,
): Record<string, number> | undefined {
  if (!isRecord(value)) return undefined

  const normalized: Record<string, number> = {}
  for (const [key, v] of Object.entries(value)) {
    if (typeof v === 'number' && Number.isFinite(v)) {
      normalized[key] = v
    }
  }
  return Object.keys(normalized).length > 0 ? normalized : undefined
}

function normalizePurchaseBonuses(
  purchaseBonuses: unknown,
): Record<string, PurchaseBonusEntry[]> | undefined {
  if (!isRecord(purchaseBonuses)) return undefined

  const normalized: Record<string, PurchaseBonusEntry[]> = {}

  for (const [category, entries] of Object.entries(purchaseBonuses)) {
    if (!Array.isArray(entries)) continue

    const parsedEntries = entries
      .map((entry): PurchaseBonusEntry | null => {
        if (!isRecord(entry)) return null
        if (typeof entry.value_type !== 'string') return null
        if (typeof entry.tier !== 'number') return null

        let value: number | string = 0
        if (typeof entry.value === 'number') {
          value = entry.value
        } else if (typeof entry.value === 'string') {
          const parsed = Number(entry.value)
          value = Number.isFinite(parsed) ? parsed : entry.value
        } else {
          return null
        }

        return {
          ...entry,
          value_type: entry.value_type,
          tier: entry.tier,
          value,
        }
      })
      .filter((entry): entry is PurchaseBonusEntry => entry !== null)

    if (parsedEntries.length > 0) {
      normalized[category] = parsedEntries
    }
  }

  return Object.keys(normalized).length > 0 ? normalized : undefined
}

function normalizeCostBonuses(
  costBonuses: unknown,
): Record<string, CostBonusEntry[]> | undefined {
  if (!isRecord(costBonuses)) return undefined

  const normalized: Record<string, CostBonusEntry[]> = {}

  for (const [category, entries] of Object.entries(costBonuses)) {
    if (!Array.isArray(entries)) continue

    const parsedEntries = entries
      .map((entry): CostBonusEntry | null => {
        if (!isRecord(entry)) return null
        if (typeof entry.gold_threshold !== 'number') return null
        if (typeof entry.bonus !== 'number') return null
        return {
          ...entry,
          gold_threshold: entry.gold_threshold,
          bonus: entry.bonus,
          percent_on_graph:
            typeof entry.percent_on_graph === 'number'
              ? entry.percent_on_graph
              : undefined,
        }
      })
      .filter((entry): entry is CostBonusEntry => entry !== null)

    if (parsedEntries.length > 0) {
      normalized[category] = parsedEntries
    }
  }

  return Object.keys(normalized).length > 0 ? normalized : undefined
}

function normalizeScalingStats(
  scalingStats: unknown,
): Record<string, ScalingStatEntry> | undefined {
  if (!isRecord(scalingStats)) return undefined

  const normalized: Record<string, ScalingStatEntry> = {}

  for (const [key, value] of Object.entries(scalingStats)) {
    if (!isRecord(value)) continue
    if (typeof value.scaling_stat !== 'string') continue
    if (typeof value.scale !== 'number') continue

    normalized[key] = {
      ...value,
      scaling_stat: value.scaling_stat,
      scale: value.scale,
    }
  }

  return Object.keys(normalized).length > 0 ? normalized : undefined
}

function deriveBoonProgression(
  levelInfo?: Record<string, LevelInfoEntry>,
): BoonProgressionEntry[] | undefined {
  if (!levelInfo) return undefined

  const entries = Object.entries(levelInfo)
    .map(([level, value]) => {
      const parsedLevel = Number(level)
      if (!Number.isFinite(parsedLevel)) return null
      if (typeof value.required_gold !== 'number') return null

      const bonusCurrencies = value.bonus_currencies ?? []
      return {
        level: parsedLevel,
        required_gold: value.required_gold,
        // Hero starts at level 1; boons are earned on level-ups from 2..36.
        grants_boon: parsedLevel > 1,
        grants_ability_unlock: bonusCurrencies.includes('EAbilityUnlocks'),
        grants_ability_point: bonusCurrencies.includes('EAbilityPoints'),
      }
    })
    .filter((entry): entry is BoonProgressionEntry => entry !== null)
    .sort((a, b) => a.level - b.level)

  return entries.length > 0 ? entries : undefined
}

function checkBoonConsistency(heroName: string, progression?: BoonProgressionEntry[]) {
  if (!progression || progression.length === 0) return

  for (let i = 1; i < progression.length; i += 1) {
    if (progression[i].required_gold < progression[i - 1].required_gold) {
      console.warn(
        `  ${heroName}: non-monotonic souls thresholds between levels ${progression[i - 1].level} and ${progression[i].level}`,
      )
      break
    }
  }

  const maxLevel = Math.max(...progression.map((entry) => entry.level))
  if (maxLevel !== 36) {
    console.warn(`  ${heroName}: expected max level 36, got ${maxLevel}`)
  }

  const boonCount = progression.filter((entry) => entry.grants_boon).length
  if (maxLevel === 36 && boonCount !== 35) {
    console.warn(`  ${heroName}: expected 35 boons by level 36, got ${boonCount}`)
  }

  const unlocks = progression.filter((entry) => entry.grants_ability_unlock).length
  if (unlocks > 4) {
    console.warn(`  ${heroName}: ability unlock count exceeds expected cap (${unlocks})`)
  }
}

function getBoonCount(progression?: BoonProgressionEntry[]): number {
  if (!progression || progression.length === 0) return 0
  return progression.filter((entry) => entry.grants_boon).length
}

function computeBoonStatGains(
  startingStats: Record<string, StartingStat>,
  standardLevelUpUpgrades?: Record<string, number>,
  boonCount = 0,
): Record<string, BoonStatGainEntry> {
  const result: Record<string, BoonStatGainEntry> = {}

  for (const [statKey, statValue] of Object.entries(startingStats)) {
    const baseValue =
      typeof statValue.value === 'number' && Number.isFinite(statValue.value)
        ? statValue.value
        : null
    const modifierKey = STAT_TO_UPGRADE_MODIFIER[statKey]

    if (baseValue === null) {
      result[statKey] = {
        stat_key: statKey,
        display_stat_name: statValue.display_stat_name ?? statKey,
        base_value: null,
        per_boon_gain: null,
        max_total_gain: null,
        max_level_value: null,
        supported: false,
        reason: 'missing_starting_value',
        modifier_key: modifierKey,
      }
      continue
    }

    if (!modifierKey) {
      result[statKey] = {
        stat_key: statKey,
        display_stat_name: statValue.display_stat_name ?? statKey,
        base_value: baseValue,
        per_boon_gain: null,
        max_total_gain: null,
        max_level_value: null,
        supported: false,
        reason: 'unmapped_modifier',
      }
      continue
    }

    const perBoonGain = standardLevelUpUpgrades?.[modifierKey]
    if (typeof perBoonGain !== 'number' || !Number.isFinite(perBoonGain)) {
      result[statKey] = {
        stat_key: statKey,
        display_stat_name: statValue.display_stat_name ?? statKey,
        base_value: baseValue,
        per_boon_gain: null,
        max_total_gain: null,
        max_level_value: null,
        supported: false,
        reason: 'missing_upgrade_value',
        modifier_key: modifierKey,
      }
      continue
    }

    const maxTotalGain = perBoonGain * boonCount
    result[statKey] = {
      stat_key: statKey,
      display_stat_name: statValue.display_stat_name ?? statKey,
      base_value: baseValue,
      per_boon_gain: perBoonGain,
      max_total_gain: maxTotalGain,
      max_level_value: baseValue + maxTotalGain,
      supported: true,
      reason: 'mapped',
      modifier_key: modifierKey,
    }
  }

  return result
}

// ============================================================================
// Schema Validation
// ============================================================================

/**
 * Load JSON schema from generated schema file
 */
function loadSchema(): Record<string, unknown> {
  try {
    if (!fs.existsSync(schemaPath)) {
      throw new Error(
        `Schema file not found: ${schemaPath}. Run 'pnpm generate-schema' first.`,
      )
    }

    const schemaRaw = fs.readFileSync(schemaPath, 'utf-8')
    const schema = JSON.parse(schemaRaw)
    return schema
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`✗ Failed to load schema: ${message}`)
    process.exit(1)
  }
}

/**
 * Validate raw API response against generated schema
 */
function validateData(data: unknown): data is HeroData[] {
  const schema = loadSchema()
  const ajv = new Ajv()
  const validate = ajv.compile(schema)
  const isValid = validate(data)

  if (!isValid) {
    const errors = validate.errors
      ?.map((e) => `${e.instancePath} ${e.message}`)
      .join(', ')
    console.error(`✗ Schema validation failed: ${errors}`)
  }

  return isValid
}

// ============================================================================
// Data Source Functions
// ============================================================================

/**
 * Attempt to fetch hero data from live API with timeout
 */
async function fetchApiHeroes(): Promise<HeroData[] | null> {
  try {
    console.log(`  Attempting API fetch from ${API_URL}...`)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS)

    const response = await fetch(API_URL, { signal: controller.signal })
    clearTimeout(timeoutId)

    if (!response.ok) {
      console.warn(`  API returned ${response.status}: ${response.statusText}`)
      return null
    }

    const data = await response.json()

    if (!validateData(data)) {
      return null
    }

    console.log(`✓ Successfully fetched from API`)
    return data
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.warn(`  API fetch failed: ${message}`)
    return null
  }
}

/**
 * Load hero data from local heroes.json fallback
 */
function loadLocalHeroes(): HeroData[] | null {
  try {
    console.log(`  Loading from local ${heroesJsonPath}...`)

    if (!fs.existsSync(heroesJsonPath)) {
      console.warn(`  Local file not found: ${heroesJsonPath}`)
      return null
    }

    const rawData = fs.readFileSync(heroesJsonPath, 'utf-8')
    const data = JSON.parse(rawData)

    if (!validateData(data)) {
      return null
    }

    console.log(`✓ Successfully loaded from local file`)
    return data
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.warn(`  Local load failed: ${message}`)
    return null
  }
}

/**
 * Save successful API response to local heroes.json
 */
function saveApiData(data: HeroData[]): void {
  try {
    fs.writeFileSync(heroesJsonPath, JSON.stringify(data, null, 2), 'utf-8')
    console.log(`✓ Saved API response to ${heroesJsonPath}`)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.warn(`  Failed to save API data: ${message}`)
  }
}

/**
 * Extract pruned hero stats from full hero data
 */
function extractHeroStats(heroes: HeroData[]): PrunedHero[] {
  return heroes.map((hero) => {
    const levelInfo = normalizeLevelInfo(hero.level_info)
    const boonProgression = deriveBoonProgression(levelInfo)
    const standardLevelUpUpgrades = normalizeNumberRecord(
      hero.standard_level_up_upgrades,
    )
    const boonCount = getBoonCount(boonProgression)
    checkBoonConsistency(hero.name, boonProgression)

    return {
      id: hero.id,
      name: hero.name,
      starting_stats: hero.starting_stats,
      level_info: levelInfo,
      standard_level_up_upgrades: standardLevelUpUpgrades,
      purchase_bonuses: normalizePurchaseBonuses(hero.purchase_bonuses),
      cost_bonuses: normalizeCostBonuses(hero.cost_bonuses),
      scaling_stats: normalizeScalingStats(hero.scaling_stats),
      boon_progression: boonProgression,
      boon_count: boonCount,
      boon_stat_gains: computeBoonStatGains(
        hero.starting_stats,
        standardLevelUpUpgrades,
        boonCount,
      ),
    }
  })
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  try {
    console.log('Extracting hero stats...')

    // Try to fetch fresh data from API, fall back to local
    let heroesData: HeroData[] | null = await fetchApiHeroes()

    if (heroesData) {
      // Successfully fetched from API, save for future offline use
      saveApiData(heroesData)
    } else {
      // API failed, use local file
      heroesData = loadLocalHeroes()

      if (!heroesData) {
        throw new Error(
          'Unable to load data: API unavailable and no local fallback found',
        )
      }
    }

    // Extract pruned data
    const prunedHeroes = extractHeroStats(heroesData)

    // Write to output
    fs.writeFileSync(outputPath, JSON.stringify(prunedHeroes, null, 2), 'utf-8')

    console.log(`✓ Successfully extracted hero stats to ${outputPath}`)
    console.log(`  Total heroes: ${prunedHeroes.length}`)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`✗ Error: ${errorMessage}`)
    process.exit(1)
  }
}

main()
