// Les consignes envoyées à Claude. Elles portent le profil de Rachid pour que chaque retour soit ciblé.
import { FAMILIES, S, skillScore, cefr } from "./store.js";

const famList = FAMILIES.map((f) => `${f.id} (${f.name})`).join(", ");

function recentErrors(n = 12) {
  return S.errors.filter((e) => e.src !== "bilan").slice(-n).map((e) => `« ${e.w} » → « ${e.r} »`).join(" ; ") || "aucune pour l'instant";
}

export function profile() {
  const lv = (k) => cefr(skillScore(k)) || "à évaluer";
  return `PROFIL DE L'APPRENANT
- Rachid, Marocain, langue maternelle arabe (darija), parle aussi anglais. Designer UX/UI senior, consultant en stratégie UX, formateur à l'OFPPT. Passionné de cinéma, de jeux vidéo et d'IA.
- Niveau actuel : écoute ${lv("ecoute")}, écrit ${lv("ecrit")}, oral ${lv("oral")}.
- Objectif : un français correct, fluide, simple et naturel (pas littéraire). Viser le C1 à l'écrit et à l'oral.
- Ses fautes fréquentes : le s manquant avec « tu » (tu corrige) ; la négation sans « ne » ; la place des pronoms (je vais se lancer, tu as me proposé) ; le genre des noms (un envie, le grammaire) ; ce qui / ce que / ce dont ; les prépositions figées (une idée sur, à propos ce) ; les coquilles et les accents ; les anglicismes (digital, mindset) ; les calques de l'arabe et de l'anglais.
- Ses fautes récentes : ${recentErrors()}.

STYLE DES EXPLICATIONS
Explique toujours en français simple (niveau B1-B2) : phrases courtes, mots courants, pas de jargon, pas d'anglicismes. Tutoie-le. Sois direct et bienveillant, sans flatterie.`;
}

const ERR_SCHEMA = `{"w": "extrait exact de ce qu'il a écrit", "r": "forme juste", "y": "pourquoi, en une phrase simple", "f": "une famille parmi : ${famList}"}`;

// ---------- ÉCRIRE ----------
export function writeCorrection(topic, text) {
  return {
    system: profile() + "\n\nTu es son correcteur d'écrit. Tu réponds UNIQUEMENT avec un objet JSON valide, sans texte autour.",
    prompt: `Sujet donné : ${topic || "libre"}

Texte de Rachid :
"""
${text}
"""

Corrige ce texte. Réponds avec ce JSON :
{
 "score": nombre de 0 à 100 (correction 60 %, naturel des tournures 25 %, richesse 15 %),
 "cecr": "B1" | "B1+" | "B2" | "B2+" | "C1" | "C1+" | "C2",
 "resume": "deux phrases maximum : ce qui va bien, puis la chose la plus importante à travailler",
 "corrige": "son texte corrigé, en gardant au maximum ses mots et son style",
 "c1": "le même message en version C1 : naturel, précis, fluide, sans être littéraire",
 "erreurs": [${ERR_SCHEMA}] (toutes les vraies fautes, 10 au maximum, les plus importantes d'abord ; pas les simples choix de style),
 "tournures": [{"w": "sa tournure correcte mais peu naturelle", "r": "ce qu'un francophone dirait", "y": "pourquoi"}] (3 au maximum),
 "mots": [{"m": "mot ou expression utile de la version C1", "s": "sens simple", "e": "exemple court"}] (2 ou 3)
}`,
    max_tokens: 3000,
  };
}

export function drillGenerate(fam) {
  const ex = S.errors.filter((e) => e.f === fam.id).slice(-6).map((e) => `« ${e.w} » → « ${e.r} »`).join(" ; ");
  return {
    system: profile() + "\n\nTu prépares des exercices. Tu réponds UNIQUEMENT avec un objet JSON valide.",
    prompt: `Prépare un exercice ciblé sur la famille « ${fam.name} » (${fam.rule}).
Ses vraies fautes dans cette famille : ${ex || "aucune encore"}.

Écris 6 phrases NOUVELLES (pas ses phrases), tirées de sa vie : le design, le conseil, la formation, le cinéma, la famille, la tech. Chaque phrase contient exactement UNE faute typique de cette famille, comme lui pourrait l'écrire. Varie les difficultés.
JSON : {"items": [{"faux": "la phrase avec une faute", "indice": "un indice très court, sans donner la réponse"}]}`,
    max_tokens: 1200,
  };
}

export function drillGrade(fam, items, answers) {
  const lines = items.map((it, i) => `${i + 1}. Phrase fautive : « ${it.faux} »\n   Sa correction : « ${answers[i] || "(vide)"} »`).join("\n");
  return {
    system: profile() + "\n\nTu corriges un exercice. Tu réponds UNIQUEMENT avec un objet JSON valide.",
    prompt: `Exercice sur « ${fam.name} ». Pour chaque phrase, dis si sa correction est juste (la faute est corrigée et il n'en a pas ajouté d'autre ; accepte toute forme juste).
${lines}

JSON : {"resultats": [{"ok": true|false, "juste": "une forme juste", "explication": "une phrase simple"}], "score": nombre de 0 à 100, "conseil": "une phrase pour la suite"}`,
    max_tokens: 1500,
  };
}

// ---------- PARLER ----------
export function speakFeedback({ mode, topic, refText, transcript, seconds, wpm, fillers }) {
  const ctx = mode === "lire"
    ? `Mode : LECTURE À VOIX HAUTE. Texte qu'il devait lire :\n"""${refText}"""\nLes différences entre le texte et la transcription viennent surtout de la prononciation (la reconnaissance vocale n'a pas reconnu le mot). Analyse-les pour trouver ses difficultés de sons (u/ou, é/è, p/b, v/f, nasales an/on/in, e muet, liaisons).`
    : `Mode : PRISE DE PAROLE LIBRE. Sujet : ${topic}. La transcription est automatique : ignore la ponctuation, les majuscules, et ce qui ressemble à une erreur de reconnaissance plutôt qu'à une faute de français.`;
  return {
    system: profile() + "\n\nTu es son coach d'oral. Tu ne l'entends pas : tu lis la transcription automatique de sa voix. Tu réponds UNIQUEMENT avec un objet JSON valide.",
    prompt: `${ctx}

Transcription (${seconds} s, ${wpm} mots/min, ${fillers} hésitations comme « euh ») :
"""
${transcript}
"""

Repères : à l'oral, un francophone parle autour de 130 à 170 mots/min ; 100 à 130 est fluide pour un apprenant avancé ; sous 90, la parole est hachée.

JSON :
{
 "score": nombre de 0 à 100 (fluidité 40 %, correction 35 %, richesse et naturel 25 %),
 "cecr": "B1" | "B1+" | "B2" | "B2+" | "C1" | "C1+" | "C2",
 "resume": "deux phrases : ce qui va bien, puis la priorité",
 "fluidite": "une phrase sur son débit, ses pauses et ses hésitations",
 "erreurs": [${ERR_SCHEMA}] (5 au maximum, vraies fautes d'oral seulement),
 "reformulation": "ce qu'il voulait dire, dans un français oral naturel et simple",
 "prononciation": [{"attendu": "mot du texte", "entendu": "ce que la machine a compris", "conseil": "comment placer la bouche ou quel son travailler"}] (vide si mode libre),
 "conseils": ["2 ou 3 conseils concrets pour la prochaine prise de parole"],
 "expressions": [{"m": "expression orale naturelle qu'il aurait pu utiliser", "s": "sens", "e": "exemple"}] (2 au maximum)
}`,
    max_tokens: 2500,
  };
}

export function readAloudText() {
  return {
    system: profile() + "\n\nTu réponds UNIQUEMENT avec un objet JSON valide.",
    prompt: `Écris un court texte à lire à voix haute (70 à 100 mots), naturel, sur un sujet de sa vie (design, conseil, formation, cinéma, Agadir, la famille, l'IA). Glisse beaucoup de sons difficiles pour un arabophone : u / ou (rue, roue), é / è / e muet, p / b, v / f, les nasales an / on / in, et quelques liaisons.
JSON : {"titre": "titre court", "texte": "le texte", "sons": ["les 3 sons travaillés"]}`,
    max_tokens: 700,
  };
}

// ---------- ÉCOUTER ----------
export function listenGenerate({ theme, level, kind }) {
  const len = kind === "dictee" ? "3 ou 4 phrases, 45 à 65 mots au total" : "un texte de 160 à 220 mots, comme une chronique radio ou un message vocal";
  return {
    system: profile() + "\n\nTu crées des exercices d'écoute. Le texte sera lu par une voix de synthèse française. Tu réponds UNIQUEMENT avec un objet JSON valide.",
    prompt: `Crée un exercice d'écoute.
Thème : ${theme}. Niveau visé : ${level}. Longueur : ${len}.
Le texte doit sonner comme du vrai français parlé de France (tournures naturelles, expressions courantes, quelques connecteurs oraux), sans abréviations ni chiffres compliqués, pour que la voix de synthèse le lise bien.
JSON :
{
 "titre": "titre court",
 "texte": "le texte",
 "questions": [{"q": "question", "o": ["4 réponses possibles"], "a": index de la bonne réponse (0 à 3), "x": "explication courte"}] (4 questions sur le sens, les détails et le ton ; vide si dictée),
 "mots": [{"m": "mot ou expression du texte", "s": "sens simple", "e": "phrase du texte"}] (3)
}`,
    max_tokens: 1800,
  };
}

// ---------- COACH ----------
export const COACH_MODES = {
  libre: { name: "Discussion libre", intro: "On parle de ce que tu veux : ta semaine, un film, une idée.", role: "Tu es un ami francophone curieux et cultivé. Vous discutez librement." },
  client: { name: "Appel client", intro: "Je joue une directrice produit qui hésite à acheter ton audit.", role: "Tu joues Claire Martin, directrice produit d'une banque à Casablanca. Rachid t'appelle pour te proposer un audit de stratégie UX. Tu es polie mais exigeante : tu poses des questions sur le prix, la durée, les résultats, et tu as des objections réalistes. Reste dans ton rôle." },
  entretien: { name: "Entretien", intro: "Je suis recruteur pour un poste de UX lead à Paris.", role: "Tu es recruteur dans une entreprise tech à Paris. Tu fais passer un entretien à Rachid pour un poste de UX lead. Pose une question à la fois, relance sur ses réponses, comme dans un vrai entretien." },
  debat: { name: "Débat", intro: "Je défends une idée, tu me contredis avec des arguments.", role: "Tu lances un débat sur un sujet tech ou société (IA, travail, écrans, design). Tu défends une position claire et tu pousses Rachid à argumenter. Reste respectueux mais ne lâche pas facilement." },
  cinema: { name: "Cinéma et séries", intro: "On parle films et séries, comme entre amis.", role: "Tu es un passionné de cinéma et de séries françaises et internationales. Vous discutez de films, de scènes, d'acteurs et de ce qui vous a marqués." },
};

export function coachSystem(modeId, voice) {
  const m = COACH_MODES[modeId] || COACH_MODES.libre;
  return `${profile()}

TON RÔLE
${m.role}
Réponds en 2 à 5 phrases, en français courant soigné et naturel, comme à l'oral entre adultes. Termine souvent par une question pour relancer. Ne corrige JAMAIS dans ta réponse : la conversation doit rester fluide.${voice ? "\nIl parle avec la dictée vocale : ignore la ponctuation et les majuscules dans ses messages." : ""}

CORRECTIONS (invisibles dans la conversation)
Après ta réponse, ajoute une ligne qui contient seulement §§§ puis un JSON sur une ligne :
{"corrections": [${ERR_SCHEMA}]}
avec au maximum 3 vraies fautes de son DERNIER message (pas de simples choix de style). S'il n'y a pas de faute : {"corrections": []}`;
}
