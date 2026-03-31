/**
 * Represents a single stat value from the API response
 */
export interface StartingStat {
  value: number
  display_stat_name: string
}

/**
 * Represents the full hero data structure returned by the Deadlock API
 * Used for schema validation of API responses
 */
export interface HeroData {
  id: number
  name: string
  starting_stats: Record<string, StartingStat>
  [key: string]: unknown
}

/**
 * Represents the pruned hero data used in the application
 * Contains only the essential fields: id, name, and starting_stats
 */
export interface Hero {
  id: number
  name: string
  starting_stats: Record<string, StartingStat>
}

/**
 * @deprecated Use StartingStat instead
 */
export type StatValue = StartingStat
