<script lang="ts">
  import type { Hero } from '../types'

  interface Props {
    heroes: Hero[]
    selectedStat: string
  }

  const { heroes = [], selectedStat = '' } = $props()

  /**
   * Calculate mean and standard deviation for a list of values
   */
  function calculateStatistics(values: number[]): {
    mean: number
    stdDev: number
  } {
    if (values.length === 0) return { mean: 0, stdDev: 0 }

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const variance =
      values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
      values.length
    const stdDev = Math.sqrt(variance)

    return { mean, stdDev }
  }

  /**
   * Calculate tier based on outlier detection using standard deviation
   * HIGH: value > (mean + 1 SD) — upper outliers
   * MID: value between (mean - 1 SD) and (mean + 1 SD) — baseline average
   * LOW: value < (mean - 1 SD) — lower outliers
   */
  function calculateTier(
    value: number,
    mean: number,
    stdDev: number,
  ): 'HIGH' | 'MID' | 'LOW' {
    const highThreshold = mean + stdDev
    const lowThreshold = mean - stdDev

    if (value > highThreshold) return 'HIGH'
    if (value < lowThreshold) return 'LOW'
    return 'MID'
  }

  /**
   * Group heroes by tier with ranking information
   */
  const tieredHeroes = $derived.by(() => {
    if (!selectedStat || heroes.length === 0) return {}

    // Extract stat values for all heroes
    const statValues = heroes
      .map((hero) => hero.starting_stats[selectedStat]?.value ?? 0)
      .filter((val) => val !== null && val !== undefined)

    // Calculate mean and standard deviation
    const { mean, stdDev } = calculateStatistics(statValues)

    // Sort heroes by stat value (descending)
    const sorted = [...heroes].sort((a, b) => {
      const aValue = a.starting_stats[selectedStat]?.value ?? 0
      const bValue = b.starting_stats[selectedStat]?.value ?? 0
      return bValue - aValue
    })

    // Group by tier with rank information
    const tiers: Record<
      string,
      Array<{ rank: number; hero: Hero; value: number }>
    > = {
      HIGH: [],
      MID: [],
      LOW: [],
    }

    sorted.forEach((hero, index) => {
      const value = hero.starting_stats[selectedStat]?.value ?? 0
      const tier = calculateTier(value, mean, stdDev)

      tiers[tier].push({
        rank: index + 1,
        hero,
        value,
      })
    })

    return tiers
  })

  /**
   * Get Tailwind color classes for tier header
   */
  function getTierHeaderColor(tier: string): string {
    const colors = {
      HIGH: 'bg-yellow-600 text-yellow-50',
      MID: 'bg-gray-600 text-gray-50',
      LOW: 'bg-red-600 text-red-50',
    }
    return colors[tier] || 'bg-gray-600'
  }

  /**
   * Get Tailwind color classes for tier rows
   */
  function getTierRowColor(tier: string): string {
    const colors = {
      HIGH: 'bg-yellow-900 text-yellow-50',
      MID: 'bg-gray-700 text-gray-100',
      LOW: 'bg-red-900 text-red-50',
    }
    return colors[tier] || 'bg-gray-700'
  }

  /**
   * Get tier display label
   */
  function getTierLabel(tier: string): string {
    const labels = {
      HIGH: 'HIGH TIER',
      MID: 'MID TIER',
      LOW: 'LOW TIER',
    }
    return labels[tier] || tier
  }
</script>

<div class="space-y-6">
  {#each ['HIGH', 'MID', 'LOW'] as tier}
    {#if tieredHeroes[tier] && tieredHeroes[tier].length > 0}
      <div>
        <div
          class="{getTierHeaderColor(
            tier,
          )} px-4 py-2 rounded-t-lg font-bold text-lg tracking-wide"
        >
          {getTierLabel(tier)}
        </div>
        <div class="space-y-1">
          {#each tieredHeroes[tier] as { rank, hero, value }}
            <div
              class="{getTierRowColor(
                tier,
              )} px-4 py-2 rounded-b-lg flex justify-between items-center font-medium"
            >
              <span>
                <span class="text-gray-300 font-bold">{rank}.</span>
                <span class="ml-2">{hero.name}</span>
              </span>
              <span class="font-bold">{value.toFixed(2)}</span>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  {/each}
</div>
