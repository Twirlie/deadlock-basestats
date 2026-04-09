<script lang="ts">
  import type { Hero } from '../types'

  interface Props {
    heroes: Hero[]
  }

  type RowStatus = 'left' | 'right' | 'equal'

  interface ComparisonRow {
    statKey: string
    statLabel: string
    leftValue: number
    rightValue: number
    absoluteDiff: number
    percentDiff: number | null
    status: RowStatus
  }

  const { heroes = [] }: Props = $props()

  let leftQuery = $state('')
  let rightQuery = $state('')

  const sortedHeroes = $derived.by(() => [...heroes].sort((a, b) => a.name.localeCompare(b.name)))

  let leftHeroId = $state<number | null>(null)
  let rightHeroId = $state<number | null>(null)

  $effect(() => {
    if (sortedHeroes.length === 0) {
      leftHeroId = null
      rightHeroId = null
      return
    }

    if (leftHeroId === null) {
      leftHeroId = sortedHeroes[0].id
    }

    if (rightHeroId === null) {
      rightHeroId = sortedHeroes[1]?.id ?? sortedHeroes[0].id
    }
  })

  const leftOptions = $derived.by(() => {
    const query = leftQuery.trim().toLowerCase()
    if (!query) return sortedHeroes
    return sortedHeroes.filter((hero) => hero.name.toLowerCase().includes(query))
  })

  const rightOptions = $derived.by(() => {
    const query = rightQuery.trim().toLowerCase()
    if (!query) return sortedHeroes
    return sortedHeroes.filter((hero) => hero.name.toLowerCase().includes(query))
  })

  const leftHero = $derived.by(
    () => heroes.find((hero) => hero.id === leftHeroId) ?? null,
  )
  const rightHero = $derived.by(
    () => heroes.find((hero) => hero.id === rightHeroId) ?? null,
  )

  const comparisonRows = $derived.by((): ComparisonRow[] => {
    if (!leftHero || !rightHero) return []

    const statKeys = Array.from(
      new Set([
        ...Object.keys(leftHero.starting_stats),
        ...Object.keys(rightHero.starting_stats),
      ]),
    ).sort()

    return statKeys
      .map((statKey) => {
        const leftValue = leftHero.starting_stats[statKey]?.value ?? 0
        const rightValue = rightHero.starting_stats[statKey]?.value ?? 0
        const absoluteDiff = leftValue - rightValue

        let status: RowStatus = 'equal'
        if (absoluteDiff > 0) status = 'left'
        if (absoluteDiff < 0) status = 'right'

        const percentDiff =
          rightValue !== 0 ? (absoluteDiff / rightValue) * 100 : null

        return {
          statKey,
          statLabel: formatStatName(statKey),
          leftValue,
          rightValue,
          absoluteDiff,
          percentDiff,
          status,
        }
      })
      .filter((row) => row.status !== 'equal')
  })

  function formatStatName(stat: string): string {
    return stat
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  function formatValue(value: number): string {
    if (Number.isInteger(value)) return String(value)
    return value.toFixed(2)
  }

  function formatAbsoluteDiff(diff: number): string {
    if (diff === 0) return '0'
    const prefix = diff > 0 ? '+' : ''
    return `${prefix}${formatValue(diff)}`
  }

  function formatPercentDiff(percent: number | null): string {
    if (percent === null) return 'N/A'
    if (percent === 0) return '0.0%'
    const prefix = percent > 0 ? '+' : ''
    return `${prefix}${percent.toFixed(1)}%`
  }

  function getRowClass(status: RowStatus): string {
    if (status === 'left') return 'border-l-4 border-emerald-500 bg-emerald-950/20'
    if (status === 'right') return 'border-l-4 border-rose-500 bg-rose-950/20'
    return 'border-l-4 border-slate-500 bg-slate-800/40'
  }

  function getBadgeClass(status: RowStatus): string {
    if (status === 'left') return 'bg-emerald-600/25 text-emerald-300'
    if (status === 'right') return 'bg-rose-600/25 text-rose-300'
    return 'bg-slate-600/25 text-slate-300'
  }

  function getBadgeLabel(status: RowStatus): string {
    if (status === 'left') return 'Left Better'
    if (status === 'right') return 'Right Better'
    return 'Equal'
  }

  function handleLeftHeroChange(event: Event): void {
    const target = event.currentTarget as HTMLSelectElement
    const nextId = Number(target.value)
    if (Number.isNaN(nextId)) return

    leftHeroId = nextId
    if (rightHeroId === nextId) {
      const fallback = sortedHeroes.find((hero) => hero.id !== nextId)
      rightHeroId = fallback ? fallback.id : nextId
    }
  }

  function handleRightHeroChange(event: Event): void {
    const target = event.currentTarget as HTMLSelectElement
    const nextId = Number(target.value)
    if (Number.isNaN(nextId)) return

    rightHeroId = nextId
    if (leftHeroId === nextId) {
      const fallback = sortedHeroes.find((hero) => hero.id !== nextId)
      leftHeroId = fallback ? fallback.id : nextId
    }
  }
</script>

<section class="space-y-6">
  <div class="rounded-lg border border-gray-700 bg-gray-800/70 p-4">
    <h2 class="text-lg font-semibold text-gray-100 mb-1">Hero Comparison</h2>
    <p class="text-sm text-gray-300">
      Select two heroes to compare starting stats side-by-side with value and percentage differences.
    </p>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div class="rounded-lg bg-gray-800 p-4 border border-gray-700 space-y-3">
      <p class="text-sm text-gray-400">Left Hero</p>
      <input
        type="text"
        bind:value={leftQuery}
        placeholder="Filter heroes..."
        aria-label="Filter left hero list"
        class="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-gray-500"
      />
      <select
        onchange={handleLeftHeroChange}
        value={leftHeroId ?? ''}
        aria-label="Select left hero"
        class="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-gray-100 focus:outline-none focus:border-gray-500"
      >
        {#if leftOptions.length === 0}
          <option disabled value={leftHeroId ?? ''}>No heroes match filter</option>
        {:else}
          {#each leftOptions as hero}
            <option value={hero.id}>{hero.name}</option>
          {/each}
        {/if}
      </select>
    </div>

    <div class="rounded-lg bg-gray-800 p-4 border border-gray-700 space-y-3">
      <p class="text-sm text-gray-400">Right Hero</p>
      <input
        type="text"
        bind:value={rightQuery}
        placeholder="Filter heroes..."
        aria-label="Filter right hero list"
        class="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-gray-500"
      />
      <select
        onchange={handleRightHeroChange}
        value={rightHeroId ?? ''}
        aria-label="Select right hero"
        class="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-gray-100 focus:outline-none focus:border-gray-500"
      >
        {#if rightOptions.length === 0}
          <option disabled value={rightHeroId ?? ''}>No heroes match filter</option>
        {:else}
          {#each rightOptions as hero}
            <option value={hero.id}>{hero.name}</option>
          {/each}
        {/if}
      </select>
    </div>
  </div>

  {#if leftHero && rightHero}
    <div class="rounded-lg border border-gray-700 overflow-hidden">
      <div class="grid grid-cols-[1.6fr_1fr_1fr_1fr_1fr_1fr] gap-3 px-4 py-3 bg-gray-800 text-xs uppercase tracking-wide text-gray-400">
        <span>Stat</span>
        <span>{leftHero.name}</span>
        <span>{rightHero.name}</span>
        <span>Diff</span>
        <span>Delta</span>
        <span>Outcome</span>
      </div>
      {#each comparisonRows as row}
        <div class="grid grid-cols-[1.6fr_1fr_1fr_1fr_1fr_1fr] gap-3 px-4 py-3 text-sm text-gray-200 {getRowClass(row.status)}">
          <span class="font-medium">{row.statLabel}</span>
          <span>{formatValue(row.leftValue)}</span>
          <span>{formatValue(row.rightValue)}</span>
          <span>{formatAbsoluteDiff(row.absoluteDiff)}</span>
          <span>{formatPercentDiff(row.percentDiff)}</span>
          <span>
            <span class="inline-flex rounded-full px-2.5 py-1 text-xs font-medium {getBadgeClass(row.status)}">
              {getBadgeLabel(row.status)}
            </span>
          </span>
        </div>
      {/each}
    </div>
  {:else}
    <div class="rounded-lg border border-gray-700 bg-gray-800/70 p-6 text-center text-gray-300">
      Select two heroes to start the comparison.
    </div>
  {/if}
</section>
