<script lang="ts">
  import type { Hero } from '../types'

  export let heroes: Hero[] = []
  export let selectedHero: Hero | null = null

  const onSelectHero = (hero: Hero) => {
    selectedHero = hero
  }
</script>

<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
  {#each heroes as hero}
    <button
      on:click={() => onSelectHero(hero)}
      class={`p-4 rounded-lg border-2 transition-all ${
        selectedHero?.id === hero.id
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 bg-white hover:border-blue-300'
      }`}
    >
      <div class="font-semibold text-lg">{hero.name}</div>
      <div class="text-sm text-gray-600">ID: {hero.id}</div>
    </button>
  {/each}
</div>

<style>
  /* Tailwind classes will handle styling */
</style>
