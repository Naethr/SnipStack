# Décision d'architecture Desktop initiale

**Date** : 23 juillet 2026  
**Portée** : runs 0 à 12  
**Statut** : accepté

## Décision

La variante Desktop de SnipStack est un client Tauri 2 Linux exécuté et validé uniquement sous WSL/WSLg.

Tauri embarque le build statique du frontend React/Vite. Le client Desktop continue d'utiliser l'API Rails séparée et PostgreSQL reste la source de vérité serveur.

## Contrat initial

- Environnement Desktop : Linux sous WSL/WSLg.
- Nom produit : `SnipStack`.
- Version initiale : `0.1.0`.
- Identifiant Tauri : `com.allen.snipstack`.
- Fenêtre principale : `1280 × 800`, redimensionnable, centrée, sans plein écran forcé.
- Taille minimale : `720 × 600`, cohérente avec le breakpoint mobile existant à `760 px`.
- API de développement : `http://127.0.0.1:3000/api/v1`.
- Backend : Rails lancé séparément sous WSL.
- Base : PostgreSQL existant, lancé séparément.
- Client HTTP web : `fetch` natif via `frontend/src/api/snippetsApi.js`.
- Client HTTP Desktop : plugin officiel Tauri HTTP, activé uniquement lorsque
  `isTauri()` est vrai et limité à `http://127.0.0.1:3000/api/v1/**`.
- État API indisponible : interface d'erreur et reprise manuelle existantes, sans prétendre à un mode offline complet.
- Stockage métier local : aucun pendant les runs 0 à 12.
- Artefacts visés : binaire Linux release et bundle Linux produit par Tauri si l'outillage WSL le permet.

## Matrice d'environnement API

| Contexte | URL actuelle | Transport |
| --- | --- | --- |
| Web local Vite | fallback `http://127.0.0.1:3000/api/v1` ou `VITE_API_BASE_URL` | `fetch` navigateur |
| Tauri dev WSLg | `frontend/.env.desktop` | plugin HTTP Tauri |
| Tauri bundle WSLg | valeur `VITE_API_BASE_URL` au build, fallback local actuel | plugin HTTP Tauri |
| API distante future | non configurée ; HTTPS obligatoire | à définir au run de déploiement |

Aucun secret ne peut être placé dans une variable `VITE_*`, car sa valeur est
publique dans le bundle frontend.

## Sécurité initiale

- CSP limitée aux ressources embarquées et à l'IPC Tauri.
- CORS limité à `http://127.0.0.1:5173` : le client HTTP Tauri ne dépend pas du CORS
  navigateur.
- Une seule capability de production pour `main`, composée uniquement du
  client HTTP limité à l'API locale.
- Aucun plugin Store, Shell ou Clipboard.
- Aucun secret dans le bundle frontend.

## Compatibilité future

Les choix actuels doivent laisser possibles :

- le déploiement du même frontend dans un navigateur ;
- une authentification partagée web/Desktop ;
- une réplique locale Desktop ;
- un mode offline ;
- une synchronisation bidirectionnelle avec résolution explicite des conflits.

Ces capacités restent hors périmètre des runs 0 à 12.

## Hors périmètre

- Windows, NSIS, MSI et WebView2 ;
- macOS ;
- backend Rails embarqué comme sidecar ;
- authentification ;
- stockage offline ;
- synchronisation ;
- publication externe et signature.

## Conséquences

- Le Desktop dépend de Rails pendant les runs 0 à 12.
- Le plugin HTTP Tauri est requis : WebKitGTK a refusé le `fetch` Web direct
  vers l'API HTTP locale avant émission de la requête.
- Une indisponibilité de Rails est un état visible, pas un stockage alternatif.
- Un bundle WSL/WSLg ne constitue aucune preuve de compatibilité Windows.
- Toute modification de cette décision doit être validée puis répercutée dans `brief.md`, `runs-workflow.md` et `runs-journal`.
