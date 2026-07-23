# Workflow des passes Desktop

## Règles d'exécution

- Lire `brief.md` avant chaque passe.
- Ne démarrer aucun code tant que le run 0 n'est pas décidé et consigné.
- Une passe doit rester limitée à son objectif ; les refactorings sans rapport sont interdits.
- Préserver le frontend web et l'API Rails à chaque étape.
- Ne jamais remplacer Rails par Tauri Store ou par une nouvelle source de vérité serveur.
- Ne pas ajouter login, stockage offline ou synchronisation pendant les premiers runs Tauri ; ces capacités ont leurs propres passes futures.
- Ne pas introduire de choix qui empêcherait une authentification partagée ou une réplique locale synchronisable.
- Exécuter et valider l'implémentation Tauri uniquement sous WSL/WSLg. Windows, NSIS, MSI et WebView2 sont hors périmètre.
- Commencer chaque passe sur un worktree propre ou documenter précisément les changements déjà présents.
- Inscrire le résultat, les problèmes, les corrections et les vérifications dans `runs-journal`.
- Un run n'est terminé que si ses critères de sortie sont vérifiés. Sinon, il reste « bloqué » ou « partiel ».
- Ne pas confondre compilation, lancement manuel, test fonctionnel et validation d'installeur.

## Priorité P0 — Décisions structurantes

### Run 0 — Contrat initial Desktop/backend sous WSL/WSLg

**But**

Lever les inconnues qui changeraient radicalement l'implémentation.

**Décisions obligatoires**

- cible d'exécution : Linux sous WSL/WSLg ;
- API Rails séparée et accessible depuis WSL/WSLg ;
- URL de l'API par environnement ;
- comportement temporaire lorsque l'API est indisponible, sans prétendre au mode offline complet ;
- dimensions initiales et minimales de la fenêtre ;
- identifiant, nom produit et version.

**Travail**

- Produire une courte décision d'architecture.
- Confirmer que les premiers runs utilisent l'API existante sans stockage local métier.
- Consigner comme contraintes futures le déploiement web, l'authentification, le fonctionnement offline et la synchronisation bidirectionnelle.
- Reporter toute décision de sidecar : elle n'est pas nécessaire à la direction produit web + API partagée.

**Critères de sortie**

- Aucune ambiguïté sur le lieu d'exécution de Rails.
- La limitation WSL/WSLg est explicite.
- Le périmètre différé auth/offline/sync est explicite.

### Run 1 — Baseline web et matrice de régression

**But**

Créer une référence factuelle avant l'ajout de Tauri.

**Travail**

- Relever les versions réelles de Node, npm, Ruby, Rails, PostgreSQL et Rust disponibles.
- Exécuter les checks web/backend déjà prévus par le projet.
- Parcourir le CRUD complet, les erreurs, filtres, raccourci `/`, focus, scroll et presse-papiers.
- Capturer l'interface aux largeurs représentatives des breakpoints `1120`, `760` et `420`.
- Constituer un jeu de données petit, moyen et volumineux pour les futures mesures.
- Noter temps de chargement, fluidité du scroll et consommation mémoire/CPU avec une méthode reproductible.

**Critères de sortie**

- Résultats et limites consignés.
- Référence visuelle disponible.
- Aucun échec préexistant attribué à Tauri.

## Priorité P1 — Enveloppe Tauri minimale

### Run 2 — Scaffold Tauri 2 sans changement métier

**But**

Ajouter une cible Desktop qui embarque le frontend existant.

**Travail**

- Ajouter le CLI Tauri au frontend.
- Initialiser `frontend/src-tauri/`.
- Configurer uniquement le squelette Rust, l'identité, la fenêtre et les assets minimaux.
- Relier `beforeDevCommand`, `beforeBuildCommand`, `devUrl` et `frontendDist`.
- Ajouter le script npm Tauri.
- Conserver les composants, l'état React et `snippetsApi.js` inchangés.
- Ne déclarer aucun plugin métier.

**Vérifications**

- lint et build frontend ;
- format et compilation Rust ;
- lancement Tauri dev ;
- lancement web Vite inchangé ;
- comparaison visuelle de premier niveau.

**Critères de sortie**

- La même interface s'ouvre dans le navigateur et dans Tauri.
- Aucun remplacement du backend ou du stockage.
- Les changements sont limités au scaffold et à sa configuration.

### Run 3 — Configuration Vite multi-cible

**But**

Rendre la configuration reproductible pour web, Tauri dev et Tauri production.

**Travail**

- Ajouter le host Tauri, un port strict et l'exclusion de `src-tauri` du watcher.
- Définir la cible de build compatible avec la WebView Linux utilisée sous WSL/WSLg.
- Activer minification et sourcemaps selon le mode.
- Formaliser les fichiers ou variables d'environnement autorisés sans commiter de secrets.

**Vérifications**

- HMR dans Tauri dev ;
- erreur explicite si le port attendu est occupé ;
- build web standard ;
- build frontend piloté par Tauri.

**Critères de sortie**

- Les trois contextes utilisent une configuration d'API et de build explicite.
- Le mode web ne dépend pas de Tauri.

## Priorité P1 — Connexion au backend conservé

### Run 4 — API, CORS et CSP

**But**

Faire fonctionner le contrat Rails existant depuis la WebView sans élargir inutilement les accès.

**Travail**

- Configurer `VITE_API_BASE_URL` pour le Desktop.
- Relever l'origine réelle de la WebView sous WSL/WSLg.
- Conserver dans `FRONTEND_ORIGIN` uniquement les origines qui utilisent
  réellement le CORS navigateur.
- Si `fetch` Web fonctionne, définir une CSP Tauri restrictive avec l'API
  exacte dans `connect-src`.
- Si le plugin HTTP devient nécessaire après preuve, limiter sa capability à
  l'API exacte et limiter `connect-src` à l'IPC Tauri.
- Interdire les endpoints HTTP non chiffrés pour une API distante.
- Conserver la gestion `ApiError` et le contrat JSON.
- Ne basculer vers un plugin HTTP que si `fetch` est insuffisant et que le problème est démontré.

**Vérifications**

- `GET`, `POST`, `PATCH`, `DELETE` et préflight `OPTIONS` ;
- API indisponible au démarrage puis bouton de reprise ;
- erreurs Rails `404` et `422` ;
- web Vite toujours autorisé ;
- aucune autre origine acceptée.

**Critères de sortie**

- CRUD complet dans Tauri.
- CORS, CSP et éventuelle capability HTTP minimaux, documentés et vérifiés.
- Aucun stockage parallèle dans cette passe.

## Priorité P2 — Expérience Desktop et fidélité visuelle

### Run 5 — Fenêtre et interactions natives

**But**

Valider l'interface originale dans les contraintes d'une fenêtre Desktop.

**Travail**

- Tester dimensions initiales, minimum, maximisation et plein écran sans forcer ce dernier.
- Vérifier toutes les largeurs, le panneau sticky, les zones de scroll et le focus.
- Vérifier raccourci `/`, navigation clavier, focus visible et reduced-motion.
- Vérifier le presse-papiers Web.
- Ajouter un plugin Clipboard uniquement si un échec réel le nécessite, avec capability minimale.
- Vérifier fermeture/réouverture et comportement lorsque Rails devient indisponible.

**Critères de sortie**

- Aucun décalage fonctionnel entre web et Desktop.
- Aucun contenu inaccessible à la taille minimale.
- Les permissions natives sont justifiées par un test.

### Run 6 — Ressources locales et politique réseau

**But**

Supprimer les dépendances visuelles runtime inutiles sans changer le rendu.

**Travail**

- Vérifier la licence d'Outfit.
- Embarquer les graisses utilisées dans les assets du frontend.
- Remplacer l'import Google Fonts par des `@font-face` locaux.
- Comparer métriques de texte, retours à la ligne et captures.
- Refuser les scripts, styles et polices CDN dans la CSP.

**Critères de sortie**

- L'interface garde son rendu attendu hors connexion à Google.
- Aucun domaine de police distant dans la CSP.

### Run 7 — Profilage CSS et listes

**But**

Optimiser uniquement les problèmes reproduits dans la WebView.

**Ordre d'investigation**

1. `backdrop-filter` de la topbar ;
2. calque fixe `body::before` et `mask-image` ;
3. grandes ombres et gradients ;
4. animations skeleton/spinner/statut ;
5. scroll des cartes et rendu intégral de la liste ;
6. filtrage plein texte à chaque saisie.

**Méthode**

- Mesurer sur un build release et sur le matériel cible.
- Modifier un facteur à la fois.
- Comparer mesures et captures avant/après.
- Préférer une réduction ciblée conditionnelle à une suppression globale.
- Évaluer `content-visibility`, debounce ou virtualisation seulement si la taille des données le justifie.

**Critères de sortie**

- Toute optimisation possède une preuve avant/après.
- Aucun changement visuel non accepté.
- La règle reduced-motion reste active.

## Priorité P2 — Qualité, sécurité et validation WSL/WSLg

### Run 8 — Couverture automatisée

**But**

Protéger le contrat partagé web/Desktop.

**Travail**

- Ajouter des tests unitaires du client API avec succès, réseau indisponible, `404`, `422`, `204` et annulation.
- Tester les transitions d'état critiques du frontend.
- Ajouter des tests backend ciblés pour le CORS et le CRUD si absents.
- Ajouter un smoke test Tauri proportionné à l'outillage disponible.

**Critères de sortie**

- Régressions web et Desktop couvertes.
- Aucun test ne nécessite de désactiver la sécurité de production.

### Run 9 — Durcissement Tauri

**But**

Limiter la surface native avant distribution.

**Travail**

- Auditer `Cargo.toml`, capabilities et plugins.
- Retirer les permissions non utilisées.
- Vérifier la CSP finale.
- Vérifier qu'aucun secret ni endpoint privé n'est embarqué dans le bundle frontend.
- Vérifier que le code des snippets reste rendu comme texte et n'est jamais exécuté.
- Désactiver les features natives non utilisées, notamment le cookie jar HTTP.
- Interdire `--features webdriver` et `--all-features` dans un build de publication.

**Critères de sortie**

- Une seule capability minimale pour `main`.
- Aucun Shell, Store, HTTP natif ou Clipboard si inutilisé.
- Destination API et comportement réseau documentés.

### Run 10 — Build et validation WSL/WSLg

**But**

Produire des preuves de compilation et d'exécution limitées à WSL/WSLg.

**Travail**

- Build frontend release.
- `cargo fmt --check`, Clippy et build Tauri sans bundle.
- Lancement et validation dans une fenêtre WSLg.
- Build de l'artefact Linux prévu par la configuration Tauri.
- Conserver les logs et chemins d'artefacts.

**Critères de sortie**

- Chaque résultat est associé à la distribution WSL, l'architecture et la toolchain.
- Aucun résultat n'est présenté comme une validation Windows native.

### Run 11 — Artefact Linux et cycle de vie WSL/WSLg

**But**

Valider l'artefact Linux produit et son cycle de vie dans l'environnement WSL/WSLg.

**Travail**

- Construire l'artefact Linux retenu pour les runs WSL/WSLg.
- Tester premier lancement, connexion API, CRUD et fermeture/réouverture sous WSLg.
- Tester le comportement lorsque l'API est indisponible au lancement ou pendant la session.
- Documenter les dépendances système Linux/WebKit nécessaires.

**Critères de sortie**

- L'artefact est lancé et testé sous WSL/WSLg.
- Les dépendances backend sont comprises et documentées.
- Windows et les autres plateformes sont explicitement indiqués comme non testés et hors périmètre.

## Priorité P3 — Livraison

### Run 12 — Documentation finale et décision de publication

**But**

Rendre la variante Desktop maintenable et utilisable sans connaissance implicite.

**Travail**

- Documenter prérequis, développement web, développement Tauri, variables API et builds.
- Documenter lancement, dépendances WSL/WSLg, logs et diagnostic d'API indisponible.
- Documenter WSL/WSLg comme seul environnement Tauri validé.
- Mettre à jour `brief.md` si l'architecture finale diffère.
- Relire `runs-journal` et lister les incertitudes restantes.

**Critères de sortie**

- Les commandes documentées ont été réellement exécutées dans l'environnement annoncé.
- Les capacités non vérifiées ne sont pas revendiquées.
- Le frontend web et la version Desktop ont des parcours de maintenance distincts et clairs.

## Priorité P4 — Passes produit futures, hors intégration Tauri initiale

Ces runs sont documentés maintenant pour protéger l'architecture, mais ne doivent pas être implémentés pendant les runs 0 à 12 sans nouvelle validation de périmètre.

### Run 13 — Déploiement de l'application web

**But**

Préparer SnipStack comme application navigateur déployée, adossée à l'API Rails partagée.

**Travail futur**

- Définir les environnements, domaines, HTTPS, CORS et configuration de l'API.
- Séparer proprement les configurations web locale, web déployée et Desktop.
- Définir observabilité, sauvegardes et politique de données.
- Vérifier que le frontend reste identique dans le navigateur et la WebView, hors adaptations Desktop explicites.

**Critères de sortie futurs**

- Le client navigateur utilise une API sécurisée et déployée.
- Aucun secret n'est inclus dans le build frontend.
- Le déploiement web ne dépend pas de Tauri.

### Run 14 — Authentification partagée web/Desktop

**But**

Associer les données à un utilisateur authentifié avec un flux compatible navigateur et Tauri.

**Travail futur**

- Choisir le protocole de login, de renouvellement et de révocation.
- Ajouter la propriété utilisateur aux snippets et appliquer l'isolation côté Rails.
- Définir le stockage sécurisé de la session Desktop ; ne pas stocker de jeton sensible en clair dans un Store générique.
- Gérer expiration, déconnexion, changement de compte et erreurs `401`/`403`.
- Tester les protections CSRF/CORS selon le mécanisme retenu.

**Critères de sortie futurs**

- Un utilisateur ne peut lire ou modifier que ses données.
- La même identité fonctionne sur le navigateur et le Desktop.
- Les secrets de session suivent une stratégie adaptée à chaque client.

### Run 15 — Modèle local offline

**But**

Permettre au Desktop d'afficher et modifier les snippets de l'utilisateur sans connexion.

**Travail futur**

- Choisir un stockage local transactionnel et définir ses migrations.
- Mettre en place une couche de données séparant UI, réplique locale et API.
- Ajouter des identifiants clients stables, versions, statuts de synchronisation et tombstones de suppression.
- Mettre en file les mutations offline de façon idempotente.
- Définir le comportement lorsqu'une session expire hors ligne.

**Critères de sortie futurs**

- Les données déjà synchronisées restent accessibles hors ligne.
- Les créations, modifications et suppressions offline survivent au redémarrage.
- Rails/PostgreSQL restent la source de vérité serveur.

### Run 16 — Synchronisation bidirectionnelle et conflits

**But**

Synchroniser de manière fiable les changements navigateur ↔ API Rails ↔ Desktop.

**Travail futur**

- Définir un protocole incrémental avec curseur ou version serveur.
- Traiter retry, idempotence, doublons, suppressions et reprise après interruption.
- Définir une politique explicite de conflits, sans écrasement silencieux.
- Exposer dans l'interface les états en ligne, hors ligne, en attente, synchronisé, conflit et erreur.
- Tester modifications concurrentes, déconnexion prolongée, changement de compte et resynchronisation complète.

**Critères de sortie futurs**

- Une modification web apparaît sur Desktop après synchronisation et inversement.
- Aucune mutation validée n'est perdue silencieusement.
- Les conflits sont déterministes, visibles et récupérables.

### Run 17 — Durcissement et tests de bout en bout auth/offline/sync

**But**

Valider la sécurité et la fiabilité du système distribué final.

**Travail futur**

- Couvrir les parcours login, offline, reconnexion, conflit et révocation.
- Tester l'isolation multi-utilisateur et l'effacement local lors d'un changement de compte.
- Vérifier chiffrement ou protection locale selon le modèle de menace retenu.
- Tester migrations de schéma local et serveur.
- Documenter sauvegarde, récupération et limites connues.

**Critères de sortie futurs**

- Les scénarios critiques passent sur navigateur et Desktop WSL/WSLg.
- Les données d'un compte ne fuient pas vers un autre.
- Les garanties et limites offline sont documentées sans ambiguïté.
