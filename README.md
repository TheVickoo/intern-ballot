# The Readymedygo Almanac

A Monte Carlo simulator for the QLD Health Intern Ballot — helps prospective junior doctors estimate the probability of being posted to each Queensland hospital for their internship year.

Built by [Zennjo Searle](https://zennjo.com) & Lizzie Keir. Fifty thousand simulated ballots, drawn by Monty the soothsayer.

## How it works

1. **Rank your preferences** — drag hospitals into your desired order.
2. **Set the field** — load historical, live, or extrapolated first-preference data.
3. **Cast the lots** — Monty runs 50,000 Monte Carlo trials of the ballot process.

The simulator models the allocation algorithm: applicants placed at their first preference, random displacement from oversubscribed hospitals, and redistribution weighted by the broader field's preferences. Solo and joint (couple) modes are supported.

## Usage

Open `index.html` in a browser, or serve the directory with any static file server:

```bash
npx serve .
```

## Project structure

```
index.html   — the almanac page (layout, copy, UI structure)
style.css    — newspaper-inspired typography and layout
script.js    — Monte Carlo engine, state management, and UI logic
```

## Development

This is a static single-page application with no build step or dependencies. Edit the files directly and reload the browser.

```bash
# Serve locally for development
python3 -m http.server 8000
```

## License

MIT
