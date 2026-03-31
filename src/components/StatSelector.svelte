<script lang="ts">
  import type { Hero } from '../types'

  interface Props {
    statKeys: string[]
    selectedStat: string
    onStatChange: (stat: string) => void
  }

  const { statKeys = [], selectedStat = '', onStatChange } = $props()

  /**
   * Format stat key from snake_case to Title Case
   * Examples: max_health → Max Health, fire_rate → Fire Rate
   */
  function formatStatName(stat: string): string {
    return stat
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  function handleStatClick(stat: string) {
    onStatChange(stat)
  }
</script>

<div class="flex flex-wrap gap-2 mb-6">
  {#each statKeys as stat}
    <button
      onclick={() => handleStatClick(stat)}
      class="{selectedStat === stat
        ? 'bg-blue-600 text-white border-blue-400'
        : 'bg-gray-700 text-gray-200 border-gray-600 hover:bg-gray-650'} px-4 py-2 rounded-lg border transition-colors cursor-pointer font-medium text-sm"
      aria-label="Select {formatStatName(stat)} stat"
    >
      {formatStatName(stat)}
    </button>
  {/each}
</div>
