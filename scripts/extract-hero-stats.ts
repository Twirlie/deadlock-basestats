import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import Ajv from 'ajv'
import type { HeroData, StartingStat } from '../src/types.js'

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
  return heroes.map((hero) => ({
    id: hero.id,
    name: hero.name,
    starting_stats: hero.starting_stats,
  }))
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
