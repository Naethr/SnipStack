# Profilage Desktop WSLg

**Date** : 23 juillet 2026  
**Environnement** : Ubuntu WSL2 x86_64, WSLg, WebKitGTK 605.1.15  
**Build** : Tauri release optimisé avec instrumentation WebDriver réservée aux tests

## Jeu de mesure

- 1 000 snippets temporaires ajoutés à la base de développement avec le tag
  `desktop-perf-20260723`.
- 3 snippets préexistants conservés, soit 1 003 cartes rendues.
- Toutes les données temporaires ont été supprimées après les mesures
  (`deleted=1000`, `remaining=0`).

## Procédure reproductible

Avec Rails actif sur `127.0.0.1:3000`, créer puis supprimer les fixtures depuis
`backend/` :

```bash
bin/rails runner script/desktop_performance_fixtures.rb create 1000
bin/rails runner script/desktop_performance_fixtures.rb delete
```

Entre ces deux commandes, construire le binaire release instrumenté et lancer
uniquement le probe depuis `frontend/` :

```bash
SNIPSTACK_ALLOW_RELEASE_WEBDRIVER=1 \
  npm run tauri -- build --no-bundle --features webdriver \
  -c src-tauri/tauri.webdriver.conf.json
DESKTOP_PERF=1 TAURI_APP_BINARY=./src-tauri/target/release/snipstack-desktop \
  WEBKIT_DISABLE_DMABUF_RENDERER=1 LIBGL_ALWAYS_SOFTWARE=1 \
  npm exec -- wdio run wdio.conf.js --spec ./test/desktop/performance.spec.js
```

Le feature `webdriver` est réservé à ce binaire de mesure non distribué. Il ne
doit jamais être passé à une commande de bundle ou à un pipeline
`--all-features`.

## Résultats observés

| Probe | Résultat |
| --- | ---: |
| Cartes rendues | 1 003 |
| Temps observé au probe final après le démarrage | 2 101 ms |
| Filtrage vers une carte, sur deux frames | 65 ms |
| Position atteinte par le profil scroll | `scrollY=312401` |

Ces valeurs incluent la WebView WSLg et constituent une mesure locale, pas un
benchmark multi-machine. Le temps observé au probe est relevé avec
`performance.now()` lorsque les 1 003 cartes sont déjà présentes ; il ne
sépare pas réseau, IPC, React et rendu.

## Profil CSS comparatif

Chaque variante a été mesurée trois fois, en alternant l'ordre. Un passage
parcourt la liste sur 24 frames. Le rendu logiciel WSLg impose un rythme lent :
les 23 intervalles mesurés dépassent `25 ms`. Les chiffres servent donc à
comparer les variantes dans le même environnement, pas à annoncer un framerate
absolu.

Avant optimisation :

| Variante temporaire | Durée médiane | Pire frame médiane |
| --- | ---: | ---: |
| CSS original dans Tauri | `1327 ms` | `61 ms` |
| Sans blur topbar | `1333 ms` | `60 ms` |
| Sans grille fixe masquée | `1094 ms` | `51 ms` |
| Sans image de grille | `1250 ms` | `57 ms` |
| Sans masque | `1165 ms` | `55 ms` |
| Grille non fixe | `1103 ms` | `50 ms` |
| Sans grandes ombres | `1296 ms` | `137 ms` |
| Sans animations/transitions | `1351 ms` | `70 ms` |

La position fixe de `body::before` est le seul facteur qui explique presque
tout le gain sans supprimer la décoration. Le frontend marque donc uniquement
la runtime Tauri avec `data-runtime="tauri"` et passe ce pseudo-élément en
`position: absolute`. Le navigateur garde exactement la règle originale.

Après optimisation :

| Mesure | Avant | Après | Évolution |
| --- | ---: | ---: | ---: |
| Durée médiane | `1327 ms` | `1114 ms` | `-16.1 %` |
| Pire frame médiane | `61 ms` | `51 ms` | `-16.4 %` |

La reprise corrective du 23 juillet 2026 a reproduit le gain avec la version
finale du probe :

| Variante | Durée médiane | Pire frame médiane |
| --- | ---: | ---: |
| Grille optimisée Tauri | `1121 ms` | `54 ms` |
| Grille originale forcée en `fixed` | `1351 ms` | `62 ms` |

Le filtre vers une carte a pris `67 ms`. Le test échoue désormais si la grille
originale n'est pas au moins 5 % plus lente que la variante optimisée. Les
1 000 fixtures ont été supprimées après le run (`remaining=0`).

Après ce changement, retirer en plus blur, grille ou masque ne produit plus de
gain reproductible. Retirer les grandes ombres abaisse légèrement la durée
mais porte la pire frame médiane à `129 ms`; cette piste est rejetée.

## Décision

Une seule optimisation conditionnelle et mesurée est conservée. Les captures
Tauri ont été régénérées aux quatre tailles et inspectées après changement :
aucune rupture visuelle n'est observée au lancement. Le web n'est pas modifié.

La virtualisation et `content-visibility` restent des pistes futures si un
volume utilisateur réel comparable à 1 000 snippets devient une exigence.
La règle `prefers-reduced-motion` demeure présente et est vérifiée par le
smoke test Desktop. La consommation CPU/GPU n'a pas été isolée avec un
profileur système ; les résultats restent propres au rendu logiciel WSLg.
