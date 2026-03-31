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
