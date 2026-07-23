# SnipStack

SnipStack conserve son architecture existante :

- frontend React/Vite utilisable dans le navigateur ;
- API Rails séparée ;
- PostgreSQL comme source de vérité ;
- option Desktop Tauri 2 qui embarque le même frontend.

La cible Desktop validée est exclusivement Linux sous WSL2/WSLg. Windows,
macOS et Linux natif n'ont pas été testés.

## Prérequis

Le projet requiert Node.js/npm, Ruby/Bundler, PostgreSQL et Rust/Cargo. Sous
Ubuntu WSL, les dépendances Linux de développement recommandées par Tauri 2
s'installent avec :

```bash
sudo apt update
sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file \
  libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev
```

`webkit2gtk-driver` et `tauri-driver` ne sont nécessaires que pour piloter un
artefact de production par WebDriver :

```bash
sudo apt install webkit2gtk-driver
cargo install tauri-driver --locked
```

Le smoke test courant utilise un driver embarqué réservé aux tests et ne
requiert pas ces deux outils externes.

## Backend Rails

Depuis `backend/` :

```bash
bundle install
bin/rails db:prepare
bundle exec rails server -b 127.0.0.1 -p 3000
```

L'API attendue par le Desktop est
`http://127.0.0.1:3000/api/v1`. Rails et PostgreSQL ne sont pas embarqués dans
l'application Tauri.

Vérifications :

```bash
bundle exec rails test
bundle exec rubocop
```

## Frontend navigateur

Depuis `frontend/` :

```bash
npm install
npm run dev
```

Le navigateur utilise son `fetch` natif et reste indépendant de Tauri.

Vérifications :

```bash
npm run lint
npm test
npm run build
```

Le smoke web Chrome Linux exige Rails et Vite actifs. Dans un autre terminal :

```bash
npm run test:web
```

## Développement Desktop sous WSLg

Lancer d'abord Rails sur `127.0.0.1:3000`, puis depuis `frontend/` :

```bash
env -u HTTP_PROXY -u HTTPS_PROXY -u NO_PROXY npm run tauri -- dev
```

Si WSLg présente des erreurs EGL/DMABUF, utiliser le contournement logiciel
validé pendant les runs :

```bash
env -u HTTP_PROXY -u HTTPS_PROXY -u NO_PROXY \
  WEBKIT_DISABLE_DMABUF_RENDERER=1 LIBGL_ALWAYS_SOFTWARE=1 \
  npm run tauri -- dev
```

La fenêtre est initialisée à `1280×800`, avec un minimum de `720×600`.

Pour vérifier le HMR dans la WebView elle-même, lancer la variante instrumentée
dans un premier terminal :

```bash
env -u HTTP_PROXY -u HTTPS_PROXY -u NO_PROXY \
  TAURI_WEBDRIVER_PORT=4445 \
  WEBKIT_DISABLE_DMABUF_RENDERER=1 LIBGL_ALWAYS_SOFTWARE=1 \
  npm run tauri -- dev --features webdriver \
  -c src-tauri/tauri.webdriver.conf.json
```

Puis, dans un second terminal :

```bash
env -u HTTP_PROXY -u HTTPS_PROXY -u NO_PROXY npm run test:desktop:hmr
```

## Configuration réseau

Copier `frontend/.env.example` vers `frontend/.env.desktop` pour surcharger la
configuration locale Tauri :

```dotenv
VITE_API_BASE_URL=http://127.0.0.1:3000/api/v1
```

Cette valeur est aussi le fallback intégré au client ; le fichier local
`.env.desktop` reste ignoré par Git afin de ne jamais versionner de secret.

Dans le navigateur, le client API utilise `fetch`. Dans Tauri, il utilise le
plugin HTTP officiel, car WebKitGTK a refusé le `fetch` Web direct vers l'API
HTTP locale. La capability de production limite ce plugin à
`http://127.0.0.1:3000/api/v1/**`.

Une future API distante devra impérativement utiliser HTTPS. Son URL devra être
mise à jour à la fois dans la configuration d'environnement et dans la
capability Tauri. Aucun secret ne doit être placé dans une variable `VITE_*`.

## Tests Desktop

Smoke test WSLg avec instrumentation Tauri réservée aux tests :

```bash
npm run test:desktop
```

Le feature Cargo `webdriver` ajoute uniquement aux builds de test les plugins
WDIO et leurs permissions. Il ne doit jamais être utilisé avec une commande de
bundle, `--all-features` ou un pipeline de publication. Le binaire de
production validé a été construit sans ce feature et ne contient pas ses
marqueurs.

Le pilotage d'un AppImage de production utilise `tauri-driver` et
`WebKitWebDriver` externes. Dans un premier terminal, démarrer le driver avec
les mêmes variables WSLg et sans les variables proxy vides :

```bash
env -u HTTP_PROXY -u HTTPS_PROXY -u NO_PROXY \
  WEBKIT_DISABLE_DMABUF_RENDERER=1 LIBGL_ALWAYS_SOFTWARE=1 \
  tauri-driver --native-driver /usr/bin/WebKitWebDriver
```

Dans un second terminal, lancer le client :

```bash
env -u HTTP_PROXY -u HTTPS_PROXY -u NO_PROXY \
  WEBKIT_DISABLE_DMABUF_RENDERER=1 LIBGL_ALWAYS_SOFTWARE=1 \
  npm run test:desktop:artifact
```

Le test offline exige que l'API Rails soit volontairement arrêtée :

```bash
env -u HTTP_PROXY -u HTTPS_PROXY -u NO_PROXY \
  WEBKIT_DISABLE_DMABUF_RENDERER=1 LIBGL_ALWAYS_SOFTWARE=1 \
  npm run test:desktop:offline
```

Le garde-fou de build refuse le feature `webdriver` dans un profil release.
Seul le probe de performance local documenté dans
`docs/desktop-performance.md` emploie l'override
`SNIPSTACK_ALLOW_RELEASE_WEBDRIVER=1`. Cet override, `--features webdriver` et
`--all-features` sont interdits pour tout artefact distribué.

## Builds

Depuis `frontend/` :

```bash
npm run build:desktop
npm run tauri -- build --no-bundle
npm run tauri -- build
```

Artefacts produits :

- `frontend/src-tauri/target/release/snipstack-desktop`
- `frontend/src-tauri/target/release/bundle/deb/SnipStack_0.1.0_amd64.deb`
- `frontend/src-tauri/target/release/bundle/appimage/SnipStack_0.1.0_amd64.AppImage`

## Logs et diagnostic

Depuis la racine du dépôt, vérifier d'abord que Rails écoute et répond :

```bash
ss -ltnp '( sport = :3000 )'
curl --fail --show-error http://127.0.0.1:3000/api/v1/snippets
```

Les requêtes et erreurs Rails se trouvent dans
`backend/log/development.log` :

```bash
tail -f backend/log/development.log
```

Les erreurs Tauri, Vite, WDIO et WebKitWebDriver sont écrites dans les
terminaux qui exécutent respectivement `tauri`, `wdio`, `tauri-driver` et
`WebKitWebDriver`. Si l'interface affiche `API status · offline`, contrôler
successivement le port `3000`, le `curl` ci-dessus, puis le log Rails. Les
variables proxy vides doivent être retirées avec `env -u` pour les tests
WebKitGTK externes.

Le rapport vérifié des commandes, versions, métriques et artefacts du dernier
audit est conservé dans `docs/desktop-validation.md`.

## Limites actuelles

- L'API doit être active pour charger ou modifier les snippets.
- L'état « offline » actuel est un état d'erreur avec reprise manuelle ; il ne
  constitue pas encore un mode hors ligne.
- Le login, le stockage local, la synchronisation bidirectionnelle et la
  résolution de conflits sont réservés aux runs futurs 13 à 17.
- Les artefacts ne sont ni signés ni publiés.

Les décisions et preuves détaillées se trouvent dans
[`brief.md`](brief.md), [`runs-workflow.md`](runs-workflow.md),
[`runs-journal`](runs-journal) et [`docs/`](docs/).
