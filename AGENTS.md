# fFacturagen

Application de facturation (clients, articles, factures, impression PDF via le navigateur).

## Stack

- `server/` — API Express (Node 22, ESM) + PostgreSQL (`pg`). Les tables sont créées au démarrage
  (`server/db.js`, `create table if not exists`) et des données de démonstration sont insérées
  uniquement quand la table `clients` est vide.
- `src/` — React + React Router, servie par Vite en mode middleware depuis `server/index.js`
  (un seul processus, un seul port : 3000).
- Devise et interface en français, montants en DZD.

## Démarrage local (sandbox)

```
docker compose -f docker-compose.base44.yml up -d --build
```

- `web` : Node 22 + Vite en mode dev (HMR), source montée depuis le dépôt.
- `db` : PostgreSQL 16, volume nommé `db_data`. Le schéma est créé et un jeu de données de
  démonstration est inséré au démarrage uniquement si la table `clients` est vide.

Les dépendances sont installées au démarrage du conteneur (`npm ci`) dans le volume `node_modules`.
Si `package.json` ou `package-lock.json` changent, redémarrer le service suffit ; si les images
changent, relancer avec `--build`.

## Vérifications

```
curl -s http://localhost:3000/api/clients | head
docker compose -f docker-compose.base44.yml ps
```

Aucune migration séparée : `server/db.js` crée le schéma (`create table if not exists`) et insère
des données de démonstration au premier démarrage uniquement.

## Notes d'environnement

- `vite.config.js` ajoute `.${BASE44_SANDBOX_HOST_DOMAIN}` à `server.allowedHosts` uniquement
  quand `BASE44_PREVIEW_MODE === "1"` (le proxy du sandbox change de nom d'hôte). Sans ce
  drapeau, la configuration d'origine est utilisée telle quelle.
- Aucun secret externe n'est requis : la base tourne dans Compose avec des identifiants locaux.
- Les paramètres d'entreprise affichés sur les factures sont stockés côté navigateur
  (`localStorage`, clé `ffacturagen.company`) depuis la page Paramètres.
