# Mon français — v2.1

PWA pour progresser en français : écouter, parler, écrire, discuter avec Claude, et suivre sa progression.
Elle marche sur iPhone (installée sur l'écran d'accueil) et sur ordinateur (barre latérale, mise en page large).
Design : Decision Compass v1.0.

## Ce qui a changé depuis la v1

- **Le serveur passe en « edge functions ».** Les fonctions Netlify classiques coupent la réponse après 10 secondes, alors qu'une correction de Claude peut durer 20 à 40 secondes. Les edge functions n'ont pas cette limite.
- **L'IA au choix : DeepSeek ou Claude.** Avec `DEEPSEEK_API_KEY`, l'app utilise DeepSeek (modèle `deepseek-flash`, via son API compatible Anthropic). Sinon, elle utilise Claude.
- **Le modèle Claude est choisi automatiquement.** Si le modèle demandé n'existe pas pour ton compte, l'app prend le Sonnet le plus récent.
- **La transcription de la voix marche partout,** avec une clé Groq gratuite (ou une clé OpenAI).
- **Messages d'erreur précis** (clé refusée, plus de crédit, code faux, serveur absent) et un bouton **Tester la connexion** dans les Réglages.
- **Version ordinateur,** et corrections d'interface (flèches du coach, dictée, voix sur iPhone).

## Mise en ligne sur Vercel (conseillé)

Le projet marche tel quel sur Vercel : `vercel.json` et le dossier `api/` sont prêts. Sur le plan gratuit, une fonction peut tourner 5 minutes, donc les longues réponses de Claude passent sans problème.

1. Mets ce dossier dans un dépôt GitHub privé (par exemple `mon-francais`).
2. Vercel › Add New › Project › importe le dépôt. Framework Preset : **Other**. Ne change rien d'autre.
3. Settings › Environment Variables : ajoute `DEEPSEEK_API_KEY`, `APP_CODE` et `GROQ_API_KEY` (voir le tableau plus bas).
4. Deployments › … › **Redeploy**, pour que les variables comptent.
5. Ouvre l'app › Réglages › entre ton code › **Tester la connexion**.

Limite Vercel : un enregistrement envoyé à la transcription doit faire moins de 4,5 Mo (environ 3 minutes de voix). L'app arrête donc l'enregistrement à 3 minutes.

## Mise en ligne sur Netlify

> Important : le **glisser-déposer** (Netlify Drop) n'installe que les pages, pas la partie serveur.
> L'app doit être déployée **depuis GitHub** ou avec **netlify-cli**.

1. Mets ce dossier dans un dépôt GitHub privé (par exemple `mon-francais`).
2. Netlify › Add new site › Import an existing project › GitHub › choisis le dépôt. Ne remplis rien : `netlify.toml` suffit.
3. Site configuration › Environment variables :

| Variable | Obligatoire ? | Rôle |
|---|---|---|
| `DEEPSEEK_API_KEY` | Oui (ou la clé Claude) | Ta clé DeepSeek (platform.deepseek.com › API keys). Le compte doit avoir du solde. |
| `DEEPSEEK_MODEL` | Non | Par défaut `deepseek-flash`. Mets `deepseek-v4-pro` pour plus de qualité (plus cher). |
| `ANTHROPIC_API_KEY` | Non | Pour utiliser Claude à la place de DeepSeek. |
| `APP_CODE` | Conseillé | Un code secret. Sans lui, n'importe qui avec l'adresse peut utiliser ta clé. |
| `GROQ_API_KEY` | Conseillé | Transcription de la voix, **gratuite** (console.groq.com › API Keys). |
| `OPENAI_API_KEY` | Non | Autre choix pour la transcription, payant. |
| `CLAUDE_MODEL` | Non | Avec Claude seulement : pour forcer un modèle. |

4. Deploys › Trigger deploy › **Deploy site** (les variables ne comptent qu'après un nouveau déploiement).
5. Ouvre l'app › Réglages › entre ton code › **Tester la connexion**. Les trois lignes doivent être vertes.

Sans GitHub : dans ce dossier, `npx netlify-cli deploy --prod`, puis ajoute les variables et redéploie.

## Installation sur l'iPhone

1. Ouvre l'adresse dans **Safari**, touche **Partager**, puis **Sur l'écran d'accueil**.
2. Ouvre l'app, va dans **Réglages**, entre ton code et teste la connexion.
3. Pour une meilleure voix : Réglages de l'iPhone › Accessibilité › Contenu énoncé › Voix › Français › télécharge une voix « améliorée » (Thomas ou Audrey), puis choisis-la dans l'app.

## Bon à savoir

- Tes données restent dans ton navigateur (progression, carnet, enregistrements). L'iPhone et l'ordinateur ne partagent pas les mêmes données : utilise Exporter / Importer dans les Réglages pour passer de l'un à l'autre.
- L'IA ne lit pas l'audio : ta voix est transcrite par Whisper (Groq), puis l'IA analyse le texte.
- Sans clé Groq, l'app utilise la reconnaissance vocale du navigateur (Chrome, Safari sur ordinateur). Dans l'app installée sur iPhone, elle n'est pas fiable : la clé Groq est alors nécessaire.
