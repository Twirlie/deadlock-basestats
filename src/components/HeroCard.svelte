<script lang="ts">
  import type { Hero } from '../types'
  export let hero: Hero
  export let isMatch: boolean = true
</script>

<div
  class="{isMatch
    ? 'opacity-100'
    : 'opacity-10'} bg-gray-800 text-white p-4 rounded-lg shadow-lg transition-opacity duration-200"
>
  <h2 class="text-xl font-bold mb-2">{hero.name}</h2>
  <div class="grid grid-cols-2 gap-2">
    {#each Object.entries(hero.starting_stats) as [statName, statValue]}
      <div class="flex justify-between">
        <div class="w-full">
          <span class="font-semibold text-gray-200">{statName}</span>
          <span class="block text-gray-400">{statValue.value}</span>
        </div>
      </div>
    {/each}
  </div>
</div>
