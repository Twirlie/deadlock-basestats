import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

const heroesJsonPath = path.join(rootDir, 'heroes.json')
const outputPath = path.join(rootDir, 'data', 'heroes-stats.json')

interface StartingStat {
  value: number
  display_stat_name: string
}

interface HeroData {
  id: number
  name: string
  starting_stats: Record<string, StartingStat>
  [key: string]: unknown
}

interface PrunedHero {
  id: number
  name: string
  starting_stats: Record<string, StartingStat>
}

try {
  // Read the heroes.json file
  const heroesRawData = fs.readFileSync(heroesJsonPath, 'utf-8')
  const heroesData: HeroData[] = JSON.parse(heroesRawData)

  // Extract id, name, and starting_stats for each hero
  const prunedHeroes: PrunedHero[] = heroesData.map((hero) => ({
    id: hero.id,
    name: hero.name,
    starting_stats: hero.starting_stats,
  }))

  // Write the pruned data to the output file
  fs.writeFileSync(outputPath, JSON.stringify(prunedHeroes, null, 2), 'utf-8')

  console.log(`✓ Successfully extracted hero stats to ${outputPath}`)
  console.log(`  Total heroes: ${prunedHeroes.length}`)
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error)
  console.error(`✗ Error extracting hero stats: ${errorMessage}`)
  process.exit(1)
}
