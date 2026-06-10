# QuinielaGo

<p align="center">
  <img src="assets/world_cup_2026_logo.png" alt="FIFA World Cup 2026 logo" width="120" />
</p>

QuinielaGo is a small local web app for running a FIFA World Cup 2026 quiniela. Add participants, choose the countries in play, spin the roulettes, and get a clear assignment summary for every player.

![QuinielaGo setup screen](assets/readme/quinielago-setup.png)

## Features

- **Participant setup:** add each player and choose how many teams they should receive.
- **Country selection:** include or exclude countries by official pot, with flags and live selected counts.
- **Balance check:** warns when selected countries and requested teams do not match, but still lets you play if you want.
- **Roulette draw:** spins first for the participant and then for the country assignment.
- **Country summary:** shows the assigned country, group rivals, best World Cup result, champion probability, probability ranking, and players to watch.
- **Player photos:** most featured players include local photos, with initials shown when a reliable photo is unavailable.
- **Final summary:** lists every participant's assigned countries and can export the results as a CSV file.

## Start The App

```powershell
cd "...\QuinielaGo"
python -m http.server 5174 --bind 127.0.0.1
```

Then open `http://127.0.0.1:5174/index.html`.
