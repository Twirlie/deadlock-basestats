/**
 * Represents a single stat value from the API response
 */
export interface StartingStat {
  value: number
  display_stat_name: string
}

export interface LevelInfoEntry {
  required_gold?: number
  bonus_currencies?: string[]
  use_standard_upgrade?: boolean
  [key: string]: unknown
}

export interface PurchaseBonusEntry {
  value_type: string
  tier: number
  value: number | string
  [key: string]: unknown
}

export interface CostBonusEntry {
  gold_threshold: number
  bonus: number
  percent_on_graph?: number
  [key: string]: unknown
}

export interface ScalingStatEntry {
  scaling_stat: string
  scale: number
  [key: string]: unknown
}

export interface BoonProgressionEntry {
  level: number
  required_gold: number
  grants_boon: boolean
  grants_ability_unlock: boolean
  grants_ability_point: boolean
}

export type BoonStatGainReason =
  | 'mapped'
  | 'unmapped_modifier'
  | 'missing_upgrade_value'
  | 'missing_starting_value'

export interface BoonStatGainEntry {
  stat_key: string
  display_stat_name: string
  base_value: number | null
  per_boon_gain: number | null
  max_total_gain: number | null
  max_level_value: number | null
  supported: boolean
  reason: BoonStatGainReason
  modifier_key?: string
}

/**
 * Represents the full hero data structure returned by the Deadlock API
 * Used for schema validation of API responses
 */
export interface HeroData {
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
  level_info?: Record<string, LevelInfoEntry>
  standard_level_up_upgrades?: Record<string, number>
  purchase_bonuses?: Record<string, PurchaseBonusEntry[]>
  cost_bonuses?: Record<string, CostBonusEntry[]>
  scaling_stats?: Record<string, ScalingStatEntry>
  boon_progression?: BoonProgressionEntry[]
  boon_count?: number
  boon_stat_gains?: Record<string, BoonStatGainEntry>
}

/**
 * @deprecated Use StartingStat instead
 */
export type StatValue = StartingStat
