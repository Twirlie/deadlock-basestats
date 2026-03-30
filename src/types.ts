export interface StatValue {
  value: number
  display_stat_name: string
}

export interface Hero {
  id: number
  name: string
  starting_stats: Record<string, StatValue>
}
