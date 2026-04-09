<script lang="ts">
  import type { BoonStatGainEntry, Hero } from '../types'

  interface Props {
    heroes: Hero[]
  }

  interface BoonStatRow extends BoonStatGainEntry {
    statLabel: string
  }

  const { heroes = [] }: Props = $props()

  let query = $state('')
  let selectedHeroId = $state<number | null>(null)

  const sortedHeroes = $derived.by(() =>
    [...heroes].sort((a, b) => a.name.localeCompare(b.name)),
  )

  $effect(() => {
    if (sortedHeroes.length === 0) {
      selectedHeroId = null
      return
    }

    if (selectedHeroId === null) {
      selectedHeroId = sortedHeroes[0].id
      return
    }

    const exists = sortedHeroes.some((hero) => hero.id === selectedHeroId)
    if (!exists) {
      selectedHeroId = sortedHeroes[0].id
    }
  })

  const heroOptions = $derived.by(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return sortedHeroes
    return sortedHeroes.filter((hero) =>
      hero.name.toLowerCase().includes(normalized),
    )
  })

  const selectedHero = $derived.by(
    () => heroes.find((hero) => hero.id === selectedHeroId) ?? null,
  )

  const boonCount = $derived.by(() => selectedHero?.boon_count ?? 0)

  const maxLevel = $derived.by(() => {
    const progression = selectedHero?.boon_progression ?? []
    if (progression.length === 0) return 0
    return Math.max(...progression.map((entry) => entry.level))
  })

  const progressionRows = $derived.by((): BoonStatRow[] => {
    if (!selectedHero?.boon_stat_gains) return []

    const rows = Object.entries(selectedHero.boon_stat_gains).map(
      ([statKey, row]) => ({
        ...row,
        stat_key: row.stat_key ?? statKey,
        statLabel: formatStatName(statKey),
      }),
    )

    rows.sort((a, b) => {
      if (a.supported !== b.supported) return a.supported ? -1 : 1
      return a.statLabel.localeCompare(b.statLabel)
    })

    return rows
  })

  function formatStatName(stat: string): string {
    return stat
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  function formatNumber(value: number | null): string {
    if (value === null) return '--'
    if (Number.isInteger(value)) return String(value)
    return value.toFixed(2)
  }

  function formatReason(reason: string): string {
    return reason
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  function handleHeroChange(event: Event): void {
    const target = event.currentTarget as HTMLSelectElement
    const nextId = Number(target.value)
    if (Number.isNaN(nextId)) return
    selectedHeroId = nextId
  }
</script>

<section class="space-y-6">
  <div class="rounded-lg border border-gray-700 bg-gray-800/70 p-4">
    <h2 class="text-lg font-semibold text-gray-100 mb-1">Boon Progression</h2>
    <p class="text-sm text-gray-300">
      Select a hero to inspect base stat gains per boon and total gains at max level.
    </p>
  </div>

  <div class="rounded-lg bg-gray-800 p-4 border border-gray-700 space-y-3">
    <p class="text-sm text-gray-400">Hero Selector</p>
    <input
      type="text"
      bind:value={query}
      placeholder="Filter heroes..."
      aria-label="Filter heroes"
      class="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-gray-500"
    />
    <select
      onchange={handleHeroChange}
      value={selectedHeroId ?? ''}
      aria-label="Select hero for boon progression"
      class="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-gray-100 focus:outline-none focus:border-gray-500"
    >
      {#if heroOptions.length === 0}
        <option disabled value={selectedHeroId ?? ''}>No heroes match filter</option>
      {:else}
        {#each heroOptions as hero}
          <option value={hero.id}>{hero.name}</option>
        {/each}
      {/if}
    </select>
  </div>

  {#if selectedHero}
    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div class="rounded-lg border border-gray-700 bg-gray-800/70 p-4">
        <p class="text-xs uppercase tracking-wide text-gray-400">Hero</p>
        <p class="text-lg font-semibold text-gray-100">{selectedHero.name}</p>
      </div>
      <div class="rounded-lg border border-gray-700 bg-gray-800/70 p-4">
        <p class="text-xs uppercase tracking-wide text-gray-400">Total Boons</p>
        <p class="text-lg font-semibold text-gray-100">{boonCount}</p>
      </div>
      <div class="rounded-lg border border-gray-700 bg-gray-800/70 p-4">
        <p class="text-xs uppercase tracking-wide text-gray-400">Max Level</p>
        <p class="text-lg font-semibold text-gray-100">{maxLevel || '--'}</p>
      </div>
    </div>

    <div class="rounded-lg border border-gray-700 overflow-hidden">
      <div class="grid grid-cols-[1.7fr_1fr_1fr_1fr_1fr_1.6fr] gap-3 px-4 py-3 bg-gray-800 text-xs uppercase tracking-wide text-gray-400">
        <span>Stat</span>
        <span>Base</span>
        <span>Per Boon</span>
        <span>Total @ Max</span>
        <span>Final @ Max</span>
        <span>Status</span>
      </div>
      {#each progressionRows as row}
        <div
          class="grid grid-cols-[1.7fr_1fr_1fr_1fr_1fr_1.6fr] gap-3 px-4 py-3 text-sm border-t border-gray-700 {row.supported
            ? 'text-gray-200 bg-gray-900/30'
            : 'text-gray-400 bg-gray-800/40'}"
        >
          <span class="font-medium">{row.statLabel}</span>
          <span>{formatNumber(row.base_value)}</span>
          <span>{formatNumber(row.per_boon_gain)}</span>
          <span>{formatNumber(row.max_total_gain)}</span>
          <span>{formatNumber(row.max_level_value)}</span>
          <span>
            {#if row.supported}
              <span class="inline-flex rounded-full bg-emerald-600/20 px-2.5 py-1 text-xs font-medium text-emerald-300">
                Supported
              </span>
            {:else}
              <span class="inline-flex rounded-full bg-gray-600/25 px-2.5 py-1 text-xs font-medium text-gray-300">
                Unsupported: {formatReason(row.reason)}
              </span>
            {/if}
          </span>
        </div>
      {/each}
    </div>
  {:else}
    <div class="rounded-lg border border-gray-700 bg-gray-800/70 p-6 text-center text-gray-300">
      Select a hero to view boon progression details.
    </div>
  {/if}
</section>
