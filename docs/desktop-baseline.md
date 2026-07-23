# Baseline avant intégration Tauri

**Date** : 23 juillet 2026  
**Environnement** : Ubuntu sous WSL2/WSLg, `x86_64`

## Toolchain observée

| Outil | Version |
| --- | --- |
| Node.js | `24.14.1` |
| npm | `11.14.0` |
| Ruby | `3.4.2` |
| Bundler | `4.0.5` |
| Rails | `8.0.5` |
| PostgreSQL client | `16.14` |
| Rust | `1.94.1` |
| Cargo | `1.94.1` |

WSLg est disponible avec `WAYLAND_DISPLAY=wayland-0` et `DISPLAY=:0`.

## État des checks avant Tauri

| Check | Résultat initial |
| --- | --- |
| `npm run lint` | Réussi |
| `npm run build` | Réussi en `240 ms` |
| Bundle JS | `288.02 kB`, gzip `98.84 kB` |
| Bundle CSS | `21.39 kB`, gzip `5.02 kB` |
| `bundle exec rails test` | Commande réussie mais `0` test et `0` assertion |
| `bundle exec rubocop` | Échec : 5 offenses de formatage, dont 4 autocorrigeables |

Les offenses et l'absence de tests sont antérieures à l'intégration Tauri.

## Baseline API

Serveur Rails observé sur `http://127.0.0.1:3000`.

Scénarios vérifiés :

- index : `200` avec les 3 snippets de développement ;
- origine Vite `http://127.0.0.1:5173` autorisée par CORS ;
- création : `201` et objet sérialisé ;
- modification : `200` ;
- validation invalide : `422` avec trois messages ;
- suppression : `204` ;
- lecture après suppression : `404`.

La donnée temporaire créée pour le smoke test a été supprimée.

## Référence visuelle vérifiée

Le frontend web a finalement été piloté dans Google Chrome Linux sous WSL,
sans utiliser Windows. Les captures suivantes sont conservées :

- `desktop-screenshots/web-1440x900.png` ;
- `desktop-screenshots/web-1120x800.png` ;
- `desktop-screenshots/web-760x800.png` ;
- `desktop-screenshots/web-420x900.png` ;
- `desktop-screenshots/web-720x600.png`.

À `1440×900`, Chrome a observé :

- titre et 3 cartes chargés ;
- appel `GET http://127.0.0.1:3000/api/v1/snippets` en `200` ;
- aucun avertissement, aucune erreur et aucune exception console ;
- aucun débordement horizontal (`scrollWidth <= clientWidth`) ;
- premier `Tab` sur le lien d'évitement avec focus visible ;
- raccourci `/` sur `#snippet-search` avec focus visible ;
- contrôles, liens, champs et titres correctement nommés dans l'arbre
  d'accessibilité.

Un `touch` sans changement de contenu sur `src/App.jsx` a produit
`[vite] hot updated: /src/App.jsx`, ce qui valide le HMR réel.

Le smoke web WDIO ajouté lors de l'audit correctif exécute également dans
Chrome Linux :

- chargement depuis Rails et statut connecté ;
- absence d'overflow horizontal à `1440`, `1120`, `760` et `420 px` ;
- filtre, raccourci `/`, focus visible, scroll et presse-papiers ;
- Outfit 400/500/600/700 réellement chargée sans requête Google Fonts ;
- `prefers-reduced-motion: reduce` émulé avec transitions et animations
  ramenées à `0.01 ms` ;
- création, modification et suppression via le transport `fetch` navigateur.

Le run vérifié du 23 juillet 2026 sur les 3 snippets de référence a mesuré :

| Signal Chrome 147, mode développement | Valeur |
| --- | ---: |
| `DOMContentLoaded` | `212.7 ms` |
| événement `load` | `248.6 ms` |
| heap JavaScript utilisé | `28 574 336 octets` |
| temps cumulé des tâches renderer | `8.248 ms` |
| profil scroll, 24 frames | `389.7 ms` |
| pire frame du profil | `16.8 ms` |

La méthode est reproductible par `npm run test:web`. Les métriques Chrome
`Performance.getMetrics` servent de signaux locaux CPU/mémoire ; elles ne
constituent pas un benchmark multi-machine.

Le frontend `develop` avant intégration a aussi été lancé dans un worktree
temporaire pour comparer Outfit distante et locale :

| Mesure Chrome à `1440×900` | `develop` distant | branche locale |
| --- | ---: | ---: |
| H1 largeur | `203.375 px` | `203.421875 px` |
| H1 hauteur | `41.53125 px` | `41.53125 px` |
| Premier titre largeur | `261.03125 px` | `261.03125 px` |
| Premier titre hauteur | `24.578125 px` | `24.578125 px` |
| Hauteur du document | `1699 px` | `1699 px` |
| Requêtes Google Fonts | 2 réponses `200` | 0 |

L'écart de largeur du H1 est de `0.046875 px`, sans changement de hauteur,
de retour à la ligne ni de hauteur totale. La capture avant modification est
`desktop-screenshots/web-develop-1440x900.png`.

Le générateur `backend/script/desktop_performance_fixtures.rb` constitue les
trois jeux de données demandés :

- petit : 3 snippets ;
- moyen : 100 snippets ;
- volumineux : 1 000 snippets numérotés.

Depuis `backend/`, remplacer `100` par `3` ou `1000`, puis toujours supprimer
les données temporaires après la mesure :

```bash
bin/rails runner script/desktop_performance_fixtures.rb create 100
bin/rails runner script/desktop_performance_fixtures.rb delete
```

Les trois tailles ont été créées puis nettoyées pendant les runs ; le dernier
contrôle a confirmé `remaining=0`.

## Limites

- Le navigateur n'était pas disponible lors de la première tentative ; la
  preuve Chrome a été complétée lors de l'audit final.
- Le profil Chrome a été effectué en mode développement. Les mesures de
  performance de la WebView release sont séparées dans
  `desktop-performance.md`.
- Aucun score automatisé de contraste ni lecteur d'écran réel n'a été utilisé.
