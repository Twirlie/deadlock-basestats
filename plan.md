# plan

currently the app displays every heroes base stats in a basic manner. Let's take some steps to finish laying the groundwork for the project.



- the project needs an `agents.md` to provide context for agents in future tasks.
  - important details to provide are
    - this project uses node.js, typescript, svelte+vite, tailwind
    - it uses `./scripts/extract-hero-stats.ts` to selectively prune a `heroes.json` file containing all data relating to heroes from Deadlock
      - this `heroes.json` originated from `https://deadlock-api.com/`, specifically this was run `curl https://assets.deadlock-api.com/v2/heroes`. consider implementing `fetch('https://assets.deadlock-api.com/v2/heroes')` in `./scripts/extract-hero-stats.ts` to get the latest to keep up with future Deadlock patches
    - an outline explaining planned features to implement:
      - a fuzzy search that omits HeroCards not matching the search
      - stat ranking tierlist
        - this allows you to select a starting_stat and it generates a tierlist for all the heroes, showing who is best for that stat
      - ability to select two heroes and directly cross compare, highlighting differences showing who is superior/inferior/equal
      - show what stats heroes get with boons (level ups)
      - visual changes
        - the HeroCard should color code each stat based on weapon, vitality, spirit categories
        - download and include hero portrait icons to add flair to the HeroCards
    - I've included `./deadlock.md` with information on the game Deadlock. Include that the agent can reference that document if knowledge of the game is helpful for providing a response.
- currently the `./README.md` file is the default svelte+vite readme. lets change it to match our project.
- In my editor I have a notice displaying legacy mode for svelte. it provides a link explaining details [svelte legacy api](https://svelte.dev/docs/svelte/legacy-overview)
  - clarify if we are using Svelte 5 or not. If we are consider migrating to Svelte 5.