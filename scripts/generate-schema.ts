import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outputPath = path.join(__dirname, 'schema.json')

/**
 * Generate JSON schema from TypeScript interfaces (HeroData[])
 * Create schema manually from type definitions
 */
function generateSchema() {
  try {
    console.log('Generating JSON schema from TypeScript interfaces...')

    // Define the schema manually based on HeroData interface from types.ts
    // This ensures the schema stays synchronized with TypeScript types
    const schema = {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'name', 'starting_stats'],
        properties: {
          id: {
            type: 'number',
            description: 'Unique hero identifier',
          },
          name: {
            type: 'string',
            description: 'Hero name',
          },
          starting_stats: {
            type: 'object',
            description: 'Hero starting statistics',
            additionalProperties: {
              type: 'object',
              required: ['value', 'display_stat_name'],
              properties: {
                value: {
                  type: 'number',
                  description: 'Stat value',
                },
                display_stat_name: {
                  type: 'string',
                  description: 'Display name for the stat',
                },
              },
              additionalProperties: false,
            },
          },
          level_info: {
            type: 'object',
            description: 'Per-level progression data by level key',
            additionalProperties: {
              type: 'object',
              properties: {
                required_gold: {
                  type: 'number',
                  description: 'Souls required for this level checkpoint',
                },
                bonus_currencies: {
                  type: 'array',
                  items: { type: 'string' },
                  description:
                    'Reward currency tags (e.g. ability unlocks/ability points)',
                },
                use_standard_upgrade: {
                  type: 'boolean',
                  description: 'Whether standard level-up upgrades apply',
                },
              },
              additionalProperties: true,
            },
          },
          standard_level_up_upgrades: {
            type: 'object',
            description: 'Hero-specific boon scaling modifiers',
            additionalProperties: {
              type: 'number',
            },
          },
          purchase_bonuses: {
            type: 'object',
            description: 'Tiered purchase bonuses by stat category',
            additionalProperties: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  value_type: { type: 'string' },
                  tier: { type: 'number' },
                  value: {
                    oneOf: [{ type: 'number' }, { type: 'string' }],
                  },
                },
                additionalProperties: true,
              },
            },
          },
          cost_bonuses: {
            type: 'object',
            description: 'Threshold-based bonus curves by category',
            additionalProperties: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  gold_threshold: { type: 'number' },
                  bonus: { type: 'number' },
                  percent_on_graph: { type: 'number' },
                },
                additionalProperties: true,
              },
            },
          },
          scaling_stats: {
            type: 'object',
            description: 'Additional stat scaling links',
            additionalProperties: {
              type: 'object',
              properties: {
                scaling_stat: { type: 'string' },
                scale: { type: 'number' },
              },
              additionalProperties: true,
            },
          },
          boon_progression: {
            type: 'array',
            description: 'Normalized level-up progression rows for UI use',
            items: {
              type: 'object',
              required: [
                'level',
                'required_gold',
                'grants_boon',
                'grants_ability_unlock',
                'grants_ability_point',
              ],
              properties: {
                level: { type: 'number' },
                required_gold: { type: 'number' },
                grants_boon: { type: 'boolean' },
                grants_ability_unlock: { type: 'boolean' },
                grants_ability_point: { type: 'boolean' },
              },
              additionalProperties: false,
            },
          },
        },
        additionalProperties: true,
      },
    }

    // Write schema to file
    fs.writeFileSync(outputPath, JSON.stringify(schema, null, 2), 'utf-8')
    console.log(`✓ Schema generated and saved to ${outputPath}`)
    console.log(`  Type: Array of HeroData`)
    console.log(`  Required fields per item: id, name, starting_stats`)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`✗ Failed to generate schema: ${message}`)
    process.exit(1)
  }
}

generateSchema()
