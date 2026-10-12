# Pocket Parade

Pocket Parade is an original, browser-based poker-night roguelike. Pick five cards from your hand, make the best poker combination you can, and score enough chips to beat each round's blind. Between rounds, spend your winnings on little house advantages.

## Play the demo

[Play Pocket Parade in your browser](https://moopdee.github.io/pocket-parade/)

## Play

Open `index.html` in a modern browser, or serve this folder locally:

```powershell
python -m http.server 8000
```

Then visit `http://localhost:8000`.

- Click cards to select exactly five, then choose **Play hand**.
- The preview shows the poker hand and its score before you play it. Each hand has a base chip value and multiplier; the ranks you play add chips, and upgrades can change either part.
- Use up to three discards to improve your cards; you get four hands per round.
- Beat the blind to earn cash and shop for an upgrade.
- Clear all three rounds to win.

The game is a self-contained static site with no install, account, or external gameplay services. Google Fonts are loaded from a CDN; otherwise the game runs locally in your browser.

## Deploy with GitHub Pages

GitHub Actions deploys this site automatically when changes are pushed to `main`. The first deployment may take a minute or two; check the **Actions** tab if the demo link is not live yet.
