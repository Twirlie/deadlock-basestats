<script lang="ts">
  import type { Hero } from './types'
  import HeroSearch from './components/HeroSearch.svelte'
  import StatSelector from './components/StatSelector.svelte'
  import StatTierList from './components/StatTierList.svelte'
  import heroesStats from '../data/heroes-stats.json'

  const heroes: Hero[] = heroesStats
  let searchQuery = $state('')
  let activeTab = $state('search')
  let selectedStat = $state('max_health')

  // Extract unique stat keys from heroes data, sorted alphabetically
  const statKeys = $derived.by(() => {
    if (heroes.length === 0) return []
    return Object.keys(heroes[0].starting_stats).sort()
  })

  function handleStatChange(stat: string) {
    selectedStat = stat
  }

  const filteredHeroes = $derived.by(() => {
    if (searchQuery === '') {
      return heroes
    }

    const query = searchQuery.toLowerCase()
    const matches = heroes.filter((hero) =>
      hero.name.toLowerCase().includes(query),
    )
    const nonMatches = heroes.filter(
      (hero) => !hero.name.toLowerCase().includes(query),
    )

    return [...matches, ...nonMatches]
  })
</script>

<div class="min-h-screen bg-gray-90 p-4">
  <h1 class="text-3xl font-bold mb-6 text-center text-gray-200">
    Deadlock Hero Base Stats
  </h1>
  <div class="max-w-4xl mx-auto mb-6">
    <p class="text-center text-gray-300 mb-6">
      Explore the base stats of heroes in Deadlock.
    </p>
    <div class="flex gap-2 border-b border-gray-700">
      <button
        onclick={() => (activeTab = 'search')}
        class="{activeTab === 'search'
          ? 'bg-gray-700 text-white'
          : 'bg-gray-800 text-gray-400'} px-4 py-2 rounded-t-lg transition-colors cursor-pointer"
      >
        Search & Discovery
      </button>
      <button
        onclick={() => (activeTab = 'stats')}
        class="{activeTab === 'stats'
          ? 'bg-gray-700 text-white'
          : 'bg-gray-800 text-gray-400'} px-4 py-2 rounded-t-lg transition-colors cursor-pointer"
      >
        Stat Analysis
      </button>
      <button
        onclick={() => (activeTab = 'compare')}
        class="{activeTab === 'compare'
          ? 'bg-gray-700 text-white'
          : 'bg-gray-800 text-gray-400'} px-4 py-2 rounded-t-lg transition-colors cursor-pointer"
      >
        Hero Comparison
      </button>
      <button
        onclick={() => (activeTab = 'progression')}
        class="{activeTab === 'progression'
          ? 'bg-gray-700 text-white'
          : 'bg-gray-800 text-gray-400'} px-4 py-2 rounded-t-lg transition-colors cursor-pointer"
      >
        Progression
      </button>
    </div>
  </div>
  {#if activeTab === 'search'}
    <HeroSearch />
  {:else if activeTab === 'stats'}
    <div class="max-w-4xl mx-auto">
      <StatSelector {statKeys} {selectedStat} onStatChange={handleStatChange} />
      <StatTierList {heroes} {selectedStat} />
    </div>
  {:else if activeTab === 'compare'}
    <div class="max-w-4xl mx-auto">
      <p class="text-center text-gray-300 py-12">
        ⚖️ Phase 3: Hero Comparison (coming soon)
      </p>
      <p class="text-center text-gray-400 text-sm">
        Select 2 heroes to cross-compare stats side-by-side with visual
        highlighting of differences.
      </p>
    </div>
  {:else if activeTab === 'progression'}
    <div class="max-w-4xl mx-auto">
      <p class="text-center text-gray-300 py-12">
        📈 Phase 4: Progression (coming soon)
      </p>
      <p class="text-center text-gray-400 text-sm">
        View how hero stats scale with boons and leveling. Select boon levels to
        see dynamic stat adjustments.
      </p>
    </div>
  {/if}
</div>
