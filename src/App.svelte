<script lang="ts">
  import type { Hero } from './types'
  import HeroCard from './components/HeroCard.svelte'
  import heroesStats from '../data/heroes-stats.json'

  const heroes: Hero[] = heroesStats
</script>

<div class="min-h-screen bg-gray-90 p-4">
  <h1 class="text-3xl font-bold mb-6 text-center text-gray-200">
    Deadlock Hero Base Stats
  </h1>
  <div class="max-w-4xl mx-auto">
    <p class="text-center text-gray-300 mb-8">
      Explore the base stats of heroes in Deadlock.
    </p>
  </div>
  <div
    class="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6"
  >
    {#each heroes as hero}
      <HeroCard {hero} />
    {/each}
  </div>
</div>
