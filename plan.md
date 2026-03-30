# deadlock hero base stat aggregation and compare tool

this is a tool to compare the base stat of deadlock heroes.

`heroes.json` is provided and contains all the data for each hero in deadlock.

## setup

runtime: node.js
language: typescript
frontend: svelte

# Pre-implementation

1) init a svelte project using typescript

## Implementation

1) data pruning step: parse `heroes.json` and extract into a new json document the `id`, `name`, `starting_stats` fields for each hero
2) build a web-app with a svelte frontend that lets the user browse multiple tables for each starting_stat with the heroes listed ranked in comparison to eachother for that stat
