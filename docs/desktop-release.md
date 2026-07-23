# Validation de la release Desktop

**Date** : 23 juillet 2026  
**Plateforme** : Ubuntu WSL2 x86_64, WSLg  
**Portée** : Linux WSLg uniquement

## Toolchain observée

- Node.js `24.14.1`
- npm `11.14.0`
- Ruby `3.4.2`
- Bundler `4.0.5`
- Rails `8.0.5`
- PostgreSQL client `16.14`
- Rust/Cargo `1.94.1`
- Tauri CLI `2.11.4`
- crate Tauri `2.11.5`

## Builds

Les commandes suivantes ont réussi :

```bash
npm run build:desktop
npm run tauri -- build --no-bundle
npm run tauri -- build
```

Le binaire release normal est un ELF PIE x86-64 dynamiquement lié de 18 MiB.

## Artefacts

| Artefact | Taille | SHA-256 du run |
| --- | ---: | --- |
| `bundle/deb/SnipStack_0.1.0_amd64.deb` | 5 705 080 octets | `700c4cb73a46b9e4dca7831556d306b36697c43d6acc21785ea32f3d47165f8f` |
| `bundle/appimage/SnipStack_0.1.0_amd64.AppImage` | 79 948 280 octets | `49ddf511ad7b823534fbe7dc01ad87963adeec1826eeaade182aafdc7c8c901d` |

Chemins complets relatifs au frontend :

```text
src-tauri/target/release/bundle/deb/SnipStack_0.1.0_amd64.deb
src-tauri/target/release/bundle/appimage/SnipStack_0.1.0_amd64.AppImage
```

Ces sommes correspondent au run local et changent à chaque reconstruction.
Le répertoire `target/` est ignoré par Git.

## Validation WSLg

- lancement du binaire release normal : processus stable, puis fermeture
  volontaire ;
- AppImage de hash `49ddf511…c901d` piloté par
  `tauri-driver`/`WebKitWebDriver` : connexion API et CRUD complet réussis ;
- second lancement indépendant du même AppImage et du même hash : même CRUD
  réussi, ce qui couvre fermeture et réouverture ;
- API volontairement arrêtée au lancement : interface conservée, statut
  `offline`, erreur explicite et bouton `Try again` présents ;
- clic sur `Try again` sans API : nouvelle tentative exécutée et état offline
  cohérent ;
- API relancée ensuite et serveur de développement restauré sur le même port ;
- aucune donnée de smoke ou de performance temporaire restante.

Le test offline a été exécuté après arrêt vérifié du port `3000`. Rails a
ensuite été relancé sur `127.0.0.1:3000`, un `GET /api/v1/snippets` a répondu
`200`, et le nettoyage final a confirmé `remaining=0`.

WebKitWebDriver a parfois journalisé `element not interactable` avant de
réessayer une interaction ; les deux suites AppImage se sont néanmoins
terminées avec succès. Des avertissements EGL/DRI3 et GStreamer ont été vus
dans le driver externe. Le contournement logiciel utilisé est :

```bash
WEBKIT_DISABLE_DMABUF_RENDERER=1 LIBGL_ALWAYS_SOFTWARE=1
```

## Dépendances et limites

- Rails et PostgreSQL doivent être lancés séparément.
- Le paquet `webkit2gtk-driver` est requis seulement pour le pilotage externe,
  pas pour l'usage normal de l'AppImage.
- L'AppImage et le paquet Debian ne sont pas signés.
- Le paquet Debian n'a pas été installé dans le système WSL afin de ne pas
  effectuer de mutation système ; sa construction est validée, son cycle
  d'installation ne l'est pas.
- Windows, macOS et Linux natif ne sont pas testés.
