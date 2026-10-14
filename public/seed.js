export const SEED = {
"families": [
{
"id": "pronoms",
"name": "Pronoms et verbes pronominaux",
"rule": "Le pronom suit le sujet : je → me, tu → te, il → se. Avec avoir, le pronom se place avant l'auxiliaire : tu m'as dit."
},
{
"id": "genre",
"name": "Genre et accord",
"rule": "Le genre s'apprend mot par mot. Les noms en -ie, -tion, -té sont presque toujours féminins. L'adjectif prend le genre et le nombre du nom."
},
{
"id": "conjugaison",
"name": "Conjugaison et temps",
"rule": "Avec « tu », le verbe prend un s. Après sans, arrêter de, aller : infinitif. Après vouloir que : subjonctif."
},
{
"id": "negation",
"name": "Négation",
"rule": "À l'écrit, la négation a deux parties : ne… pas, ne… rien, ne… jamais, ne… que."
},
{
"id": "relatifs",
"name": "Qui, que, dont, si",
"rule": "Qui = sujet. Que = complément. Dont remplace de + quelque chose. Question indirecte : si."
},
{
"id": "prepositions",
"name": "Prépositions et expressions",
"rule": "Pas de logique ici : note la préposition avec le mot, à chaque nouveau verbe."
},
{
"id": "orthographe",
"name": "Orthographe et coquilles",
"rule": "Relis lentement : accents, cédilles et mots courts (et/est, a/à, ou/où)."
},
{
"id": "anglicismes",
"name": "Anglicismes et registre",
"rule": "Cherche l'équivalent français simple : numérique, état d'esprit, ADN."
},
{
"id": "tournures",
"name": "Tournures naturelles",
"rule": "Ta phrase est comprise, mais un francophone dirait autrement."
}
],
"errors": [
{
"f": "pronoms",
"w": "j'ai décidé de se lancer",
"r": "j'ai décidé de me lancer",
"y": "C'est toi qui te lances : je → me, tu → te, il → se."
},
{
"f": "pronoms",
"w": "je vais se développer",
"r": "je vais me développer",
"y": "Même règle : le pronom suit le sujet."
},
{
"f": "pronoms",
"w": "je suis entrain de se préparer",
"r": "je suis en train de me préparer",
"y": "Pronom « me », et « en train de » s'écrit en trois mots."
},
{
"f": "pronoms",
"w": "afin d'assurer qu'il y a pas de fautes",
"r": "afin de m'assurer qu'il n'y a pas de fautes",
"y": "S'assurer est pronominal. Et la négation a deux parties à l'écrit."
},
{
"f": "pronoms",
"w": "tu as me proposé",
"r": "tu m'as proposé",
"y": "Avec avoir, le pronom passe avant l'auxiliaire. Me devient m' devant une voyelle."
},
{
"f": "pronoms",
"w": "tu as vraiment m'expliquer beaucoup de choses",
"r": "tu m'as vraiment expliqué beaucoup de choses",
"y": "Pronom avant l'auxiliaire, puis participe passé (expliqué)."
},
{
"f": "pronoms",
"w": "la fille à m'as répondu",
"r": "la fille m'a répondu",
"y": "Elle → m'a. Tu → m'as."
},
{
"f": "pronoms",
"w": "je veux le répondre",
"r": "je veux lui répondre",
"y": "On répond à quelqu'un : « lui », pas « le »."
},
{
"f": "pronoms",
"w": "des exemples que je peux les utiliser",
"r": "des exemples que je peux utiliser",
"y": "« que » remplace déjà « les exemples ». On ne le répète pas."
},
{
"f": "pronoms",
"w": "3 livres que je peux les programmer",
"r": "3 livres que je peux programmer",
"y": "Même doublon avec « que »."
},
{
"f": "pronoms",
"w": "je me sens que mon français est bien",
"r": "je sens que mon français est bien",
"y": "Sentir une impression : « je sens que ». Se sentir + état : « je me sens bien »."
},
{
"f": "genre",
"w": "le français est un angoisse",
"r": "le français est une angoisse",
"y": "Angoisse est féminin. Les noms en -ie, -tion, -té sont presque toujours féminins."
},
{
"f": "genre",
"w": "c'est un envie",
"r": "c'est une envie",
"y": "Envie est féminin."
},
{
"f": "genre",
"w": "le grammaire",
"r": "la grammaire",
"y": "Grammaire est féminin."
},
{
"f": "genre",
"w": "mon cible",
"r": "ma cible",
"y": "Cible est féminin."
},
{
"f": "genre",
"w": "mon deuxième astuce",
"r": "ma deuxième astuce",
"y": "Astuce est féminin."
},
{
"f": "genre",
"w": "essaie d'utiliser l'IA, il va t'aider",
"r": "essaie d'utiliser l'IA, elle va t'aider",
"y": "IA = intelligence artificielle, féminin."
},
{
"f": "genre",
"w": "des termes assez difficile",
"r": "des termes assez difficiles",
"y": "L'adjectif prend le nombre du nom."
},
{
"f": "genre",
"w": "des chemins plus long",
"r": "des chemins plus longs",
"y": "Même règle."
},
{
"f": "genre",
"w": "la posture est beaucoup mieux et adapté",
"r": "la posture est bien plus adaptée",
"y": "Posture est féminin, donc adaptée."
},
{
"f": "genre",
"w": "des sujets très importantes",
"r": "des sujets vraiment importants",
"y": "Sujet est masculin."
},
{
"f": "genre",
"w": "les même problème reste",
"r": "les mêmes problèmes restent",
"y": "Tout se met au pluriel : même, nom, verbe."
},
{
"f": "genre",
"w": "je suis fiers",
"r": "je suis fier",
"y": "« Je » est singulier."
},
{
"f": "genre",
"w": "tout ce que tu viens de dire est correcte",
"r": "tout ce que tu viens de dire est correct",
"y": "« Tout ce que » est masculin. Le e est pour une phrase correcte."
},
{
"f": "genre",
"w": "la plupart des designer faisant la transition",
"r": "la plupart des designers font la transition",
"y": "Pluriel, et une phrase a besoin d'un verbe conjugué."
},
{
"f": "genre",
"w": "Skills persistant",
"r": "Skills persistants ou durables",
"y": "Pluriel. « Durables » sonne plus naturel que « persistants »."
},
{
"f": "conjugaison",
"w": "lorsque tu corrige mon français",
"r": "lorsque tu corriges mon français",
"y": "Avec « tu », le verbe prend un s : tu corriges, tu lis, tu écris."
},
{
"f": "conjugaison",
"w": "tu l'utilise beaucoup",
"r": "tu l'utilises beaucoup",
"y": "Même règle. C'est la faute qui revient le plus."
},
{
"f": "conjugaison",
"w": "lorsque tu demande 15000 euro",
"r": "lorsque tu demandes 15 000 euros",
"y": "s avec « tu », et euros prend un s."
},
{
"f": "conjugaison",
"w": "tu trouve",
"r": "tu trouves",
"y": "Même règle."
},
{
"f": "conjugaison",
"w": "je le met en anglais",
"r": "je le mets en anglais",
"y": "Le verbe mettre : je mets."
},
{
"f": "conjugaison",
"w": "je l'ai relis plusieurs fois",
"r": "je l'ai relu plusieurs fois",
"y": "Passé composé : j'ai relu. « Relis » est le présent."
},
{
"f": "conjugaison",
"w": "ça serai utile",
"r": "ça serait utile",
"y": "Serait = conditionnel. Serai = futur (je serai)."
},
{
"f": "conjugaison",
"w": "ça veut dite",
"r": "ça veut dire",
"y": "Coquille : le verbe est dire."
},
{
"f": "conjugaison",
"w": "je n'arrivai même à écrire comme ça",
"r": "je n'arrivais même pas à écrire comme ça",
"y": "Imparfait en -ais, et il manque « pas »."
},
{
"f": "conjugaison",
"w": "ça prendre du temps",
"r": "ça prend du temps",
"y": "Présent, 3e personne : ça prend."
},
{
"f": "conjugaison",
"w": "je sentais que je comprenais (maintenant)",
"r": "je sens que je comprends",
"y": "Pour décrire le présent, on garde le présent."
},
{
"f": "conjugaison",
"w": "j'ai senti qu'il va appliquer ça",
"r": "j'ai senti qu'il allait appliquer ça",
"y": "Concordance : phrase principale au passé → imparfait."
},
{
"f": "conjugaison",
"w": "nécessitent d'être enlever",
"r": "nécessitent d'être enlevés",
"y": "Après « être », participe passé, accordé avec éléments."
},
{
"f": "conjugaison",
"w": "je l'achète sans regretté après",
"r": "je l'achète sans regretter après",
"y": "Après « sans », toujours l'infinitif."
},
{
"f": "conjugaison",
"w": "laisse-nous analyse le rapport",
"r": "laisse-nous analyser le rapport",
"y": "Trait d'union à l'impératif, puis infinitif."
},
{
"f": "conjugaison",
"w": "arrête de le considère",
"r": "arrête de le considérer",
"y": "Après « arrêter de », infinitif."
},
{
"f": "conjugaison",
"w": "ne consider pas",
"r": "ne considère pas",
"y": "Impératif de considérer : considère, avec accent."
},
{
"f": "conjugaison",
"w": "je vais juste de nuancer mon idée",
"r": "je vais juste nuancer mon idée",
"y": "Après « aller », pas de « de »."
},
{
"f": "conjugaison",
"w": "et aussi valorisé mon positionnement",
"r": "et aussi valoriser mon positionnement",
"y": "Les deux verbes vont ensemble : développer et valoriser."
},
{
"f": "conjugaison",
"w": "je veux que tu le répondre",
"r": "je veux que tu y répondes",
"y": "Après « vouloir que », subjonctif. « y » remplace « à ce post »."
},
{
"f": "conjugaison",
"w": "je veux qu'on écrit ma version",
"r": "je veux qu'on écrive ma version",
"y": "Subjonctif après « vouloir que »."
},
{
"f": "conjugaison",
"w": "je veux que tu reduit ce message",
"r": "je veux que tu réduises ce message",
"y": "Subjonctif, avec accent."
},
{
"f": "negation",
"w": "je sais pas",
"r": "je ne sais pas",
"y": "À l'écrit, la négation a deux parties. À l'oral, on peut sauter le ne."
},
{
"f": "negation",
"w": "je ressens rien",
"r": "je ne ressens rien",
"y": "Même règle avec « rien »."
},
{
"f": "negation",
"w": "je consomme que le contenu français",
"r": "je ne consomme que du contenu français",
"y": "« ne… que » veut dire seulement. « Du contenu » : contenu en général."
},
{
"f": "negation",
"w": "ça ne veut dire pas",
"r": "ça ne veut pas dire",
"y": "La négation entoure le verbe conjugué (veut), pas l'infinitif (dire)."
},
{
"f": "negation",
"w": "pas du tous",
"r": "pas du tout",
"y": "« Du tout » ne prend jamais de s."
},
{
"f": "negation",
"w": "aucune fois j'ai rencontré ça",
"r": "je n'ai jamais rencontré ça",
"y": "« Jamais » avec la négation complète."
},
{
"f": "relatifs",
"w": "ce qu'est primordial",
"r": "ce qui est primordial",
"y": "« Qui » est sujet du verbe qui suit."
},
{
"f": "relatifs",
"w": "ce que j'ai besoin",
"r": "ce dont j'ai besoin",
"y": "On dit avoir besoin DE : le « de » donne « dont »."
},
{
"f": "relatifs",
"w": "j'utilise ce qui j'ai",
"r": "j'utilise ce que j'ai",
"y": "« Ce que » quand c'est le complément."
},
{
"f": "relatifs",
"w": "je sais pas qui signifie ce concept",
"r": "je ne sais pas ce que signifie ce concept",
"y": "Un concept est une chose : « ce que »."
},
{
"f": "relatifs",
"w": "je sais pas est-ce qu'il est le bon terme",
"r": "je ne sais pas si c'est le bon terme",
"y": "Question indirecte : « si », pas « est-ce que »."
},
{
"f": "prepositions",
"w": "nous avons parlé de le syndrome",
"r": "nous avons parlé du syndrome",
"y": "De + le = du, sans exception."
},
{
"f": "prepositions",
"w": "avoir une idée sur ces règles",
"r": "avoir une idée de ces règles",
"y": "Une idée DE quelque chose."
},
{
"f": "prepositions",
"w": "changer notre vision à ces outils",
"r": "changer notre vision de ces outils",
"y": "Une vision DE quelque chose."
},
{
"f": "prepositions",
"w": "la plupart de temps",
"r": "la plupart du temps",
"y": "Expression figée."
},
{
"f": "prepositions",
"w": "plus au moins",
"r": "plus ou moins",
"y": "Expression figée avec « ou »."
},
{
"f": "prepositions",
"w": "aucune relation avec la recherche",
"r": "aucun rapport avec la recherche",
"y": "Relation s'emploie plutôt entre personnes."
},
{
"f": "prepositions",
"w": "à propos ce post",
"r": "à propos de ce post",
"y": "« À propos » est toujours suivi de « de »."
},
{
"f": "prepositions",
"w": "répondre à ce poste en LinkedIn",
"r": "répondre à ce post sur LinkedIn",
"y": "Post = publication. Poste = emploi. Et on est SUR une plateforme."
},
{
"f": "prepositions",
"w": "chaque virgule dans ça place",
"r": "chaque virgule à sa place",
"y": "« Sa » est le possessif. « Ça » veut dire cela."
},
{
"f": "prepositions",
"w": "il a l'aire de penser comme moi",
"r": "il a l'air de penser comme moi",
"y": "Avoir l'air de. « Aire » est une surface."
},
{
"f": "prepositions",
"w": "en tabt que consultant",
"r": "en tant que consultant",
"y": "Trois mots : en tant que."
},
{
"f": "prepositions",
"w": "vue l'émergence de l'IA",
"r": "vu l'émergence de l'IA",
"y": "« Vu » en début de phrase reste invariable."
},
{
"f": "prepositions",
"w": "dans qu'il ville",
"r": "dans quelle ville",
"y": "« Quelle » s'accorde avec ville."
},
{
"f": "prepositions",
"w": "qu'il sont les meilleur metier",
"r": "quels sont les meilleurs métiers",
"y": "« Quels » s'accorde avec métiers."
},
{
"f": "prepositions",
"w": "combien du travail / combien des pages",
"r": "combien de travail / combien de pages",
"y": "Après « combien », on met « de »."
},
{
"f": "prepositions",
"w": "de dire que / dont tel façon",
"r": "de telle façon, pour dire que",
"y": "Telle s'accorde avec façon. « Pour dire » exprime l'intention."
},
{
"f": "prepositions",
"w": "a distance ou presented",
"r": "à distance ou en présentiel",
"y": "Accent sur le à. Présentiel est le mot français."
},
{
"f": "prepositions",
"w": "je veux le traité d'une nouvelle angle",
"r": "je veux le traiter sous un nouvel angle",
"y": "Infinitif après vouloir, angle est masculin, et on traite un sujet sous un angle."
},
{
"f": "prepositions",
"w": "tu penses je le met",
"r": "tu penses que je le mets",
"y": "Il manque « que » après penser."
},
{
"f": "prepositions",
"w": "est aussi j'ai lu",
"r": "et aussi j'ai lu",
"y": "« Et » relie. « Est » est le verbe être."
},
{
"f": "prepositions",
"w": "tous le monde",
"r": "tout le monde",
"y": "Expression figée, toujours au singulier."
},
{
"f": "prepositions",
"w": "investir contre IA",
"r": "investir contre l'IA",
"y": "Il manque l'article."
},
{
"f": "prepositions",
"w": "pourquoi vos clients qui partent, partentils",
"r": "pourquoi vos clients qui partent, partent-ils",
"y": "Verbe et sujet inversés : trait d'union obligatoire."
},
{
"f": "orthographe",
"w": "nécessitée / indisponsable",
"r": "nécessité / indispensable",
"y": "Un seul e à la fin. Et « pen » au milieu."
},
{
"f": "orthographe",
"w": "objectf",
"r": "objectif",
"y": "Lettre oubliée."
},
{
"f": "orthographe",
"w": "honntement",
"r": "honnêtement",
"y": "Accent circonflexe."
},
{
"f": "orthographe",
"w": "reparation des telephone",
"r": "réparation des téléphones",
"y": "Accents et pluriel."
},
{
"f": "orthographe",
"w": "reseaux sociax",
"r": "réseaux sociaux",
"y": "Accent, et « aux » à la fin."
},
{
"f": "orthographe",
"w": "jusqu'a minatant",
"r": "jusqu'à maintenant",
"y": "Accent sur à. Maintenant s'écrit en entier."
},
{
"f": "orthographe",
"w": "aujopurdui",
"r": "aujourd'hui",
"y": "Lettres inversées."
},
{
"f": "orthographe",
"w": "cousr / langues semaines",
"r": "cours / longues semaines",
"y": "Langue (ce qu'on parle) ≠ longue (durée)."
},
{
"f": "orthographe",
"w": "je viens de notre cette expression",
"r": "je viens de noter cette expression",
"y": "Coquille : noter."
},
{
"f": "orthographe",
"w": "je churches pas",
"r": "je ne cherche pas",
"y": "Coquille, et il manque « ne »."
},
{
"f": "orthographe",
"w": "permium / atteinder / livre blac",
"r": "premium / atteindre / livre blanc",
"y": "Lettres inversées ou ajoutées."
},
{
"f": "orthographe",
"w": "profile",
"r": "profil",
"y": "En français, pas de e final."
},
{
"f": "orthographe",
"w": "timless",
"r": "intemporel",
"y": "Le mot français."
},
{
"f": "orthographe",
"w": "un peut",
"r": "un peu",
"y": "Peut = verbe pouvoir. Peu = quantité."
},
{
"f": "orthographe",
"w": "ca / tres",
"r": "ça / très",
"y": "Cédille et accent."
},
{
"f": "orthographe",
"w": "a / à, et / est, ou / où",
"r": "à / et / est / où",
"y": "Les mots courts : relis-les en dernier."
},
{
"f": "anglicismes",
"w": "produits digitaux",
"r": "produits numériques",
"y": "« Digital » est un anglicisme critiqué en français soigné."
},
{
"f": "anglicismes",
"w": "cette mindset",
"r": "cet état d'esprit",
"y": "Mot anglais → équivalent français."
},
{
"f": "anglicismes",
"w": "notre DNA",
"r": "notre ADN",
"y": "En français : ADN."
},
{
"f": "anglicismes",
"w": "AI Product Builder (dans une phrase française)",
"r": "IA Product Builder",
"y": "En français, on écrit IA. Garde AI seulement pour un titre anglais."
},
{
"f": "anglicismes",
"w": "c'est top",
"r": "c'est très bien / c'est une réussite",
"y": "Familier. À éviter dans un texte soigné."
},
{
"f": "anglicismes",
"w": "c'est quoi le service design",
"r": "qu'est-ce que le service design",
"y": "« C'est quoi » est oral. À l'écrit soigné : « qu'est-ce que »."
},
{
"f": "anglicismes",
"w": "et en fin",
"r": "enfin",
"y": "Un seul mot pour « finalement »."
},
{
"f": "anglicismes",
"w": "réduire mon chargement cognitif",
"r": "réduire ma charge cognitive",
"y": "Chargement = action de charger un fichier. Charge = poids."
},
{
"f": "tournures",
"w": "ça me facilite la vie d'apprentissage",
"r": "ça facilite mon apprentissage",
"y": "Plus court, plus naturel."
},
{
"f": "tournures",
"w": "sans beaucoup dire",
"r": "sans en dire plus",
"y": "Tournure figée que les francophones utilisent."
},
{
"f": "tournures",
"w": "ça ne dis pas que mon français est mauvais",
"r": "ça ne veut pas dire que mon français est mauvais",
"y": "« Ne veut pas dire » est la tournure naturelle."
},
{
"f": "tournures",
"w": "je monte en confiance",
"r": "je gagne en confiance",
"y": "Gagner en confiance est plus courant."
},
{
"f": "tournures",
"w": "comme nous avons discuté avant",
"r": "comme nous l'avons dit avant",
"y": "Plus naturel."
},
{
"f": "tournures",
"w": "pour que je sois honnête avec toi",
"r": "pour être honnête avec toi",
"y": "Même sujet : on simplifie avec l'infinitif."
},
{
"f": "tournures",
"w": "essaie de bénéficier de l'IA",
"r": "essaie d'utiliser l'IA / de tirer profit de l'IA",
"y": "« Bénéficier » est plus lourd, plutôt formel ou financier."
},
{
"f": "tournures",
"w": "ce qui est intéressant vraiment que je vois",
"r": "ce qui est vraiment intéressant, c'est que je vois",
"y": "Structure « ce qui… c'est que » pour mettre en avant."
},
{
"f": "tournures",
"w": "j'utilise de vocabulaire",
"r": "j'utilise un vocabulaire",
"y": "Il faut l'article un."
}
],
"vocab": [
{
"m": "idiomatique",
"s": "Propre à une langue : ça sonne naturel pour ceux qui la parlent depuis toujours.",
"e": "« Aucun rapport avec » est idiomatique. « Aucune relation avec » est correct, mais moins naturel.",
"c": "langue"
},
{
"m": "une tournure",
"s": "Une façon de construire une phrase pour dire une idée.",
"e": "« J'ai besoin de pratiquer » / « Il me faut pratiquer » : deux tournures pour la même idée.",
"c": "langue"
},
{
"m": "une expression idiomatique",
"s": "Un groupe de mots figé, qu'on ne traduit pas mot à mot.",
"e": "« Tomber dans les pommes » veut dire s'évanouir.",
"c": "langue"
},
{
"m": "un automatisme",
"s": "Un réflexe de langue : la bonne forme sort sans calculer.",
"e": "« Tu corriges » avec un s devient un automatisme à force de le voir.",
"c": "langue"
},
{
"m": "déguisé (en)",
"s": "Qui cache sa vraie nature sous une fausse apparence.",
"e": "Une souffrance déguisée en sourire. Une peur déguisée en prudence.",
"c": "langue"
},
{
"m": "lucide",
"s": "Qui voit les choses telles qu'elles sont, sans se raconter d'histoires.",
"e": "Je reste lucide sur mes fautes.",
"c": "langue"
},
{
"m": "avoir hâte de",
"s": "Attendre quelque chose avec impatience et plaisir. Jamais « hâte à ».",
"e": "J'ai hâte de commencer la lecture.",
"c": "langue"
},
{
"m": "tirer profit de",
"s": "Utiliser quelque chose pour en obtenir un avantage.",
"e": "Essaie de tirer profit de l'IA.",
"c": "langue"
},
{
"m": "scroller / faire défiler / parcourir",
"s": "Scroller est un anglicisme familier. Faire défiler = bouger l'écran. Parcourir = lire vite.",
"e": "Je parcours mon fil LinkedIn.",
"c": "langue"
},
{
"m": "se foutre de la gueule de quelqu'un",
"s": "Très familier : se moquer de quelqu'un. À comprendre, pas à écrire dans un texte pro.",
"e": "Ce client se fout de ma gueule (oral, entre proches).",
"c": "langue"
},
{
"m": "un calque",
"s": "Une phrase construite mot à mot depuis l'arabe ou l'anglais, qui sonne étrange en français.",
"e": "« Je suis à quel niveau » sonne calqué. Mieux : « quel est mon niveau ».",
"c": "langue"
},
{
"m": "une reprise emphatique",
"s": "Répéter le sujet par un pronom pour insister.",
"e": "Vos clients qui partent, pourquoi partent-ils ?",
"c": "langue"
},
{
"m": "un néologisme",
"s": "Un mot nouveau, construit selon les règles de la langue.",
"e": "Recompréhension = re- + compréhension.",
"c": "langue"
},
{
"m": "le registre",
"s": "Le niveau de langue : familier, courant, soutenu.",
"e": "« C'est quoi » est familier. « Qu'est-ce que » est courant.",
"c": "langue"
},
{
"m": "un anglicisme",
"s": "Un mot ou une tournure anglaise dans le français.",
"e": "Digital, mindset, top.",
"c": "langue"
},
{
"m": "la concordance des temps",
"s": "Les temps s'adaptent quand la phrase principale est au passé.",
"e": "J'ai senti qu'il allait appliquer ça.",
"c": "langue"
},
{
"m": "une coquille",
"s": "Une faute de frappe (lettre oubliée ou inversée).",
"e": "« Maintenant » écrit « mainatant ».",
"c": "langue"
},
{
"m": "la fluidité",
"s": "Quand la pensée et la langue vont à la même vitesse, sans calcul.",
"e": "C'est ce que tu travailles en ce moment.",
"c": "langue"
},
{
"m": "NPS (Net Promoter Score)",
"s": "Note de 0 à 10 : « recommanderiez-vous ce produit ? » Promoteurs : 9-10. Passifs : 7-8. Détracteurs : 0-6. NPS = % promoteurs − % détracteurs.",
"e": "Un NPS agrégé mélange plusieurs personas qui ne vivent pas la même expérience.",
"c": "métier"
},
{
"m": "LTV (Lifetime Value)",
"s": "Revenu total qu'un client rapporte pendant toute la durée où il reste client.",
"e": "200 dirhams par mois pendant trois ans : environ 7 200 dirhams.",
"c": "métier"
},
{
"m": "CAC",
"s": "Coût d'acquisition d'un client : tout ce qu'on dépense pour en gagner un nouveau.",
"e": "Règle courante : la LTV vaut au moins trois fois le CAC.",
"c": "métier"
},
{
"m": "le churn",
"s": "Les clients qui quittent le produit ou se désabonnent.",
"e": "Pourquoi vos clients qui partent, partent-ils ?",
"c": "métier"
},
{
"m": "scaler",
"s": "Faire grandir un revenu sans faire grandir le temps de travail dans les mêmes proportions.",
"e": "Réparer des téléphones ne scale pas. Vendre une méthode, si.",
"c": "métier"
},
{
"m": "due diligence",
"s": "Vérifications approfondies faites avant un investissement.",
"e": "Un investisseur pose la question en due diligence.",
"c": "métier"
},
{
"m": "le service design",
"s": "Concevoir l'expérience complète d'un service : acteurs, étapes, coulisses.",
"e": "Une plateforme multi-acteurs est un service, pas un simple produit.",
"c": "métier"
},
{
"m": "un livre blanc",
"s": "Document de fond, souvent gratuit, qui apporte de la valeur à une cible en échange d'un contact.",
"e": "Guide du cadrage avant les décisions produit.",
"c": "métier"
},
{
"m": "un mandat",
"s": "Le pouvoir réel d'agir sur une décision, pas seulement de se poser la question.",
"e": "Le stratège se distingue par le mandat, pas par la façon de penser.",
"c": "métier"
},
{
"m": "recompréhension",
"s": "Comprendre à nouveau ce qu'on croyait déjà comprendre. Ton néologisme.",
"e": "Une recompréhension coûte moins cher qu'une refonte ratée.",
"c": "métier"
}
]
};
