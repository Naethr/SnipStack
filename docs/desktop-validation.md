# Rapport de validation Desktop WSL/WSLg

**Date** : 23 juillet 2026  
**Branche** : `feature/desktop`  
**Base Git** : `b754bd2`  
**Plateforme** : Ubuntu 24.04.3 sous WSL2/WSLg, `x86_64`

Ce document conserve les résultats de la reprise corrective des runs 0 à 12.
Il complète le journal historique avec des preuves rejouées sur l'état final
du worktree. Aucun résultat de cette page ne vaut validation Windows, macOS ou
Linux natif.

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
| Chrome Linux | `147.0.7727.101` |
| Tauri CLI | `2.11.4` |
| crate Tauri | `2.11.5` |

## Vérifications automatisées

| Vérification | Résultat final |
| --- | --- |
| `npm run lint` | réussi |
| `npm test` | 2 fichiers, 12 tests réussis |
| `npm run test:web` | Chrome Linux, 2 scénarios réussis |
| `bundle exec rails test` | 4 tests, 47 assertions, 0 échec |
| `bundle exec rubocop` | 26 fichiers, aucune offense |
| `cargo fmt --check` | réussi |
| Clippy normal et avec feature de test | réussi avec `-D warnings` |
| smoke Tauri embarqué | 2 scénarios actifs réussis |
| HMR dans `tauri dev` | 1 scénario réussi dans la WebView |
| port Vite déjà occupé | échec explicite attendu sur `5173` |
| garde release WebDriver | échec explicite attendu sans override |

Le test Rails couvre désormais un préflight `OPTIONS` autorisé, les méthodes
CRUD et le refus des origines Tauri, tierce et `localhost`. Le client
JavaScript couvre séparément le transport navigateur et le transport Tauri.

## Baseline web rejouée

Sur 3 cartes dans Chrome Linux en mode développement :

```text
DOMContentLoaded=212.7 ms
load=248.6 ms
JSHeapUsedSize=28574336 octets
renderer TaskDuration=8.248 ms
scroll 24 frames=389.7 ms
pire frame=16.8 ms
```

Le smoke a aussi validé les largeurs `1440`, `1120`, `760` et `420 px`,
l'absence d'overflow horizontal, le filtre, le focus, le presse-papiers et le
CRUD web réel.

## Profil Desktop rejoué

Le probe release instrumenté a rendu 1 003 cartes :

```text
grille optimisée: médiane=1121 ms, pire frame=54 ms
grille originale fixed: médiane=1351 ms, pire frame=62 ms
filtre vers une carte=67 ms
```

Le test protège le gain comparatif avec une marge minimale de 5 %. Les jeux de
3, 100 et 1 000 fixtures ont été créés puis supprimés ; contrôle final :
`remaining=0`.

## Builds et artefacts

Les commandes suivantes ont réussi :

```bash
npm run build:desktop
npm run tauri -- build --no-bundle
npm run tauri -- build
```

| Artefact | Taille | SHA-256 |
| --- | ---: | --- |
| binaire `snipstack-desktop` | 18 009 520 octets | non distribué seul |
| `.deb` | 5 705 080 octets | `700c4cb73a46b9e4dca7831556d306b36697c43d6acc21785ea32f3d47165f8f` |
| AppImage | 79 948 280 octets | `49ddf511ad7b823534fbe7dc01ad87963adeec1826eeaade182aafdc7c8c901d` |

Le binaire normal est un ELF PIE x86-64. Après le probe instrumenté, un build
normal sans bundle a restauré le binaire de production. `strings` ne trouve
aucun marqueur `tauri_plugin_wdio` ou `wdio-webdriver` dans le binaire normal
ni dans l'AppImage.

## Cycle de vie AppImage

Le même AppImage de hash `49ddf511…c901d` a exécuté deux fois de suite le CRUD
complet avec succès. Le second lancement est indépendant du premier et couvre
la fermeture/réouverture.

Rails a ensuite été arrêté et l'absence d'écoute sur `127.0.0.1:3000` vérifiée.
Le test offline a confirmé l'interface, le statut offline, l'erreur explicite
et le bouton de reprise. Rails a été relancé ; l'API a de nouveau répondu
`200`.

Le pilote externe a journalisé quelques retries `element not interactable` et
un avertissement GStreamer `appsink not found`. Les scénarios se sont terminés
avec succès. Ces warnings restent spécifiques au pilotage WSLg observé.

## Non vérifié

- installation réelle du paquet Debian ;
- signature et publication des artefacts ;
- Windows, macOS et Linux natif ;
- audit de sécurité externe ;
- login, stockage offline réel et synchronisation.
