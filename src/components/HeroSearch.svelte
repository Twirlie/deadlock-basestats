<script lang="ts">
  import type { Hero } from '../types'
  import HeroCard from './HeroCard.svelte'
  import heroesStats from '../../data/heroes-stats.json'

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

<div class="max-w-4xl mx-auto mb-6">
  <input
    type="text"
    bind:value={searchQuery}
    placeholder="Search heroes by name..."
    aria-label="Search heroes"
    class="w-full px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 text-center focus:outline-none focus:border-gray-500"
  />
</div>
<div
  class="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6"
>
  {#each filteredHeroes as hero}
    <HeroCard
      {hero}
      isMatch={searchQuery === '' ||
        hero.name.toLowerCase().includes(searchQuery.toLowerCase())}
    />
  {/each}
</div>
