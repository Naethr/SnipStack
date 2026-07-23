# Durcissement Tauri

**Date** : 23 juillet 2026  
**Cible validée** : Ubuntu WSL2 x86_64 avec WSLg

## Surface native de production

Le runtime initialise :

- Tauri 2 ;
- le plugin HTTP officiel Tauri sans ses features par défaut : uniquement
  `rustls-tls`, `http2` et `charset`.

Il n'initialise ni Shell, ni Store, ni Clipboard, ni système de fichiers. Les
plugins WebDriver sont optionnels dans Cargo et compilés uniquement avec le
feature `webdriver`.

Le feature `cookies` du plugin HTTP est désactivé. Aucun cookie jar natif
persistant n'est créé implicitement ; ce choix devra être redéfini
explicitement avec le futur modèle d'authentification.

`build.rs` refuse tout profil Cargo `release` qui active le feature
`webdriver`, ce qui couvre aussi `--all-features`. Le probe de performance
local doit fournir explicitement
`SNIPSTACK_ALLOW_RELEASE_WEBDRIVER=1`; cet override est interdit pour un
artefact de publication.

L'arbre Cargo normal à profondeur 1 contient `tauri-plugin-http` et aucun
plugin WDIO. Avec `--features webdriver`, les deux plugins WDIO apparaissent,
ce qui confirme la séparation du profil de test.

## Capability

`src-tauri/capabilities/default.json` est l'unique fichier de capability de
production. Il s'applique seulement à la fenêtre `main` et accorde :

- `http:default` limité à
  `http://127.0.0.1:3000/api/v1/**`.

`core:default` a été retiré du profil de production après audit : aucune API
core native n'est appelée par l'application. Le profil WebDriver le conserve
uniquement pour l'instrumentation de test.

Le profil `tauri.webdriver.conf.json` ajoute des permissions WDIO uniquement
au build de test. Le binaire release normal a été inspecté avec `strings` :
aucun marqueur `tauri_plugin_wdio` ou `wdio-webdriver` n'y a été trouvé.

## Politique de contenu

La CSP de production est :

```text
default-src 'self';
base-uri 'none';
connect-src 'self' ipc: http://ipc.localhost;
font-src 'self';
form-action 'self';
frame-ancestors 'none';
img-src 'self' data:;
object-src 'none';
style-src 'self';
```

Les scripts, styles et polices proviennent du bundle. Outfit est embarquée
localement. Aucun domaine Google Fonts ou CDN n'est autorisé.

`style-src 'unsafe-inline'` a été retiré après validation du smoke WSLg. Aucun
script inline, style inline ou `unsafe-eval` n'est autorisé.

## Réseau

- Le navigateur utilise `fetch` et le CORS Rails limité aux origines Vite
  locales.
- Tauri utilise le plugin HTTP natif et ne nécessite pas d'autoriser
  `tauri://localhost` dans le CORS Rails.
- L'endpoint HTTP en clair est acceptable uniquement pour l'API locale de
  développement sous WSL.
- Toute API distante future devra être en HTTPS et recevoir un scope de
  capability explicite.

## Rendu des snippets

La recherche dans `frontend/src` et `backend/app` n'a trouvé aucun
`dangerouslySetInnerHTML`, assignement `innerHTML`, `eval` ou
`new Function`. Le code des snippets est rendu comme texte dans un élément
`code`/`pre`; il n'est pas exécuté.

## Vérifications exécutées

- `npm audit --omit=dev` : 0 vulnérabilité.
- `npm run lint` : réussi après exclusion des artefacts Cargo générés.
- `cargo fmt --check` : réussi.
- `cargo clippy --all-targets -- -D warnings` : réussi.
- `cargo clippy --all-targets --features webdriver -- -D warnings` : réussi.
- `bundle exec rails test` : 4 tests, 41 assertions, 0 échec.
- `bundle exec rubocop` : 26 fichiers, aucune offense.
- smoke Tauri avec la CSP de production : réussi.
- arbre des features Cargo : aucune feature `cookies`/`cookie_store`.
- binaire release normal : aucun marqueur WebDriver.
- `cargo check --release --features webdriver` sans override : échec attendu
  avec le message du garde-fou.

## Incertitudes

- Aucun audit de sécurité externe ni test de pénétration n'a été réalisé.
- L'authentification, les secrets de session, le stockage offline et la
  synchronisation ne font pas partie de cette passe.
- Les artefacts ne sont pas signés.
- L'override du probe peut volontairement produire un binaire release
  instrumenté. Le run de performance restaure ensuite immédiatement un binaire
  normal avec `tauri build --no-bundle`.
