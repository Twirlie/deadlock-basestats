<script lang="ts">
  import type { Hero } from '../types'

  export let heroes: Hero[] = []
  export let statName: string = ''

  interface StatValue {
    value: number
    display_stat_name: string
  }

  let sortedHeroes: Array<{ hero: Hero; value: number }> = []

  $: if (heroes.length > 0 && statName) {
    sortedHeroes = heroes
      .filter((h) => h.starting_stats[statName as keyof any])
      .map((h) => ({
        hero: h,
        value: (h.starting_stats[statName as keyof any] as StatValue).value,
      }))
      .sort((a, b) => b.value - a.value)
  }
</script>

<div class="overflow-x-auto">
  <table class="w-full border-collapse">
    <thead class="bg-gray-800 text-white">
      <tr>
        <th class="border border-gray-600 px-4 py-2 text-left">Rank</th>
        <th class="border border-gray-600 px-4 py-2 text-left">Hero Name</th>
        <th class="border border-gray-600 px-4 py-2 text-right"
          >{statName || 'Stat'}</th
        >
      </tr>
    </thead>
    <tbody>
      {#each sortedHeroes as { hero, value }, index}
        <tr class={index % 2 === 0 ? 'bg-gray-100' : 'bg-white'}>
          <td class="border border-gray-300 px-4 py-2">{index + 1}</td>
          <td class="border border-gray-300 px-4 py-2">{hero.name}</td>
          <td class="border border-gray-300 px-4 py-2 text-right font-semibold"
            >{value}</td
          >
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  /* Tailwind classes will handle styling; custom CSS here if needed */
</style>
