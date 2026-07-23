# Brief d'intégration Desktop — SnipStack

## 1. Objet et garde-fous

L'objectif est d'ajouter une distribution Desktop avec Tauri 2 au projet existant, sans remplacer :

- le frontend React/Vite ;
- l'API Rails ;
- PostgreSQL ;
- l'organisation actuelle `frontend/` + `backend/` ;
- les usages web existants.

Tauri doit être une cible supplémentaire qui embarque le build statique du frontend dans une WebView. La version web doit continuer à fonctionner. Cette passe est uniquement documentaire : aucun code Tauri, aucune dépendance et aucun run applicatif n'ont été ajoutés ou exécutés.

### Vision produit à terme

L'architecture ajoutée maintenant ne doit pas bloquer les évolutions déjà prévues :

- SnipStack sera également déployée comme application web accessible dans un navigateur ;
- une authentification avec login sera ajoutée ;
- chaque snippet devra être rattaché à l'utilisateur authentifié ;
- les snippets d'un même utilisateur devront se synchroniser dans les deux sens entre le navigateur et l'application Desktop ;
- l'application Desktop devra rester utilisable hors ligne, puis resynchroniser ses changements lorsque l'API redevient disponible.

Ces capacités sont des contraintes de conception dès maintenant, mais elles ne font pas partie de l'implémentation Tauri initiale. Elles feront l'objet de passes dédiées après stabilisation du shell Desktop et du contrat API actuel.

## 2. État vérifié de SnipStack

### 2.1 Architecture actuelle

- Frontend : React `19.2.7`, React DOM `19.2.7`, Vite `8.1.1`, `react-icons` `5.7.0`, CSS sans framework.
- Backend : Rails API `8.0.5`, Puma, PostgreSQL et `rack-cors`.
- Contrat frontend/backend centralisé dans `frontend/src/api/snippetsApi.js`.
- URL API par défaut : `http://127.0.0.1:3000/api/v1`, remplaçable par `VITE_API_BASE_URL`.
- CRUD exposé sous `/api/v1/snippets`.
- CORS configuré par `FRONTEND_ORIGIN`, avec uniquement les origines Vite locales par défaut.
- Le frontend utilise les API Web standard `fetch`, `navigator.clipboard`, `window`, `document`, `AbortController` et `requestAnimationFrame`.

### 2.2 Conséquence pour Tauri

Le build React peut être embarqué sans réécriture de l'interface. En revanche, le frontend empaqueté doit toujours joindre Rails. Tauri ne transforme pas Rails/PostgreSQL en binaire Desktop par simple ajout de `src-tauri`.

Avant tout code, il faut donc valider l'un de ces modes :

| Mode | Description | Impact | Avis |
| --- | --- | --- | --- |
| API Rails séparée | L'app Tauri appelle une API Rails déjà opérée sur une URL HTTPS ou un réseau maîtrisé. | Faible : configuration d'URL, CORS, CSP et gestion de l'indisponibilité. | Recommandé pour la première version, car il préserve réellement l'architecture. |
| Backend lancé séparément sur la machine | L'utilisateur installe/lance Rails et PostgreSQL à part, puis ouvre l'app Tauri. | Faible côté code, mauvaise expérience d'installation autonome. | Acceptable seulement pour un outil de développement interne. |
| Backend embarqué comme sidecar | L'installeur contient un exécutable autonome dérivé du backend et pilote son cycle de vie. | Très élevé : Ruby/Rails, gems natives, PostgreSQL, migrations, port, logs, arrêt et binaires par plateforme. | À traiter comme un projet distinct après étude de faisabilité, pas comme le scaffold Tauri initial. |

Le mode « API Rails séparée » est la base proposée dans `runs-workflow.md`. Si l'exigence réelle est une application entièrement locale et autonome, le run 0 doit être réécrit et validé avant de continuer.

La vision produit clarifiée confirme que Rails devra à terme être accessible par les clients web et Desktop. L'API Rails séparée est donc la direction d'architecture retenue pour préparer la synchronisation future. Le mode hors ligne ne signifie pas embarquer ou remplacer Rails : il nécessitera plus tard une copie locale persistante sur le Desktop, une file de mutations et un protocole de synchronisation avec le serveur.

### 2.3 Frontière entre la première intégration et les passes futures

La première intégration Tauri doit :

- conserver l'appel direct à l'API Rails existante ;
- fonctionner sous WSL/WSLg lorsque l'API est disponible ;
- présenter clairement l'état hors connexion ou API indisponible ;
- éviter les choix qui empêcheraient d'ajouter ensuite authentification, cache local et synchronisation.

Elle ne doit pas encore :

- ajouter un écran de login ou un système d'authentification ;
- modifier le schéma pour rattacher les snippets à un utilisateur ;
- ajouter une base locale ou Tauri Store ;
- implémenter une file de mutations, une résolution de conflits ou une synchronisation ;
- revendiquer un fonctionnement hors ligne complet.

Lors des futures passes offline/sync, le stockage local sera une réplique contrôlée des données de l'utilisateur, et non un remplacement de Rails/PostgreSQL.

## 3. Analyse du précédent `SnippetVault_desktop_app`

### 3.1 Éléments pertinents et réutilisables

Le dépôt antérieur fournit une référence concrète et cohérente pour :

- Tauri 2 placé sous `frontend/src-tauri/` ;
- les scripts npm `tauri`, `dev` et `build` ;
- les hooks Tauri `beforeDevCommand`, `beforeBuildCommand`, `devUrl` et `frontendDist`;
- la configuration Vite adaptée à Tauri : port strict, `TAURI_DEV_HOST`, exclusion de `src-tauri` du watcher et cible de build selon la plateforme ;
- une configuration de fenêtre, un identifiant d'application, des icônes et un bundle NSIS ;
- une CSP restrictive ;
- des capabilities minimales liées à la seule fenêtre `main` ;
- le squelette Rust minimal `main.rs`, `lib.rs`, `build.rs` et `Cargo.toml` ;
- la séparation entre validation WSL/WSLg et validation réelle d'un installeur Windows natif.

Le précédent projet a vérifié le build et l'exécution Tauri sous WSL/WSLg. Son installeur Windows natif n'a pas été validé. Ses valeurs de fenêtre (`fullscreen: true`, largeur minimale de `980`) et son identifiant produit ne doivent pas être copiés sans décision propre à SnipStack.

Pour SnipStack, les runs Tauri de ce workflow sont limités à WSL/WSLg. La configuration ou la validation Windows, NSIS, MSI et WebView2 sont hors périmètre. Les éléments Windows de l'ancien dépôt restent uniquement un retour d'expérience historique.

### 3.2 Éléments à ne pas reprendre

Cette ancienne conversion a supprimé Rails, l'API HTTP et sa base, puis remplacé la persistance par `@tauri-apps/plugin-store`. Ce choix est explicitement hors périmètre ici.

Il ne faut donc pas reprendre :

- `@tauri-apps/plugin-store` ;
- la réécriture de `snippetsApi.js` vers un stockage local ;
- la génération d'identifiants ou les validations métier dans le frontend à la place de Rails ;
- une CSP sans destination API ;
- la promesse d'une application sans serveur tant qu'un mode d'hébergement du backend n'a pas été validé ;
- les permissions Store ;
- le positionnement « local, sans réseau » de l'ancien produit.

### 3.3 Enseignements opérationnels

- Les résultats obtenus sous WSL/WSLg ne valent que pour la cible Linux exécutée via WSLg.
- Aucun support ou installeur Windows ne doit être annoncé à partir de ces runs.
- Le chemin de données, le cycle de vie et l'absence de ports de l'ancien projet ne s'appliquent pas à SnipStack, puisque Rails est conservé.
- Les permissions Tauri doivent être ajoutées uniquement lorsqu'une API native est réellement nécessaire.

## 4. Préservation du frontend et analyse de performance

### 4.1 Compatibilité fonctionnelle

Les usages actuels sont compatibles avec une WebView Tauri en principe :

- `fetch` pour l'API ;
- `AbortController` pour annuler le chargement initial ;
- raccourci `/` via `keydown` ;
- focus et scroll du formulaire ;
- presse-papiers via `navigator.clipboard`.

Ils doivent néanmoins être vérifiés dans la vraie fenêtre Tauri. Si le presse-papiers Web est insuffisant sur une plateforme, un plugin Tauri pourra être envisagé après constat, avec une permission minimale. Il ne doit pas être ajouté préventivement.

Le contrat JSON, les erreurs `ApiError`, les validations visibles, le CRUD, les filtres, le raccourci clavier, les annonces de statut et le responsive constituent le comportement de référence à préserver.

### 4.2 Point bloquant réseau et sécurité

Le frontend de production Tauri possède une origine différente de Vite. L'origine réellement utilisée par la WebView Linux doit être relevée sous WSL/WSLg avant d'ajuster `FRONTEND_ORIGIN`. Aucune origine Windows ne doit être ajoutée ou supposée pendant ces runs.

Il faudra :

- configurer `VITE_API_BASE_URL` pour la cible Desktop ;
- autoriser uniquement les origines Desktop réellement observées côté Rails ;
- autoriser l'URL API exacte dans `connect-src` de la CSP Tauri ;
- utiliser HTTPS pour une API distante ;
- conserver le fonctionnement Vite/web ;
- vérifier les requêtes CORS réelles, y compris `OPTIONS`, `POST`, `PATCH` et `DELETE`.

Une API Rails exposée à distance sans authentification serait un changement de risque majeur. Le dépôt actuel ne contient pas de mécanisme d'authentification. La première intégration doit donc rester dans un environnement de développement maîtrisé. L'authentification future devra être conçue conjointement pour les clients web et Desktop avant tout déploiement public.

### 4.3 Préparation de l'authentification, du offline et de la synchronisation

Sans les implémenter maintenant, l'intégration initiale doit préserver les frontières suivantes :

- le client API reste centralisé afin de pouvoir y ajouter ultérieurement session, renouvellement et erreurs d'authentification ;
- les données métier continuent d'être validées par Rails ;
- le futur stockage local Desktop est placé derrière une couche de données dédiée, sans accès direct dispersé dans les composants React ;
- les opérations de création, modification et suppression devront pouvoir porter un identifiant client stable, un propriétaire, une version et des dates de synchronisation ;
- les états `en ligne`, `hors ligne`, `synchronisation`, `conflit` et `erreur d'authentification` devront être distincts dans l'interface ;
- les secrets d'authentification ne devront pas être stockés en clair dans le frontend ou dans un fichier Store générique ;
- la stratégie de conflit, de suppression, de pagination et de resynchronisation complète devra être décidée avant toute écriture offline.

Le choix de la technologie de stockage local n'est pas arrêté. Il devra être fondé sur les besoins de requêtes, transactions, migrations, chiffrement éventuel et volume. L'ancien usage de Tauri Store ne constitue pas une décision pour SnipStack.

### 4.4 CSS et ressources à surveiller

Le style original doit rester la référence. Aucun effet ne doit être supprimé sur intuition seule.

Points relevés dans `frontend/src/index.css` :

- police Outfit chargée depuis Google Fonts par `@import` ;
- `backdrop-filter: blur(18px)` sur la barre supérieure ;
- calque fixe plein écran `body::before` avec grille et `mask-image` ;
- gradients multiples et ombres larges ;
- panneau de composition `sticky` ;
- transitions de cartes et boutons avec ombres et transformations ;
- animations continues du spinner et des skeletons ;
- animation d'entrée des messages de statut ;
- responsive déjà prévu à `1120`, `760` et `420` px ;
- règle `prefers-reduced-motion` déjà présente.

Priorités proposées :

1. Embarquer localement Outfit, sous réserve de licence, afin d'éviter une dépendance réseau, un flash de police et une ouverture CSP vers Google. Garder les mêmes graisses pour préserver le rendu.
2. Profiler dans la WebView avant/après sur la plateforme cible. Examiner d'abord le `backdrop-filter`, le calque fixe masqué et les grandes ombres, qui peuvent provoquer des repaints.
3. Vérifier les animations uniquement pendant leur état actif. La règle reduced-motion existante doit être conservée.
4. Tester le scroll avec une bibliothèque représentative, le filtre qui reconstruit le texte recherchable à chaque saisie et le rendu de toutes les cartes. N'introduire virtualisation, debounce ou `content-visibility` que sur preuve d'un problème.
5. Définir les dimensions minimales de fenêtre à partir des breakpoints existants. Ne pas imposer les `980 px` de l'ancien projet : SnipStack est déjà conçu jusqu'à `320 px`.

`frontend/src/App.css` contient des styles du template Vite mais n'est importé nulle part ; il n'a donc pas de coût runtime vérifié. Son nettoyage est hors périmètre de l'intégration Tauri.

### 4.5 Dépendances

Le socle minimal attendu est :

- `@tauri-apps/cli` en dépendance de développement ;
- `@tauri-apps/api` seulement si une API Tauri JavaScript est effectivement utilisée ;
- crates `tauri` et `tauri-build` côté Rust.

Aucun plugin Store n'est requis pour les premiers runs. Le stockage offline futur fera l'objet d'une sélection dédiée. Aucun plugin Shell/HTTP/Clipboard ne doit être ajouté sans besoin démontré et sans capability ciblée.

Les versions exactes devront être verrouillées par les lockfiles au moment de l'implémentation. La compatibilité doit être confirmée avec la version courante de Tauri 2, et non déduite du seul ancien dépôt.

## 5. Plan global d'intégration

1. **Formaliser le contrat Desktop/backend initial** : API Rails séparée, environnement WSL/WSLg, URL de développement et état API indisponible.
2. **Établir la référence web** : comportement, captures aux largeurs clés, tests disponibles et temps/ressources de référence.
3. **Ajouter le scaffold Tauri minimal** sous `frontend/src-tauri/`, sans modifier les composants ni le contrat API.
4. **Configurer Vite et les scripts** pour que web et Tauri coexistent.
5. **Configurer fenêtre, identité et assets** propres à SnipStack, sans reprendre les choix plein écran de SnippetVault.
6. **Brancher l'API Rails** avec une URL Desktop explicite, une CSP restrictive et un CORS limité aux origines nécessaires.
7. **Vérifier les interactions Desktop** : chargement, CRUD, erreurs réseau, clavier, focus, scroll, presse-papiers, redimensionnement et fermeture/réouverture.
8. **Mesurer puis optimiser** les ressources distantes et les effets CSS seulement si les mesures le justifient.
9. **Durcir et tester** les capabilities, la CSP, les erreurs, le contrat API et les régressions web.
10. **Construire et valider sous WSL/WSLg uniquement** : compilation, lancement et artefact Linux, sans revendication Windows.
11. **Documenter l'usage WSL/WSLg** : prérequis backend, configuration, lancement, logs et limites connues.
12. **Préparer les passes produit futures** : déploiement navigateur, authentification partagée, stockage local Desktop, mode offline et synchronisation bidirectionnelle.

L'ordre exécutable et les critères de sortie de chaque passe sont détaillés dans `runs-workflow.md`.

## 6. Critères d'acceptation globaux

- La version web existante reste fonctionnelle.
- Le frontend affiché dans Tauri est visuellement et fonctionnellement équivalent.
- Rails et PostgreSQL restent la source de vérité serveur.
- Aucun stockage métier parallèle n'est introduit pendant les premiers runs Tauri.
- Le futur stockage local Desktop est traité comme une réplique synchronisable et non comme un remplacement du backend.
- L'app Desktop sait signaler clairement une API indisponible.
- Le CRUD et les erreurs Rails traversent correctement Tauri, CORS et la CSP.
- Les permissions Tauri et les destinations réseau sont minimales.
- Aucune ressource visuelle indispensable ne dépend d'un CDN au runtime.
- Le comportement est validé aux tailles de fenêtre retenues et avec reduced-motion.
- Les performances sont mesurées avant toute dégradation visuelle.
- Les validations Tauri sont limitées et annoncées comme WSL/WSLg ; aucun support Windows n'est revendiqué.
- Les premiers runs n'implémentent ni login, ni offline complet, ni synchronisation, mais n'en bloquent pas l'ajout futur.
- Chaque passe est consignée dans `runs-journal`.

## 7. Risques et inconnues

### Décisions acquises

- L'application aura une version web navigateur.
- Une authentification partagée sera ajoutée.
- Le Desktop devra fonctionner hors ligne et synchroniser les snippets dans les deux sens.
- Ces capacités sont différées dans des passes futures.
- Les runs Tauri actuels sont exécutés et validés uniquement sous WSL/WSLg.

### Décisions à prendre avant les passes auth/sync

- protocole d'authentification adapté au navigateur et à Tauri ;
- stockage sécurisé de la session Desktop ;
- schéma de propriété, identifiants stables et versionnement des snippets ;
- technologie de stockage local ;
- stratégie de file d'attente, retry, idempotence, conflits et suppressions ;
- comportement après expiration de session pendant une période hors ligne ;
- URL, hébergement et politique de sécurité de l'API déployée.

### Risques importants

- CORS incorrect entre l'origine Tauri et Rails.
- CSP trop permissive ou, à l'inverse, bloquant l'API ou la police.
- Confusion entre « frontend empaqueté » et « application autonome avec backend empaqueté ».
- Divergence de configuration API entre web, Tauri dev et Tauri production.
- fuite ou stockage inadapté de jetons d'authentification sur Desktop.
- perte, duplication ou écrasement de snippets lors d'une reprise de synchronisation.
- divergence de données entre la réplique locale et Rails en cas de conflits.
- validation WSL/WSLg présentée à tort comme support natif Windows.
- dégradation visuelle due à des optimisations CSS prématurées.

## 8. Références

### Dépôts locaux analysés

- `/home/allen/mes_projets/SnipStack`
- `/home/allen/mes_projets/SnippetVault_desktop_app`

### Documentation officielle consultée le 23 juillet 2026

- Tauri + Vite : <https://v2.tauri.app/start/frontend/vite/>
- Prérequis Tauri : <https://v2.tauri.app/start/prerequisites/>
- Capabilities : <https://v2.tauri.app/security/capabilities/>
- Content Security Policy : <https://v2.tauri.app/security/csp/>
- Binaires externes/sidecars : <https://v2.tauri.app/develop/sidecar/>
