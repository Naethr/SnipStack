# Préparation V1 navigateur locale — 19 novembre 2026

**Branche :** `UI-rework`, `HEAD 8d6249b`.  
**Périmètre :** revue avant `develop`, puis V1 navigateur locale sur `main`.  
**Statut :** `completed` pour ce run navigateur ; aucune validation native Tauri.

Cette mise à jour remplace les verdicts de l'audit initial du même jour.
Le déroulé historique reste dans `runs-journal.md`. Aucun commit, push, merge,
rebase, changement de branche ni modification du staging. Aucun changement de
backend métier, de migration, de dépendance ou de logique de seed ; seul le
texte d'un exemple de snippet dans `backend/db/seeds.rb` a été corrigé.

## Verdicts

| Fusion envisagée | Verdict | Motif et conditions |
| --- | --- | --- |
| `UI-rework` → `develop` | **prêt** pour revue du contenu local testé | Frontend, suite WDIO versionnée, parcours réels avec Rails et rendu desktop/mobile vérifiés. Revoir et commiter vous-même le contenu local avant de fusionner : les têtes Git sont encore identiques. |
| `develop` → `main`, V1 navigateur locale | **prêt sous réserve** | Intégrer d'abord ces corrections dans `develop`, rejouer les checks sur son commit exact et conserver le périmètre navigateur/local. La dette de maintenance Rails reste explicite. Ni publication distante ni desktop natif inclus dans ce verdict. |

## Diagnostic de `npm run dev`

**Précision de l'utilisateur après validation :** l'erreur initialement
signalée venait d'un lancement depuis la racine au lieu de `frontend/`.
Le démarrage ne nécessite donc aucun correctif npm/Vite. Il suffit de lancer
`cd frontend` puis `npm run dev`, ou `npm --prefix frontend run dev` depuis
la racine. La sortie de ce lancement initial à la racine n'a pas été recueillie.

L'erreur `EPERM` ci-dessous est distincte : elle a été observée dans le sandbox
de l'agent et n'explique pas le problème initial de l'utilisateur.

Commande exécutée depuis `/home/theo/projects/SnipStack/frontend`, sans
modification préalable : `npm run dev`.

Sortie pertinente complète, **code de sortie 1** dans le sandbox :

```text
> frontend@0.0.0 dev
> vite

error when starting dev server:
Error: listen EPERM: operation not permitted 127.0.0.1:5173
    at Server.setupListenHandle [as _listen2] (node:net:2302:21)
    at listenInCluster (node:net:2433:12)
    at node:net:2662:7
    at process.processTicksAndRejections (node:internal/process/task_queues:90:21) {
  code: 'EPERM',
  errno: -1,
  syscall: 'listen',
  address: '127.0.0.1',
  port: 5173
}
```

**Cause de cet EPERM de validation : restriction des sockets dans le sandbox.**
Un serveur TCP Node minimal échoue aussi avec `EPERM` sur `127.0.0.1`, même
avec le port automatique `0`. Le contrôle hors sandbox ne trouve aucun
listener sur 5173 ou 3000 au départ. Aucun override Vite/Tauri pertinent n'est
présent. Le script npm est bien `vite`, installé en version 8.1.5.

Sans changer script, configuration, versions ou dépendances, la même commande
avec l'accès réseau local autorisé démarre :

```text
> frontend@0.0.0 dev
> vite

VITE v8.1.5 ready in 395 ms
➜ Local: http://127.0.0.1:5173/
```

`ss` confirme l'écoute sur `127.0.0.1:5173`. GET `/` et `/src/main.jsx`
retournent **HTTP 200**, curl sort avec le code 0. Chromium ouvre réellement
la page et les parcours ci-dessous traversent Rails. Le processus Vite a
ensuite été arrêté volontairement avec Ctrl+C, sortie 130 ; ce n'est pas un
échec de démarrage.

Le README précise le bon répertoire de lancement et distingue les restrictions
du sandbox d'un éventuel port occupé. Aucun correctif npm/Vite, contournement
de configuration ou réinstallation. Le port strict 5173, cohérent avec CORS,
est conservé.

Démarrage depuis la racine, dans deux terminaux :

```bash
cd backend
source ~/.rvm/scripts/rvm
rvm use .
bin/rails server -b 127.0.0.1 -p 3000
```

```bash
cd frontend
npm run dev
```

PostgreSQL et les dépendances du projet doivent déjà être disponibles. La page
s'ouvre sur `http://127.0.0.1:5173/`. Le README distingue installation initiale
et diagnostic d'un environnement déjà installé.

## Modifications ciblées

- `frontend/src/index.css` : avec une adresse e-mail longue, les boutons
  d'en-tête « Sign out » et « New snippet » se comprimaient et leurs libellés
  se coupaient sur deux lignes à 1440 px. Ajout de `flex-shrink: 0` et
  `white-space: nowrap` sur ces boutons uniquement. L'adresse garde son
  ellipse. Vérification après changement : une seule ligne de texte par
  bouton, aucun champ hors écran ni débordement à 1440/1024/820/720/390/320 px.
  Pas d'autre changement de palette, disposition ou effet visuel.
- `frontend/src/App.jsx` : l'aide de connexion mentionne désormais l'expiration
  serveur en plus du rechargement/fermeture ; même élément et même style.
- `frontend/test/web/snipstack.spec.js` : attente observable d'une carte avant
  la mesure ; aucun délai arbitraire. Assertions responsive/overflow conservées,
  largeurs 390 et 320 px ajoutées. Le compte doit contenir au moins un snippet.
- `frontend/wdio.web.conf.js` : `CHROME_BINARY` optionnel, sans changer la valeur
  par défaut. Cela permet d'exécuter la suite versionnée avec Chromium installé
  ailleurs, sans copie diagnostique ou configuration temporaire.
- `README.md` : démarrage vérifié, séparation des prérequis web/natifs, sessions,
  tests et diagnostic JWT. Saisie masquée du mot de passe/token ; aucun secret
  d'exemple. Le header curl transite par stdin, pas ses arguments.
- `backend/db/seeds.rb` : seul l'exemple « React fetch example » prend le JWT
  en argument, envoie `Authorization: Bearer ...` et contrôle le statut HTTP.
  Aucun compte créé par les seeds ni mot de passe codé en dur.
- `docs/ui-refresh/README.md` : suppression de 32 liens Markdown vers des PNG
  absents des clones. Les noms de captures deviennent des références locales
  optionnelles ; le texte décrit les choix visuels indépendamment des images.
- Ce rapport et `runs-journal.md` : résultats et limites actualisés.

Les changements préexistants de la refonte restent présents. Aucun manifeste,
lockfile, fichier Tauri, contrôleur, modèle ou migration modifié dans ce run.

## Commandes et résultats après corrections

Environnement : WSL2 x86-64, Node 24.20.0, npm 11.19.0. Backend exécuté avec
Ruby 3.4.2 / Bundler 4.0.5 / Rails 8.0.5 déjà installés via sélection RVM.

| Commande/contrôle | Résultat |
| --- | --- |
| `npm run dev` dans le sandbox | Échec reproduit, sortie 1, socket `EPERM`. |
| Même `npm run dev` avec permission de socket locale | Démarrage en 395 ms, HTTP 200 ; arrêt volontaire ensuite, sortie 130. |
| `npm run lint` | Réussi, sortie 0. |
| `npm run test` | 23 tests dans 2 fichiers réussis, sortie 0. |
| `npm run build` | Réussi, sortie 0 ; JS 296,55 kB, CSS 25,58 kB. |
| `npm run build:desktop` | Réussi, sortie 0 ; frontend Vite uniquement. |
| `npm run test:web` | **Suite et configuration du dépôt : 2 scénarios réussis**, sortie 0. Responsive, copy, focus, reduced motion et CRUD réels. |
| `bin/rails test` | 32 tests, 203 assertions, 0 échec/erreur/skip, sortie 0. |
| `bin/rubocop` | 39 fichiers, aucune infraction, sortie 0. |
| `bin/rails zeitwerk:check` | Réussi, sortie 0. |
| `bundle exec brakeman --no-pager -f json -o /tmp/snipstack-v1-finalize/brakeman.json` | 0 erreur d'analyse, **1 avertissement EOLRails**, sortie 3. |
| `bin/brakeman --no-pager` avec accès réseau | Sortie 5 avant analyse : scanner 8.0.5, dernière version annoncée 8.1.0. Aucune mise à jour. |
| `npm run tauri -- build` | Sortie 1 avant compilation : Cargo absent (`cargo metadata`). |
| `npm run preview -- --host 127.0.0.1 --port 5173 --strictPort` | Build servi sur l'origine CORS autorisée ; parcours mobile réel réussi. |
| Exemples README/seed corrigés | curl via stdin : sortie 0, liste privée ; fonction fetch : liste privée avec token, rejet explicite `401` sans token. Aucun `db:seed` exécuté. |
| `git diff --check`, contrôle des captures et de l'index | Réussis. |

WDIO a utilisé `CHROME_BINARY` vers le Chromium 153.0.8010.12 déjà en cache,
`CHROMEDRIVER_PATH` vers son driver compatible existant et `LD_LIBRARY_PATH`
vers la bibliothèque déjà extraite sous `/tmp` lors de l'audit précédent.
Les identifiants UUID du compte temporaire ont été injectés en mémoire, sans
être imprimés. La commande exécutée par le lanceur temporaire est bien
`npm run test:web` : aucune copie de spec ni remplacement de config.

## Vérification navigateur et données

Chromium a vérifié : page chargée, login invalide et valide, vraie inscription
422/201, bearer lisible via CORS, `/me`, chargement des snippets, création,
modification, suppression, annulations, recherche/filtre/clear, raccourci `/`,
validation/focus, copy avec retour `Copied`, erreurs réseau et retry,
conservation du brouillon en échec, reload, logout et révocation réelle `401`.
Deux comptes temporaires isolés ont servi aux tests ; les tests Rails couvrent
également les refus interutilisateur. Aucune exception runtime observée dans
les scénarios DevTools.

Inspection visuelle avant/après du desktop et du mobile, login, inscription,
composer et bibliothèque à 320 px. Le contrôle après correction mesure aussi
les champs de formulaire : aucun hors écran. Les longues lignes de code ont
leur propre scroll, pas de scroll horizontal du document. La direction
bleu/ambre et les régions principales sont conservées.

Le build Vite final a également passé connexion, chargement, création,
modification, suppression et déconnexion à **390 × 844**, avec émulation mobile
et événements tactiles : largeur document 390/390 px. Les interactions à
320 px et les écrans auth ont été vérifiés séparément. Les captures de ce run
sont des fichiers temporaires sous `/tmp/snipstack-v1-finalize/`, non requis
pour lire ce rapport et non liés comme images publiées.

Aucun `db:seed` de développement, reset ou changement des données existantes.
Le compte de démonstration préexistant contient toujours sept snippets ; le
snippet « React fetch example » déjà stocké ne contient pas encore le header
corrigé. La correction du fichier seed ne met pas automatiquement à jour une
ligne existante. Si cet exemple doit être montré, l'utilisateur peut modifier
ce seul snippet via l'UI ou choisir explicitement de rejouer les seeds.

Nettoyage vérifié : deux comptes d'audit supprimés avec leurs deux snippets
restants ; retour à **2 utilisateurs, 7 snippets chez le propriétaire 2,
aucun compte d'audit**. Les processus Rails, Vite/preview et Chromium démarrés
pour le run ont été arrêtés.

## Portée réelle de l'avertissement Brakeman

Le rapport contient uniquement `Unmaintained Dependency / EOLRails`. Le code
installé de Brakeman 8.0.5 utilise une date codée au 7 octobre 2026 pour Rails
8.0.x. La [politique officielle Rails](https://rubyonrails.org/maintenance)
annonce une fin de correctifs de sécurité au **7 novembre 2026**. La date du
scanner est donc différente, mais au 19 novembre la série est effectivement
hors support selon les deux dates. Ce n'est pas une CVE identifiée ni la
preuve d'un chemin d'exploitation dans SnipStack ; ce n'est pas non plus un
certificat d'absence de vulnérabilité. Le scanner installé n'est pas le dernier.

Pour cette V1 navigateur locale, Rails/Vite restent liés à `127.0.0.1`.
L'exposition réseau est ainsi limitée ; cela ne supprime pas la dette de
maintenance. Le verdict autorise une revue et une démo locale sous cette
réserve documentée, pas une publication publique ni une garantie de sécurité.
Aucune mise à jour de Rails, gem ou outil n'a été faite. Traiter la maintenance
et l'actualisation du scanner dans un run séparé avant une exposition distante.

## Git et captures

État vérifié par `git branch -vv`, `git rev-list` et lecture distante
`git ls-remote --heads origin UI-rework develop main` :

| Référence | Commit | Publication |
| --- | --- | --- |
| `UI-rework` / `HEAD` | `8d6249b` | Aucun upstream ni tête distante `UI-rework` trouvée ; ce commit est publié via develop. |
| `develop` / `origin/develop` | `8d6249b` | Identiques à la tête distante lue. |
| `main` / `origin/main` | `58027a3` | Identiques à la tête distante lue. |

`develop...HEAD` : 0/0 ; `main...develop` : 0/33. Tout le redesign et les
correctifs de ce run sont **locaux, non commités et non poussés**. Index
inchangé par rapport à sa sauvegarde initiale, sans changements indexés.
Aucune actualisation locale des références ni opération de fusion effectuée.

Dossier exact : `/home/theo/projects/SnipStack/docs/ui-refresh/`.
Les **76 PNG** restent identiques, présents sur disque, non suivis et ignorés
par `/docs/ui-refresh/**/*.png`. `.gitignore` n'a pas été modifié dans ce run.
`git check-ignore --stdin` et `-v`, `git ls-files` et `git status` confirment
ces faits ; le README n'est pas ignoré. Aucun lien Markdown vers les PNG dans
ce README ou ce rapport. Les noms de l'inventaire sont des références locales.
Les dix captures suivies de `docs/desktop-screenshots/` sont hors périmètre.
Toute image déjà poussée reste accessible dans ses anciens commits ; aucun
historique n'a été réécrit.

## Limites et actions restantes

Cargo, rustfmt, Clippy et les pilotes natifs sont absents. Aucun build/lancement
natif, test desktop, AppImage/deb ou cycle de vie WSLg n'est validé dans ce run.
Le build Vite desktop ne remplace pas ces validations. Cette limite n'empêche
pas de présenter la **V1 navigateur locale explicitement demandée**.

Non vérifiés : téléphone physique, autres navigateurs, lecture du presse-papiers,
expiration naturelle après une heure, audit exhaustif accessibilité/performance
ou sécurité, CI GitHub, nouvelle installation depuis zéro et migration d'une
ancienne base peuplée. Renouvellement de session et vrai offline/sync restent
absents, sans changement dans ce run. Le CI imbriqué et le script de fixtures
performance historique ne sont pas réparés dans ce périmètre frontend.

Actions de l'utilisateur, dans l'ordre :

1. Relire le diff final et ce rapport ; conserver le périmètre navigateur
   local et la réserve de maintenance Rails. Si montré pendant la démo,
   actualiser le seul exemple fetch déjà enregistré via l'UI.
2. Contrôler `git status`, `git diff`, l'index et les exclusions PNG. Ajouter
   explicitement les seuls fichiers voulus, notamment les documents non suivis,
   puis commiter et pousser vous-même `UI-rework`. Aucun secret ni PNG UI.
3. Effectuer vous-même le merge/revue `UI-rework` → `develop`, puis son push.
   Avant ce commit, les branches étant identiques, un merge ne livrerait pas
   les corrections locales.
4. Sur le commit exact résultant de `develop`, rejouer lint/tests/builds,
   Rails tests/RuboCop et le smoke web versionné ; vérifier le parcours de
   démonstration local et les données du compte choisi.
5. Une fois ces contrôles verts et la réserve connue, effectuer vous-même
   `develop` → `main`, puis le push souhaité. Ne pas présenter ce geste comme
   une publication distante ou une validation desktop.

## Inventaire des 76 captures locales

La liste ci-dessous est limitée au dossier demandé. Les autres fichiers du
dossier, notamment `README.md`, sont conservés et non ignorés.

```text
after-api-unavailable.png
after-copy.png
after-delete-confirmation.png
after-edit.png
after-empty-search.png
after-library-1024.png
after-library-1440.png
after-library-320.png
after-library-390.png
after-library-720.png
after-library-820.png
after-library-content-320.png
after-library-content-390.png
after-library-content-720.png
after-loading.png
after-login-1024.png
after-login-1440.png
after-login-320.png
after-login-390.png
after-login-720.png
after-register-1440.png
after-register-390.png
after-session-expired.png
after-signout.png
after-validation.png
before-library-1024.png
before-library-1440.png
before-library-320.png
before-library-390.png
before-library-720.png
before-library-820.png
before-library-content-320.png
before-library-content-390.png
before-library-content-720.png
before-login-1024.png
before-login-1440.png
before-login-320.png
before-login-390.png
before-login-720.png
comparison-1440.png
evolved-api-unavailable-1440.png
evolved-copy-1440.png
evolved-delete-confirmation-1440.png
evolved-edit-1440.png
evolved-empty-1440.png
evolved-library-1024.png
evolved-library-1440.png
evolved-library-320.png
evolved-library-390.png
evolved-library-720.png
evolved-library-content-320.png
evolved-library-content-390.png
evolved-library-content-720.png
evolved-loading-1440.png
evolved-login-1024.png
evolved-login-1440.png
evolved-login-320.png
evolved-login-390.png
evolved-login-720.png
evolved-register-1440.png
evolved-validation-1440.png
revised-delete-confirmation-1440.png
revised-edit-1440.png
revised-empty-1440.png
revised-library-1024.png
revised-library-1440.png
revised-library-320.png
revised-library-390.png
revised-library-720.png
revised-library-820.png
revised-library-content-320.png
revised-library-content-390.png
revised-library-content-720.png
revised-login-1440.png
revised-register-1440.png
revised-validation-1440.png
```
