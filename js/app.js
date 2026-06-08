/* ===========================================
   LinguaTutor AI — App Principal
   =========================================== */

const APP = {
  state: {
    teacherName: 'Profesor Alex',
    teacherPhoto: null,
    selectedLang: null,
    selectedLevel: null,
    lessons: [],
    stats: { lessons: 0, words: 0, streak: 0 },
    history: [],
    currentLessonWords: [],
    currentLessonTranslations: [],
    examIndex: 0,
    examScore: 0,
    examTotal: 0,
    oralWords: [],
    oralIndex: 0,
    oralRecordedBlob: null,
    oralRecordedUrl: null,
    oralMediaRecorder: null,
    oralStream: null
  }
};

/* ---- DOM refs ---- */
const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);
const qs = (el, sel) => el.querySelector(sel);

/* ---- Navigation ---- */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const screen = $(id);
  if (screen) screen.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const nav = document.querySelector(`.nav-item[data-screen="${id}"]`);
  if (nav) nav.classList.add('active');
}

/* ---- Toast ---- */
function showToast(msg, duration = 2500) {
  const t = $('toast');
  t.textContent = msg; t.classList.add('visible');
  setTimeout(() => t.classList.remove('visible'), duration);
}

/* ---- Photo Upload ---- */
$('photo-upload').addEventListener('click', () => $('photo-input').click());
$('photo-input').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    APP.state.teacherPhoto = ev.target.result;
    const preview = $('photo-preview');
    preview.innerHTML = `<img src="${ev.target.result}" alt="Foto">`;
    preview.classList.add('has-image');
    updateTeacherAvatars();
  };
  reader.readAsDataURL(file);
});

/* ---- Teacher Form ---- */
$('teacher-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = $('teacher-name').value.trim();
  if (!name) return showToast('Ingresa un nombre para el profesor');
  APP.state.teacherName = name;
  $('header-teacher-name').textContent = name;
  $('profile-name').textContent = name;
  $('teacher-showcase-name').textContent = name;
  showScreen('dashboard');
  showToast(`¡Bienvenido! Tu profesor ${name} te espera`);
});

/* ---- Language Selection ---- */
document.querySelectorAll('.lang-card').forEach(card => {
  card.addEventListener('click', () => {
    const lang = card.dataset.lang;
    document.querySelectorAll('.lang-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    APP.state.selectedLang = lang;
    const names = { en: 'Inglés', de: 'Alemán', fr: 'Francés', es: 'Español' };
    $('welcome-msg').textContent = `Practiquemos ${names[lang]}`;
    generateLesson();
  });
});

/* ---- Level Tabs ---- */
document.querySelectorAll('.level-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.level-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    APP.state.selectedLevel = tab.dataset.level;
    generateLesson();
  });
});

/* ---- Lesson Content Data ---- */
const LESSON_DATA = {
  en: {
    a1: ['Hello', 'Good morning', 'How are you?', 'My name is...', 'Thank you', 'Please', 'Yes', 'No', 'Goodbye', 'I am from...'],
    a2: ['I would like...', 'Where is...?', 'How much is it?', 'Can you help me?', 'I don\'t understand', 'Excuse me', 'I need...', 'Do you speak English?', 'What time is it?', 'I like...'],
    b1: ['I believe that...', 'In my opinion...', 'Could you repeat that?', 'I agree with you', 'On the other hand...', 'First of all...', 'As far as I know...', 'It depends on...', 'I used to...', 'I\'m looking forward to...'],
    b2: ['Nevertheless, ...', 'Furthermore, ...', 'I would appreciate if...', 'It is worth mentioning...', 'Having said that...', 'Under the circumstances...', 'As a matter of fact...', 'I take your point', 'That raises a valid question', 'There is no doubt that...'],
    c1: ['Notwithstanding the aforementioned...', 'From a pragmatic standpoint...', 'This necessitates a comprehensive approach', 'The implications are far-reaching', 'A paradigm shift is evident', 'This merits further investigation', 'The correlation is significant', 'In a broader context...', 'This underscores the importance of...', 'The extrapolation suggests...']
  },
  de: {
    a1: ['Hallo', 'Guten Morgen', 'Wie geht es Ihnen?', 'Ich heiße...', 'Danke', 'Bitte', 'Ja', 'Nein', 'Auf Wiedersehen', 'Ich komme aus...'],
    a2: ['Ich möchte...', 'Wo ist...?', 'Wie viel kostet es?', 'Können Sie mir helfen?', 'Ich verstehe nicht', 'Entschuldigung', 'Ich brauche...', 'Sprechen Sie Deutsch?', 'Wie spät ist es?', 'Ich mag...'],
    b1: ['Ich glaube, dass...', 'Meiner Meinung nach...', 'Könnten Sie das wiederholen?', 'Ich stimme Ihnen zu', 'Andererseits...', 'Zunächst einmal...', 'Soweit ich weiß...', 'Es hängt ab von...', 'Früher habe ich...', 'Ich freue mich auf...'],
    b2: ['Trotzdem...', 'Darüber hinaus...', 'Ich wäre dankbar, wenn...', 'Es ist erwähnenswert, dass...', 'Abgesehen davon...', 'Unter den Umständen...', 'Tatsächlich...', 'Ich verstehe Ihren Standpunkt', 'Das wirft eine wichtige Frage auf', 'Es besteht kein Zweifel, dass...'],
    c1: ['Ungeachtet dessen...', 'Aus pragmatischer Sicht...', 'Dies erfordert einen umfassenden Ansatz', 'Die Auswirkungen sind weitreichend', 'Ein Paradigmenwechsel ist erkennbar', 'Dies verdient weitere Untersuchung', 'Die Korrelation ist signifikant', 'In einem breiteren Kontext...', 'Dies unterstreicht die Bedeutung von...', 'Die Hochrechnung legt nahe...']
  },
  fr: {
    a1: ['Bonjour', 'Bon matin', 'Comment allez-vous?', 'Je m\'appelle...', 'Merci', 'S\'il vous plaît', 'Oui', 'Non', 'Au revoir', 'Je viens de...'],
    a2: ['Je voudrais...', 'Où est...?', 'Combien ça coûte?', 'Pouvez-vous m\'aider?', 'Je ne comprends pas', 'Excusez-moi', 'J\'ai besoin de...', 'Parlez-vous français?', 'Quelle heure est-il?', 'J\'aime...'],
    b1: ['Je crois que...', 'À mon avis...', 'Pourriez-vous répéter?', 'Je suis d\'accord avec vous', 'D\'un autre côté...', 'Tout d\'abord...', 'Pour autant que je sache...', 'Cela dépend de...', 'J\'avais l\'habitude de...', 'J\'ai hâte de...'],
    b2: ['Néanmoins...', 'En outre...', 'Je vous saurais gré de...', 'Il convient de mentionner...', 'Cela étant dit...', 'Compte tenu des circonstances...', 'En fait...', 'Je comprends votre point de vue', 'Cela soulève une question pertinente', 'Il ne fait aucun doute que...'],
    c1: ['Nonobstant ce qui précède...', 'D\'un point de vue pragmatique...', 'Cela nécessite une approche globale', 'Les implications sont considérables', 'Un changement de paradigme est évident', 'Cela mérite une étude plus approfondie', 'La corrélation est significative', 'Dans un contexte plus large...', 'Cela souligne l\'importance de...', 'L\'extrapolation suggère...']
  },
  es: {
    a1: ['Hola', 'Buenos días', '¿Cómo estás?', 'Me llamo...', 'Gracias', 'Por favor', 'Sí', 'No', 'Adiós', 'Soy de...'],
    a2: ['Me gustaría...', '¿Dónde está...?', '¿Cuánto cuesta?', '¿Puedes ayudarme?', 'No entiendo', 'Disculpa', 'Necesito...', '¿Hablas español?', '¿Qué hora es?', 'Me gusta...'],
    b1: ['Creo que...', 'En mi opinión...', '¿Podrías repetir?', 'Estoy de acuerdo', 'Por otro lado...', 'En primer lugar...', 'Hasta donde sé...', 'Depende de...', 'Solía...', 'Tengo ganas de...'],
    b2: ['No obstante...', 'Además...', 'Te agradecería si...', 'Cabe mencionar que...', 'Dicho esto...', 'Bajo las circunstancias...', 'De hecho...', 'Entiendo tu punto', 'Eso plantea una pregunta válida', 'No hay duda de que...'],
    c1: ['Sin perjuicio de lo anterior...', 'Desde un punto de vista pragmático...', 'Esto requiere un enfoque integral', 'Las implicaciones son de gran alcance', 'Es evidente un cambio de paradigma', 'Esto merece una investigación más a fondo', 'La correlación es significativa', 'En un contexto más amplio...', 'Esto subraya la importancia de...', 'La extrapolación sugiere...']
  }
};

const EXAMPLES = {
  en: {
    a1: ['A: Hello! B: Hi there!', 'Good morning, teacher!', 'How are you today?', 'My name is John.', 'Thank you very much!', 'Please sit down.', 'Yes, I understand.', 'No, thank you.', 'Goodbye, see you later!', 'I am from Spain.'],
    a2: ['I would like a coffee, please.', 'Where is the train station?', 'How much is this book?', 'Can you help me find this?', 'I don\'t understand this word.', 'Excuse me, where is the bathroom?', 'I need some water.', 'Do you speak English?', 'What time is the meeting?', 'I like chocolate ice cream.'],
    b1: ['I believe that learning languages is fun.', 'In my opinion, this is the best option.', 'Could you repeat that more slowly?', 'I agree with your point of view.', 'On the other hand, we must consider the cost.', 'First of all, let me introduce myself.', 'As far as I know, the meeting is at 3pm.', 'It depends on the weather.', 'I used to live in London.', 'I\'m looking forward to our trip.'],
    b2: ['Nevertheless, the results were positive.', 'Furthermore, we need to analyze the data.', 'I would appreciate if you could help.', 'It is worth mentioning her contribution.', 'Having said that, we should proceed.', 'Under the circumstances, we understand.', 'As a matter of fact, I agree.', 'I take your point about the budget.', 'That raises a valid question.', 'There is no doubt that practice helps.'],
    c1: ['Notwithstanding the aforementioned issues, we proceed.', 'From a pragmatic standpoint, this is viable.', 'This necessitates a comprehensive strategic approach.', 'The implications are far-reaching for the industry.', 'A paradigm shift is evident in modern linguistics.', 'This merits further investigation by researchers.', 'The correlation is statistically significant.', 'In a broader context, this affects global markets.', 'This underscores the importance of education.', 'The extrapolation suggests continued growth.']
  },
  de: {
    a1: ['A: Hallo! B: Hi!', 'Guten Morgen, Lehrer!', 'Wie geht es Ihnen heute?', 'Ich heiße Maria.', 'Vielen Dank!', 'Bitte setzen Sie sich.', 'Ja, ich verstehe.', 'Nein, danke.', 'Auf Wiedersehen, bis später!', 'Ich komme aus Spanien.'],
    a2: ['Ich möchte einen Kaffee, bitte.', 'Wo ist der Bahnhof?', 'Wie viel kostet dieses Buch?', 'Können Sie mir helfen, das zu finden?', 'Ich verstehe dieses Wort nicht.', 'Entschuldigung, wo ist die Toilette?', 'Ich brauche etwas Wasser.', 'Sprechen Sie Deutsch?', 'Wie spät ist das Meeting?', 'Ich mag Schokoladeneis.'],
    b1: ['Ich glaube, dass Sprachenlernen Spaß macht.', 'Meiner Meinung nach ist das die beste Option.', 'Könnten Sie das langsamer wiederholen?', 'Ich stimme Ihrem Standpunkt zu.', 'Andererseits müssen wir die Kosten bedenken.', 'Zunächst einmal möchte ich mich vorstellen.', 'Soweit ich weiß, ist das Meeting um 15 Uhr.', 'Es hängt vom Wetter ab.', 'Früher habe ich in Berlin gewohnt.', 'Ich freue mich auf unsere Reise.'],
    b2: ['Trotzdem waren die Ergebnisse positiv.', 'Darüber hinaus müssen wir die Daten analysieren.', 'Ich wäre dankbar, wenn Sie helfen könnten.', 'Es ist erwähnenswert, dass sie viel beigetragen hat.', 'Abgesehen davon sollten wir weitermachen.', 'Unter den Umständen verstehen wir das.', 'Tatsächlich stimme ich zu.', 'Ich verstehe Ihren Standpunkt zum Budget.', 'Das wirft eine wichtige Frage auf.', 'Es besteht kein Zweifel, dass Übung hilft.'],
    c1: ['Ungeachtet dessen setzen wir fort.', 'Aus pragmatischer Sicht ist dies machbar.', 'Dies erfordert einen umfassenden strategischen Ansatz.', 'Die Auswirkungen sind branchenweit bedeutend.', 'Ein Paradigmenwechsel ist in der modernen Linguistik erkennbar.', 'Dies verdient weitere Untersuchung durch Forscher.', 'Die Korrelation ist statistisch signifikant.', 'In einem breiteren Kontext betrifft dies den globalen Markt.', 'Dies unterstreicht die Bedeutung der Bildung.', 'Die Hochrechnung legt nahe, dass das Wachstum anhält.']
  },
  fr: {
    a1: ['A: Bonjour! B: Salut!', 'Bonjour, professeur!', 'Comment allez-vous aujourd\'hui?', 'Je m\'appelle Sophie.', 'Merci beaucoup!', 'S\'il vous plaît, asseyez-vous.', 'Oui, je comprends.', 'Non, merci.', 'Au revoir, à plus tard!', 'Je viens d\'Espagne.'],
    a2: ['Je voudrais un café, s\'il vous plaît.', 'Où est la gare?', 'Combien coûte ce livre?', 'Pouvez-vous m\'aider à trouver ceci?', 'Je ne comprends pas ce mot.', 'Excusez-moi, où sont les toilettes?', 'J\'ai besoin d\'eau.', 'Parlez-vous français?', 'À quelle heure est la réunion?', 'J\'aime la glace au chocolat.'],
    b1: ['Je crois que apprendre des langues est amusant.', 'À mon avis, c\'est la meilleure option.', 'Pourriez-vous répéter plus lentement?', 'Je suis d\'accord avec votre point de vue.', 'D\'un autre côté, nous devons considérer le coût.', 'Tout d\'abord, laissez-moi me présenter.', 'Pour autant que je sache, la réunion est à 15h.', 'Cela dépend du temps.', 'J\'avais l\'habitude de vivre à Paris.', 'J\'ai hâte de faire notre voyage.'],
    b2: ['Néanmoins, les résultats étaient positifs.', 'En outre, nous devons analyser les données.', 'Je vous saurais gré de pouvoir aider.', 'Il convient de mentionner sa contribution.', 'Cela étant dit, nous devrions continuer.', 'Compte tenu des circonstances, nous comprenons.', 'En fait, je suis d\'accord.', 'Je comprends votre point de vue sur le budget.', 'Cela soulève une question pertinente.', 'Il ne fait aucun doute que la pratique aide.'],
    c1: ['Nonobstant les problèmes mentionnés, nous continuons.', 'D\'un point de vue pragmatique, c\'est viable.', 'Cela nécessite une approche stratégique globale.', 'Les implications sont considérables pour l\'industrie.', 'Un changement de paradigme est évident en linguistique moderne.', 'Cela mérite une étude plus approfondie par les chercheurs.', 'La corrélation est statistiquement significative.', 'Dans un contexte plus large, cela affecte les marchés mondiaux.', 'Cela souligne l\'importance de l\'éducation.', 'L\'extrapolation suggère une croissance continue.']
  },
  es: {
    a1: ['A: ¡Hola! B: ¡Hola! ¡Qué gusto!', '¡Buenos días, profesor!', '¿Cómo estás hoy?', 'Me llamo Carlos.', '¡Muchas gracias!', 'Por favor, siéntate.', 'Sí, entiendo.', 'No, gracias.', '¡Adiós, hasta luego!', 'Soy de México.'],
    a2: ['Me gustaría un café, por favor.', '¿Dónde está la estación de tren?', '¿Cuánto cuesta este libro?', '¿Puedes ayudarme a encontrar esto?', 'No entiendo esta palabra.', 'Disculpa, ¿dónde está el baño?', 'Necesito agua.', '¿Hablas español?', '¿A qué hora es la reunión?', 'Me gusta el helado de chocolate.'],
    b1: ['Creo que aprender idiomas es divertido.', 'En mi opinión, esta es la mejor opción.', '¿Podrías repetir más despacio?', 'Estoy de acuerdo con tu punto de vista.', 'Por otro lado, debemos considerar el costo.', 'En primer lugar, permíteme presentarme.', 'Hasta donde sé, la reunión es a las 3pm.', 'Depende del clima.', 'Solía vivir en Madrid.', 'Tengo ganas de nuestro viaje.'],
    b2: ['No obstante, los resultados fueron positivos.', 'Además, necesitamos analizar los datos.', 'Te agradecería si pudieras ayudar.', 'Cabe mencionar su contribución.', 'Dicho esto, deberíamos continuar.', 'Bajo las circunstancias, lo entendemos.', 'De hecho, estoy de acuerdo.', 'Entiendo tu punto sobre el presupuesto.', 'Eso plantea una pregunta válida.', 'No hay duda de que la práctica ayuda.'],
    c1: ['Sin perjuicio de lo anterior, continuamos.', 'Desde un punto de vista pragmático, esto es viable.', 'Esto requiere un enfoque estratégico integral.', 'Las implicaciones son de gran alcance para la industria.', 'Es evidente un cambio de paradigma en la lingüística moderna.', 'Esto merece una investigación más a fondo.', 'La correlación es estadísticamente significativa.', 'En un contexto más amplio, esto afecta los mercados globales.', 'Esto subraya la importancia de la educación.', 'La extrapolación sugiere un crecimiento continuo.']
  }
};

/* ---- Conversation Scripts ---- */
const CONVERSATIONS = {
  en: {
    a1: [
      { teacher: "Hello! How are you today?", es: "¡Hola! ¿Cómo estás hoy?" },
      { teacher: "My name is [teacher]. What's your name?", es: "Mi nombre es [teacher]. ¿Cómo te llamas?" },
      { teacher: "Nice to meet you, [student]! Where are you from?", es: "¡Mucho gusto, [student]! ¿De dónde eres?" },
      { teacher: "Wonderful! Do you like learning English?", es: "¡Maravilloso! ¿Te gusta aprender inglés?" },
      { teacher: "That's great! What color do you like?", es: "¡Qué bien! ¿Qué color te gusta?" },
      { teacher: "Excellent! Let's practice more. Can you say 'thank you'?", es: "¡Excelente! Practiquemos más. ¿Puedes decir 'gracias'?" },
      { teacher: "Perfect! You're doing very well. Goodbye for now!", es: "¡Perfecto! Lo estás haciendo muy bien. ¡Hasta luego!" }
    ],
    a2: [
      { teacher: "Good morning! How can I help you today?", es: "¡Buenos días! ¿Cómo puedo ayudarte hoy?" },
      { teacher: "I'd like to go to the supermarket. Where is it?", es: "Me gustaría ir al supermercado. ¿Dónde está?" },
      { teacher: "Thank you! What do you need to buy?", es: "¡Gracias! ¿Qué necesitas comprar?" },
      { teacher: "Good choices! How much does bread cost?", es: "¡Buenas elecciones! ¿Cuánto cuesta el pan?" },
      { teacher: "That's cheap! Do you have any money?", es: "¡Es barato! ¿Tienes dinero?" },
      { teacher: "Perfect! Let's pay and go home. Well done!", es: "¡Perfecto! Paguemos y vayamos a casa. ¡Bien hecho!" }
    ],
    b1: [
      { teacher: "Hi there! What did you do last weekend?", es: "¡Hola! ¿Qué hiciste el fin de semana pasado?" },
      { teacher: "That sounds interesting! Do you enjoy outdoor activities?", es: "¡Suena interesante! ¿Disfrutas las actividades al aire libre?" },
      { teacher: "I see! What's your favorite hobby?", es: "¡Entiendo! ¿Cuál es tu pasatiempo favorito?" },
      { teacher: "That's a great hobby! How long have you been doing it?", es: "¡Es un gran pasatiempo! ¿Cuánto tiempo llevas haciéndolo?" },
      { teacher: "Amazing! I think hobbies are important for our well-being.", es: "¡Increíble! Creo que los pasatiempos son importantes para nuestro bienestar." },
      { teacher: "I agree! Let's meet again and talk more. Take care!", es: "¡Estoy de acuerdo! Encontrémonos de nuevo y hablemos más. ¡Cuídate!" }
    ],
    b2: [
      { teacher: "Good day! I'd like to discuss technology. What do you think about AI?", es: "¡Buen día! Me gustaría discutir sobre tecnología. ¿Qué piensas sobre la IA?" },
      { teacher: "That's an interesting perspective! Do you think AI will replace jobs?", es: "¡Es una perspectiva interesante! ¿Crees que la IA reemplazará empleos?" },
      { teacher: "I understand your point. However, AI also creates new opportunities.", es: "Entiendo tu punto. Sin embargo, la IA también crea nuevas oportunidades." },
      { teacher: "Exactly! What field do you think will benefit most from AI?", es: "¡Exactamente! ¿Qué campo crees que se beneficiará más de la IA?" },
      { teacher: "Fascinating! I think education will transform significantly.", es: "¡Fascinante! Creo que la educación se transformará significativamente." },
      { teacher: "Great discussion! Let's continue another day. Goodbye!", es: "¡Gran discusión! Continuemos otro día. ¡Adiós!" }
    ],
    c1: [
      { teacher: "Greetings! I'd like to explore the concept of globalization. What's your view?", es: "¡Saludos! Me gustaría explorar el concepto de globalización. ¿Cuál es tu opinión?" },
      { teacher: "A compelling argument! How do you think globalization affects local cultures?", es: "¡Un argumento convincente! ¿Cómo crees que la globalización afecta las culturas locales?" },
      { teacher: "That's a nuanced perspective. There are indeed both positive and negative aspects.", es: "Esa es una perspectiva matizada. De hecho, hay aspectos tanto positivos como negativos." },
      { teacher: "Precisely! What measures could mitigate the negative effects?", es: "¡Precisamente! ¿Qué medidas podrían mitigar los efectos negativos?" },
      { teacher: "An excellent suggestion! This requires international cooperation.", es: "¡Una excelente sugerencia! Esto requiere cooperación internacional." },
      { teacher: "It's been a stimulating conversation. I look forward to our next discussion.", es: "Ha sido una conversación estimulante. Espero con interés nuestra próxima discusión." }
    ]
  },
  de: {
    a1: [
      { teacher: "Hallo! Wie geht es Ihnen heute?", es: "¡Hola! ¿Cómo está usted hoy?" },
      { teacher: "Mein Name ist [teacher]. Wie heißen Sie?", es: "Mi nombre es [teacher]. ¿Cómo se llama usted?" },
      { teacher: "Freut mich, [student]! Woher kommen Sie?", es: "¡Mucho gusto, [student]! ¿De dónde viene?" },
      { teacher: "Wunderbar! Lernen Sie gerne Deutsch?", es: "¡Maravilloso! ¿Le gusta aprender alemán?" },
      { teacher: "Sehr gut! Welche Farbe mögen Sie?", es: "¡Muy bien! ¿Qué color le gusta?" },
      { teacher: "Ausgezeichnet! Können Sie 'danke' sagen?", es: "¡Excelente! ¿Puede decir 'gracias'?" },
      { teacher: "Perfekt! Sie machen das sehr gut. Auf Wiedersehen!", es: "¡Perfecto! Lo está haciendo muy bien. ¡Hasta luego!" }
    ],
    a2: [
      { teacher: "Guten Morgen! Wie kann ich Ihnen helfen?", es: "¡Buenos días! ¿Cómo puedo ayudarle?" },
      { teacher: "Ich möchte zum Supermarkt gehen. Wo ist er?", es: "Quisiera ir al supermercado. ¿Dónde está?" },
      { teacher: "Danke! Was möchten Sie kaufen?", es: "¡Gracias! ¿Qué le gustaría comprar?" },
      { teacher: "Gute Wahl! Wie viel kostet das Brot?", es: "¡Buena elección! ¿Cuánto cuesta el pan?" },
      { teacher: "Das ist günstig! Haben Sie Geld?", es: "¡Es barato! ¿Tiene dinero?" },
      { teacher: "Perfekt! Zahlen wir und gehen nach Hause. Gut gemacht!", es: "¡Perfecto! Paguemos y vayamos a casa. ¡Bien hecho!" }
    ],
    b1: [
      { teacher: "Hallo! Was haben Sie am Wochenende gemacht?", es: "¡Hola! ¿Qué hizo el fin de semana?" },
      { teacher: "Das klingt interessant! Machen Sie gerne Aktivitäten im Freien?", es: "¡Suena interesante! ¿Disfruta actividades al aire libre?" },
      { teacher: "Ich verstehe! Was ist Ihr Lieblingshobby?", es: "¡Entiendo! ¿Cuál es su pasatiempo favorito?" },
      { teacher: "Ein tolles Hobby! Wie lange machen Sie das schon?", es: "¡Un gran pasatiempo! ¿Cuánto tiempo lleva haciéndolo?" },
      { teacher: "Toll! Ich denke, Hobbys sind wichtig für unser Wohlbefinden.", es: "¡Increíble! Creo que los pasatiempos son importantes para nuestro bienestar." },
      { teacher: "Ich stimme zu! Treffen wir uns wieder. Passen Sie auf sich auf!", es: "¡Estoy de acuerdo! Encontrémonos de nuevo. ¡Cuídese!" }
    ],
    b2: [
      { teacher: "Guten Tag! Ich möchte über Technologie sprechen. Was denken Sie über KI?", es: "¡Buen día! Hablemos sobre tecnología. ¿Qué piensa sobre la IA?" },
      { teacher: "Ein interessanter Standpunkt! Glauben Sie, dass KI Arbeitsplätze ersetzt?", es: "¡Un punto de vista interesante! ¿Cree que la IA reemplazará empleos?" },
      { teacher: "Ich verstehe Ihren Punkt. KI schafft aber auch neue Chancen.", es: "Entiendo su punto. Pero la IA también crea nuevas oportunidades." },
      { teacher: "Genau! Welcher Bereich wird Ihrer Meinung nach am meisten profitieren?", es: "¡Exactamente! ¿Qué área cree que se beneficiará más?" },
      { teacher: "Faszinierend! Ich glaube, Bildung wird sich stark verändern.", es: "¡Fascinante! Creo que la educación cambiará significativamente." },
      { teacher: "Tolle Diskussion! Machen wir ein andermal weiter. Auf Wiedersehen!", es: "¡Gran discusión! Continuemos otro día. ¡Adiós!" }
    ],
    c1: [
      { teacher: "Grüße! Lassen Sie uns Globalisierung erkunden. Was ist Ihre Ansicht?", es: "¡Saludos! Exploremos la globalización. ¿Cuál es su opinión?" },
      { teacher: "Ein überzeugendes Argument! Wie beeinflusst Globalisierung lokale Kulturen?", es: "¡Un argumento convincente! ¿Cómo afecta la globalización a las culturas locales?" },
      { teacher: "Eine differenzierte Perspektive. Es gibt positive und negative Aspekte.", es: "Una perspectiva matizada. Hay aspectos positivos y negativos." },
      { teacher: "Genau! Welche Maßnahmen könnten negative Effekte mindern?", es: "¡Precisamente! ¿Qué medidas podrían mitigar los efectos negativos?" },
      { teacher: "Ein ausgezeichneter Vorschlag! Das erfordert internationale Zusammenarbeit.", es: "¡Una excelente sugerencia! Esto requiere cooperación internacional." },
      { teacher: "Es war ein anregendes Gespräch. Ich freue mich auf unser nächstes.", es: "Ha sido una conversación estimulante. Espero la próxima." }
    ]
  },
  fr: {
    a1: [
      { teacher: "Bonjour! Comment allez-vous aujourd'hui?", es: "¡Hola! ¿Cómo está usted hoy?" },
      { teacher: "Je m'appelle [teacher]. Comment vous appelez-vous?", es: "Me llamo [teacher]. ¿Cómo se llama usted?" },
      { teacher: "Enchanté, [student]! D'où venez-vous?", es: "¡Mucho gusto, [student]! ¿De dónde viene?" },
      { teacher: "Merveilleux! Aimez-vous apprendre le français?", es: "¡Maravilloso! ¿Le gusta aprender francés?" },
      { teacher: "Très bien! Quelle couleur aimez-vous?", es: "¡Muy bien! ¿Qué color le gusta?" },
      { teacher: "Excellent! Pouvez-vous dire 'merci'?", es: "¡Excelente! ¿Puede decir 'gracias'?" },
      { teacher: "Parfait! Vous faites de très bons progrès. Au revoir!", es: "¡Perfecto! Está haciendo muy buenos progresos. ¡Hasta luego!" }
    ],
    a2: [
      { teacher: "Bonjour! Comment puis-je vous aider?", es: "¡Buenos días! ¿Cómo puedo ayudarle?" },
      { teacher: "Je voudrais aller au supermarché. Où est-il?", es: "Quisiera ir al supermercado. ¿Dónde está?" },
      { teacher: "Merci! Qu'avez-vous besoin d'acheter?", es: "¡Gracias! ¿Qué necesita comprar?" },
      { teacher: "Bon choix! Combien coûte le pain?", es: "¡Buena elección! ¿Cuánto cuesta el pan?" },
      { teacher: "C'est bon marché! Avez-vous de l'argent?", es: "¡Es barato! ¿Tiene dinero?" },
      { teacher: "Parfait! Payons et rentrons à la maison. Bien joué!", es: "¡Perfecto! Paguemos y volvamos a casa. ¡Bien hecho!" }
    ],
    b1: [
      { teacher: "Salut! Qu'avez-vous fait le week-end dernier?", es: "¡Hola! ¿Qué hizo el fin de semana pasado?" },
      { teacher: "Ça a l'air intéressant! Aimez-vous les activités de plein air?", es: "¡Suena interesante! ¿Disfruta actividades al aire libre?" },
      { teacher: "Je vois! Quel est votre passe-temps favori?", es: "¡Entiendo! ¿Cuál es su pasatiempo favorito?" },
      { teacher: "Un super passe-temps! Depuis combien de temps le faites-vous?", es: "¡Un gran pasatiempo! ¿Cuánto tiempo lleva haciéndolo?" },
      { teacher: "Incroyable! Les passe-temps sont importants pour notre bien-être.", es: "¡Increíble! Los pasatiempos son importantes para nuestro bienestar." },
      { teacher: "Je suis d'accord! Rencontrons-nous encore. Prenez soin de vous!", es: "¡Estoy de acuerdo! Encontrémonos de nuevo. ¡Cuídese!" }
    ],
    b2: [
      { teacher: "Bonjour! Parlons technologie. Que pensez-vous de l'IA?", es: "¡Buen día! Hablemos de tecnología. ¿Qué piensa sobre la IA?" },
      { teacher: "Un point de vue intéressant! L'IA remplacera-t-elle des emplois?", es: "¡Un punto de vista interesante! ¿La IA reemplazará empleos?" },
      { teacher: "Je comprends votre point. Mais l'IA crée aussi des opportunités.", es: "Entiendo su punto. Pero la IA también crea oportunidades." },
      { teacher: "Exactement! Quel domaine bénéficiera le plus de l'IA?", es: "¡Exactamente! ¿Qué área se beneficiará más de la IA?" },
      { teacher: "Passionnant! Je pense que l'éducation se transformera.", es: "¡Fascinante! Creo que la educación se transformará." },
      { teacher: "Belle discussion! Continuons un autre jour. Au revoir!", es: "¡Gran discusión! Continuemos otro día. ¡Adiós!" }
    ],
    c1: [
      { teacher: "Salutations! Explorons la mondialisation. Quelle est votre opinion?", es: "¡Saludos! Exploremos la globalización. ¿Cuál es su opinión?" },
      { teacher: "Un argument convaincant! Comment la mondialisation affecte-t-elle les cultures?", es: "¡Un argumento convincente! ¿Cómo afecta la globalización a las culturas?" },
      { teacher: "Une perspective nuancée. Il y a des aspects positifs et négatifs.", es: "Una perspectiva matizada. Hay aspectos positivos y negativos." },
      { teacher: "Précisément! Quelles mesures pourraient atténuer les effets négatifs?", es: "¡Precisamente! ¿Qué medidas podrían mitigar los efectos negativos?" },
      { teacher: "Une excellente suggestion! Cela nécessite une coopération internationale.", es: "¡Una excelente sugerencia! Esto requiere cooperación internacional." },
      { teacher: "Ce fut une conversation stimulante. J'attends notre prochaine discussion.", es: "Ha sido una conversación estimulante. Espero la próxima discusión." }
    ]
  },
  es: {
    a1: [
      { teacher: "¡Hola! ¿Cómo estás hoy?", es: "Hello! How are you today?" },
      { teacher: "Me llamo [teacher]. ¿Cómo te llamas?", es: "My name is [teacher]. What's your name?" },
      { teacher: "¡Mucho gusto, [student]! ¿De dónde eres?", es: "Nice to meet you, [student]! Where are you from?" },
      { teacher: "¡Maravilloso! ¿Te gusta aprender español?", es: "Wonderful! Do you like learning Spanish?" },
      { teacher: "¡Qué bien! ¿Qué color te gusta?", es: "That's great! What color do you like?" },
      { teacher: "¡Excelente! Practiquemos más. ¿Puedes decir 'gracias'?", es: "Excellent! Let's practice more. Can you say 'thank you'?" },
      { teacher: "¡Perfecto! Lo estás haciendo muy bien. ¡Hasta luego!", es: "Perfect! You're doing very well. Goodbye for now!" }
    ],
    a2: [
      { teacher: "¡Buenos días! ¿Cómo puedo ayudarte hoy?", es: "Good morning! How can I help you today?" },
      { teacher: "Me gustaría ir al supermercado. ¿Dónde está?", es: "I'd like to go to the supermarket. Where is it?" },
      { teacher: "¡Gracias! ¿Qué necesitas comprar?", es: "Thank you! What do you need to buy?" },
      { teacher: "¡Buenas elecciones! ¿Cuánto cuesta el pan?", es: "Good choices! How much does bread cost?" },
      { teacher: "¡Es barato! ¿Tienes dinero?", es: "That's cheap! Do you have any money?" },
      { teacher: "¡Perfecto! Paguemos y vayamos a casa. ¡Bien hecho!", es: "Perfect! Let's pay and go home. Well done!" }
    ],
    b1: [
      { teacher: "¡Hola! ¿Qué hiciste el fin de semana pasado?", es: "Hi there! What did you do last weekend?" },
      { teacher: "¡Suena interesante! ¿Disfrutas las actividades al aire libre?", es: "That sounds interesting! Do you enjoy outdoor activities?" },
      { teacher: "¡Entiendo! ¿Cuál es tu pasatiempo favorito?", es: "I see! What's your favorite hobby?" },
      { teacher: "¡Es un gran pasatiempo! ¿Cuánto tiempo llevas haciéndolo?", es: "That's a great hobby! How long have you been doing it?" },
      { teacher: "¡Increíble! Creo que los pasatiempos son importantes para nuestro bienestar.", es: "Amazing! I think hobbies are important for our well-being." },
      { teacher: "¡Estoy de acuerdo! Encontrémonos de nuevo y hablemos más. ¡Cuídate!", es: "I agree! Let's meet again and talk more. Take care!" }
    ],
    b2: [
      { teacher: "¡Buen día! Me gustaría discutir sobre tecnología. ¿Qué piensas sobre la IA?", es: "Good day! I'd like to discuss technology. What do you think about AI?" },
      { teacher: "¡Es una perspectiva interesante! ¿Crees que la IA reemplazará empleos?", es: "That's an interesting perspective! Do you think AI will replace jobs?" },
      { teacher: "Entiendo tu punto. Sin embargo, la IA también crea nuevas oportunidades.", es: "I understand your point. However, AI also creates new opportunities." },
      { teacher: "¡Exactamente! ¿Qué campo crees que se beneficiará más de la IA?", es: "Exactly! What field do you think will benefit most from AI?" },
      { teacher: "¡Fascinante! Creo que la educación se transformará significativamente.", es: "Fascinating! I think education will transform significantly." },
      { teacher: "¡Gran discusión! Continuemos otro día. ¡Adiós!", es: "Great discussion! Let's continue another day. Goodbye!" }
    ],
    c1: [
      { teacher: "¡Saludos! Me gustaría explorar el concepto de globalización. ¿Cuál es tu opinión?", es: "Greetings! I'd like to explore the concept of globalization. What's your view?" },
      { teacher: "¡Un argumento convincente! ¿Cómo crees que la globalización afecta las culturas locales?", es: "A compelling argument! How do you think globalization affects local cultures?" },
      { teacher: "Esa es una perspectiva matizada. De hecho, hay aspectos tanto positivos como negativos.", es: "That's a nuanced perspective. There are indeed both positive and negative aspects." },
      { teacher: "¡Precisamente! ¿Qué medidas podrían mitigar los efectos negativos?", es: "Precisely! What measures could mitigate the negative effects?" },
      { teacher: "¡Una excelente sugerencia! Esto requiere cooperación internacional.", es: "An excellent suggestion! This requires international cooperation." },
      { teacher: "Ha sido una conversación estimulante. Espero con interés nuestra próxima discusión.", es: "It's been a stimulating conversation. I look forward to our next discussion." }
    ]
  }
};

const CHAT_FEEDBACK = {
  positive: [
    "¡Excelente respuesta!",
    "¡Muy bien!",
    "¡Perfecto!",
    "¡Buen trabajo!",
    "¡Sigue así!",
    "¡Impresionante!",
    "¡Bien hecho!"
  ],
  neutral: [
    "Interesante respuesta.",
    "Gracias por compartir.",
    "Entiendo.",
    "¡Qué bien!",
    "Muy interesante."
  ],
  encouraging: [
    "¡Sigue practicando!",
    "Cada día mejoras más.",
    "Estás progresando muy bien.",
    "¡No te rindas!",
    "La práctica hace al maestro."
  ]
};

/* ---- Chat Functions ---- */
let chatConversation = [];
let chatStep = 0;
let chatActive = false;
let aiChatMode = false;
let aiChatHistory = [];
let aiServerOnline = false;

async function checkAIServer() {
  try {
    const res = await fetch('http://localhost:3000/api/status');
    const data = await res.json();
    aiServerOnline = data.online;
    return data;
  } catch { aiServerOnline = false; return { online: false }; }
}

function setAIModeIndicator() {
  const status = $('chat-ai-status');
  const aiBtn = $('chat-ai-btn');
  if (aiServerOnline) {
    aiBtn.style.display = 'inline-block';
    aiBtn.textContent = aiChatMode ? '🤖 IA: ON' : '🤖 IA';
    aiBtn.className = 'btn-secondary' + (aiChatMode ? ' btn-ai-on' : ' btn-ai');
    status.innerHTML = aiChatMode ? '<span class="ai-dot on"></span> IA conectada' : '';
  } else {
    aiBtn.style.display = 'none';
    status.innerHTML = '';
  }
}

function openChat() {
  const lang = APP.state.selectedLang;
  const level = APP.state.selectedLevel;
  if (!lang || !level) return showToast('Selecciona un idioma y nivel primero');
  if (!CONVERSATIONS[lang] || !CONVERSATIONS[lang][level]) return showToast('No hay conversaciones para este nivel');
  chatConversation = CONVERSATIONS[lang][level];
  chatStep = 0;
  chatActive = false;
  aiChatMode = false;
  aiChatHistory = [];
  $('chat-overlay').classList.add('active');
  $('chat-messages').innerHTML = '<div class="chat-welcome"><p>Presiona "Iniciar conversación" para empezar</p></div>';
  $('chat-start-btn').style.display = 'block';
  $('chat-repeat-btn').style.display = 'none';
  $('chat-translate-btn').style.display = 'none';
  $('chat-input').disabled = true;
  $('chat-send-btn').disabled = true;
  $('chat-teacher-name').textContent = APP.state.teacherName;
  $('chat-teacher-name').textContent = APP.state.teacherName;
  updateChatAvatar();
  checkAIServer().then(setAIModeIndicator);
}

function updateChatAvatar() {
  const container = $('chat-teacher-avatar');
  if (APP.state.teacherPhoto) {
    container.innerHTML = `<img src="${APP.state.teacherPhoto}" alt="Profesor">`;
  } else {
    container.innerHTML = '<svg viewBox="0 0 40 40" fill="none"><circle cx="20" cy="14" r="6" fill="currentColor" opacity="0.6"/><path d="M6 34c0-7.732 6.268-14 14-14s14 6.268 14 14" stroke="currentColor" stroke-width="2" fill="none" opacity="0.6"/></svg>';
  }
}

function startConversation() {
  chatActive = true;
  chatStep = 0;
  $('chat-messages').innerHTML = '';
  $('chat-start-btn').style.display = 'none';
  $('chat-repeat-btn').style.display = 'inline-block';
  $('chat-translate-btn').style.display = 'inline-block';
  $('chat-input').disabled = false;
  $('chat-send-btn').disabled = false;
  showTypingIndicator();
  setTimeout(() => {
    hideTypingIndicator();
    teacherSpeak(0);
  }, 1500);
}

function teacherSpeak(step) {
  if (!chatActive) return;
  if (step >= chatConversation.length) {
    endConversation();
    return;
  }
  chatStep = step;
  const msg = chatConversation[step];
  let text = msg.teacher.replace('[teacher]', APP.state.teacherName);
  const studentName = APP.state.teacherName === 'Profesor Alex' ? 'Student' : APP.state.teacherName;
  text = text.replace('[student]', studentName);

  addMessage(text, msg.es, 'teacher');
  const langCode = { en: 'en', de: 'de', fr: 'fr', es: 'es' }[APP.state.selectedLang];
  if (msg.es && APP.state.selectedLang !== 'es') {
    speakWithTranslation(text, langCode, msg.es, 'es');
  } else {
    speak(text, langCode);
  }
}

function speakWithTranslation(text, lang1, text2, lang2) {
  if (!window.speechSynthesis) return;
  const avatar = $('teacher-showcase-avatar');
  const u1 = new SpeechSynthesisUtterance(text);
  u1.lang = lang1; u1.rate = 0.85; u1.pitch = 1; u1.volume = 1;
  u1.onstart = () => { if (avatar) avatar.classList.add('speaking'); };
  const u2 = new SpeechSynthesisUtterance(text2);
  u2.lang = lang2; u2.rate = 0.8; u2.pitch = 0.9; u2.volume = 1;
  u2.onend = () => { if (avatar) avatar.classList.remove('speaking'); };
  u1.onend = () => setTimeout(() => window.speechSynthesis.speak(u2), 400);
  window.speechSynthesis.speak(u1);
}

function endConversation() {
  chatActive = false;
  $('chat-input').disabled = true;
  $('chat-send-btn').disabled = true;
  $('chat-start-btn').textContent = '🔄 Nueva conversación';
  $('chat-start-btn').style.display = 'block';
  showToast('Conversación completada');
}

function addMessage(text, translation, sender, correction) {
  const container = $('chat-messages');
  const teacherDefault = '<svg viewBox="0 0 40 40" fill="none"><circle cx="20" cy="14" r="6" fill="currentColor" opacity="0.6"/><path d="M6 34c0-7.732 6.268-14 14-14s14 6.268 14 14" stroke="currentColor" stroke-width="2" fill="none" opacity="0.6"/></svg>';

  const avatarHtml = sender === 'teacher'
    ? (APP.state.teacherPhoto ? `<img src="${APP.state.teacherPhoto}" alt="P">` : teacherDefault)
    : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/></svg>';

  const time = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  const correctionHtml = correction ? `<div class="msg-correction">✅ ${correction}</div>` : '';

  const div = document.createElement('div');
  div.className = `msg ${sender}`;
  div.innerHTML = `
    <div class="msg-avatar">${avatarHtml}</div>
    <div class="msg-bubble">
      <div class="msg-text">${text}</div>
      ${translation ? `<div class="msg-translation">${translation}</div>` : ''}
      ${translation && sender === 'teacher' ? `<button class="msg-es-btn" data-es="${translation.replace(/"/g, '&quot;')}">🔊 Español</button>` : ''}
      ${correctionHtml}
      <div class="msg-time">${time}</div>
    </div>
  `;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function showTypingIndicator() {
  const container = $('chat-messages');
  let typing = container.querySelector('.chat-typing');
  if (!typing) {
    typing = document.createElement('div');
    typing.className = 'chat-typing visible';
    typing.innerHTML = '<span></span><span></span><span></span>';
    container.appendChild(typing);
  } else {
    typing.classList.add('visible');
  }
  container.scrollTop = container.scrollHeight;
}

function hideTypingIndicator() {
  const typing = document.querySelector('.chat-typing');
  if (typing) typing.classList.remove('visible');
}

const TEACHER_RESPONSES = {
  thanks: [
    '¡De nada! Sigue practicando.',
    '¡Por nada! Estás progresando muy bien.',
    '¡Con gusto! Así se aprende.'
  ],
  help: [
    'Claro, te explico. Presta atención a la pronunciación.',
    'Por supuesto. Escucha con cuidado cómo se dice.',
    'Te ayudo. Repite después de mí.'
  ],
  question: [
    '¡Buena pregunta! Vamos a practicarlo.',
    'Excelente pregunta. Así es como se dice.',
    'Me alegra que preguntes. Presta atención.'
  ],
  generic: [
    '¡Muy bien! Sigue así.',
    'Excelente respuesta. Vas mejorando.',
    'Perfecto. Cada día lo haces mejor.',
    'Bien hecho. Continúa practicando.',
    'Así se hace. Estoy orgulloso de tu progreso.'
  ]
};

function detectIntent(text) {
  const t = text.toLowerCase();
  if (/gracias|thanks|thank you|merci|danke/i.test(t)) return 'thanks';
  if (/no entiendo|no comprendo|expl[íi]came|c[óo]mo se dice|help|qu[eé] significa|no s[eé]/i.test(t)) return 'help';
  if (/c[oó]mo|qu[eé] es|por qu[eé]|cu[áa]ndo|d[oó]nde|qui[eé]n/i.test(t)) return 'question';
  return 'generic';
}

function toggleAIChat() {
  if (!aiServerOnline) return showToast('Ollama no está disponible');
  aiChatMode = !aiChatMode;
  if (aiChatMode) {
    aiChatHistory = [];
    $('chat-messages').innerHTML = '<div class="chat-welcome"><p>🤖 Modo IA activado. Escribe lo que quieras, el profesor responde como humano.</p></div>';
    $('chat-start-btn').style.display = 'none';
    $('chat-repeat-btn').style.display = 'none';
    $('chat-translate-btn').style.display = 'none';
    $('chat-input').disabled = false;
    $('chat-send-btn').disabled = false;
    $('chat-input').focus();
    chatActive = true;
  } else {
    $('chat-messages').innerHTML = '<div class="chat-welcome"><p>Presiona "Iniciar conversación" para empezar</p></div>';
    $('chat-start-btn').style.display = 'block';
    $('chat-repeat-btn').style.display = 'none';
    $('chat-translate-btn').style.display = 'none';
    $('chat-input').disabled = true;
    $('chat-send-btn').disabled = true;
    aiChatHistory = [];
    chatActive = false;
  }
  setAIModeIndicator();
}

async function sendMessage() {
  const input = $('chat-input');
  const text = input.value.trim();
  if (!text || !chatActive) return;
  input.value = '';
  input.disabled = true;
  $('chat-send-btn').disabled = true;

  addMessage(text, null, 'student');
  showTypingIndicator();

  if (aiChatMode) {
    aiChatHistory.push({ role: 'user', content: text });
    try {
      const res = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: aiChatHistory.slice(-10),
          lang: APP.state.selectedLang,
          level: APP.state.selectedLevel,
          teacherName: APP.state.teacherName
        })
      });
      const data = await res.json();
      hideTypingIndicator();
      if (data.reply) {
        addMessage(data.reply, null, 'teacher');
        aiChatHistory.push({ role: 'assistant', content: data.reply });
        const lines = data.reply.split('\n').filter(l => l.trim());
        const speakText = lines[0] || data.reply;
        const langCode = { en: 'en', de: 'de', fr: 'fr', es: 'es' }[APP.state.selectedLang];
        speak(speakText, langCode);
      }
    } catch {
      hideTypingIndicator();
      addMessage('⚠️ Error conectando con Ollama. ¿Está corriendo el servidor local?', null, 'teacher');
    }
    input.disabled = false;
    $('chat-send-btn').disabled = false;
    input.focus();
    return;
  }

  const lang = APP.state.selectedLang;

  const translated = await googleTranslate(text, 'es', lang);
  const intent = detectIntent(text);
  const spanishReply = TEACHER_RESPONSES[intent][Math.floor(Math.random() * TEACHER_RESPONSES[intent].length)];

  setTimeout(async () => {
    hideTypingIndicator();
    if (translated && translated.toLowerCase() !== text.toLowerCase() && lang !== 'es') {
      addMessage(`"${translated}"`, null, 'teacher');
    }
    addMessage(spanishReply, null, 'teacher');
    speak(spanishReply, 'es');

    setTimeout(() => {
      input.disabled = false;
      $('chat-send-btn').disabled = false;
      input.focus();

      setTimeout(() => {
        teacherSpeak(chatStep + 1);
      }, 2000);
    }, 1500);
  }, 1000);
}

/* ---- Chat Event Listeners ---- */
$('chat-btn').addEventListener('click', openChat);
$('chat-start-btn').addEventListener('click', startConversation);
$('chat-send-btn').addEventListener('click', sendMessage);
$('chat-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') sendMessage(); });
$('chat-close-btn').addEventListener('click', () => $('chat-overlay').classList.remove('active'));
$('chat-ai-btn').addEventListener('click', toggleAIChat);
$('chat-repeat-btn').addEventListener('click', () => {
  if (chatConversation[chatStep]) {
    const msg = chatConversation[chatStep];
    speak(msg.teacher, { en: 'en', de: 'de', fr: 'fr', es: 'es' }[APP.state.selectedLang]);
  }
});
$('chat-translate-btn').addEventListener('click', () => {
  if (chatStep > 0 && chatConversation[chatStep - 1]) {
    showToast(chatConversation[chatStep - 1].es);
  }
});
$('chat-overlay').addEventListener('click', (e) => {
  if (e.target === $('chat-overlay')) $('chat-overlay').classList.remove('active');
});
$('chat-messages').addEventListener('click', (e) => {
  const btn = e.target.closest('.msg-es-btn');
  if (btn) speak(btn.dataset.es, 'es');
});

/* ---- Google Translate ---- */
async function googleTranslate(text, from, to) {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    const data = await res.json();
    return data[0].map(x => x[0]).join('');
  } catch (e) {
    console.warn('Translate error:', e);
    return null;
  }
}

/* ---- Generate Lesson ---- */
async function generateLesson() {
  const lang = APP.state.selectedLang;
  const level = APP.state.selectedLevel;
  if (!lang || !level) return;

  const words = LESSON_DATA[lang][level];
  const examples = EXAMPLES[lang][level];
  const langNames = { en: 'Inglés', de: 'Alemán', fr: 'Francés', es: 'Español' };
  const emojis = { en: '🇬🇧', de: '🇩🇪', fr: '🇫🇷', es: '🇪🇸' };

  $('lesson-title').innerHTML = `${emojis[lang]} ${langNames[lang]} — Nivel ${level.toUpperCase()}`;

  const container = $('lesson-content');
  container.innerHTML = '<div class="loading">Cargando lección...</div>';

  const translations = [];
  for (let i = 0; i < words.length; i++) {
    let translated, exampleTranslated;
    if (lang === 'es') {
      translated = words[i];
      exampleTranslated = examples[i];
    } else {
      translated = await googleTranslate(words[i], lang, 'es');
      exampleTranslated = await googleTranslate(examples[i], lang, 'es');
    }
    translations.push({ word: words[i], translation: translated || '...', example: examples[i], exampleTrans: exampleTranslated || '...' });
  }

  const langCodes = { en: 'en', de: 'de', fr: 'fr', es: 'es' };
  const langCode = langCodes[lang];

  container.innerHTML = translations.map((t, i) => `
    <div class="word-card">
      <div class="original">${t.word}</div>
      <div class="translation">→ ${t.translation}</div>
      <div class="example">💬 ${t.example}</div>
      <div class="translation" style="font-size:13px;color:var(--text-muted)">→ ${t.exampleTrans}</div>
      <button class="audio-btn" data-text="${t.word}" data-lang="${langCode}">🔊 Escuchar</button>
    </div>
  `).join('');

  container.querySelectorAll('.audio-btn').forEach(btn => {
    btn.addEventListener('click', () => speak(btn.dataset.text, btn.dataset.lang));
  });

  APP.state.currentLessonWords = translations.map(t => t.word);
  APP.state.currentLessonTranslations = translations.map(t => t.translation);
  APP.state.oralWords = translations;

  APP.state.stats.lessons++;
  APP.state.stats.words += words.length;
  updateStats();

  APP.state.history.push({
    lang: langNames[lang], level: level.toUpperCase(), words: words.length,
    date: new Date().toLocaleDateString('es-ES')
  });
  renderHistory();

  showToast(`Lección de ${langNames[lang]} nivel ${level.toUpperCase()} lista`);
}

/* ---- Speech ---- */
function speak(text, lang = 'en') {
  if (!window.speechSynthesis) return showToast('Texto a voz no disponible');
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.85;
  utterance.pitch = 1;
  utterance.volume = 1;
  const avatar = $('teacher-showcase-avatar');
  utterance.onstart = () => { if (avatar) avatar.classList.add('speaking'); };
  utterance.onend = () => { if (avatar) avatar.classList.remove('speaking'); };
  window.speechSynthesis.speak(utterance);
}

/* ---- Stats ---- */
function updateStats() {
  $('stat-lessons').textContent = APP.state.stats.lessons;
  $('stat-words').textContent = APP.state.stats.words;
  $('stat-streak').textContent = APP.state.stats.streak;
  updateProgress();
}

function updateProgress() {
  const counts = { en: 0, de: 0, fr: 0, es: 0 };
  APP.state.history.forEach(h => {
    if (h.lang === 'Inglés') counts.en += h.words;
    if (h.lang === 'Alemán') counts.de += h.words;
    if (h.lang === 'Francés') counts.fr += h.words;
    if (h.lang === 'Español') counts.es += h.words;
  });
  Object.keys(counts).forEach(k => {
    const pct = Math.min(100, (counts[k] / 50) * 100);
    document.querySelector(`#progress-${k} .progress-bar`).style.width = pct + '%';
  });
}

/* ---- History ---- */
function renderHistory() {
  const container = $('lessons-history');
  if (APP.state.history.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>Aún no hay lecciones completadas</p></div>';
    return;
  }
  container.innerHTML = [...APP.state.history].reverse().map(h => `
    <div class="lesson-history-item">
      <div>
        <div class="lang">${h.lang}</div>
        <div class="level">${h.level}</div>
      </div>
      <div>
        <div>${h.words} palabras</div>
        <div class="date">${h.date}</div>
      </div>
    </div>
  `).join('');
}

/* ---- Teacher Avatar ---- */
function updateTeacherAvatars() {
  const elements = [$('teacher-avatar-sm'), $('profile-avatar'), $('chat-teacher-avatar'), $('teacher-showcase-avatar')];
  elements.forEach(el => {
    if (!el) return;
    if (APP.state.teacherPhoto) {
      el.innerHTML = `<img src="${APP.state.teacherPhoto}" alt="Profesor">`;
    } else {
      el.style.background = 'var(--accent-gradient)';
      el.innerHTML = el.id === 'chat-teacher-avatar' || el.id === 'teacher-showcase-avatar'
        ? '<svg viewBox="0 0 40 40" fill="none"><circle cx="20" cy="14" r="6" fill="currentColor" opacity="0.6"/><path d="M6 34c0-7.732 6.268-14 14-14s14 6.268 14 14" stroke="currentColor" stroke-width="2" fill="none" opacity="0.6"/></svg>'
        : '';
      if (el.id !== 'chat-teacher-avatar' && el.id !== 'teacher-showcase-avatar') el.style.background = 'var(--accent-gradient)';
    }
  });
}

/* ---- Exam (Written) ---- */
function openExam() {
  if (APP.state.currentLessonWords.length === 0) return showToast('Primero genera una lección');
  APP.state.examIndex = 0;
  APP.state.examScore = 0;
  APP.state.examTotal = APP.state.currentLessonWords.length;
  const examBody = document.querySelector('.exam-body');
  const examResult = document.querySelector('.exam-result');
  examResult.style.display = 'none';
  examBody.style.display = 'block';
  $('exam-overlay').classList.add('active');
  showExamQuestion();
}

function showExamQuestion() {
  const i = APP.state.examIndex;
  const words = APP.state.currentLessonWords;
  const trans = APP.state.currentLessonTranslations;
  if (i >= words.length) return finishExam();

  $('exam-count').textContent = `${i + 1}/${words.length}`;
  $('exam-word').textContent = trans[i];
  $('exam-feedback').textContent = '';
  $('exam-feedback').className = 'exam-feedback';
  $('exam-input').value = '';
  $('exam-input').className = 'exam-input';
  $('exam-input').disabled = false;
  $('exam-input').focus();
  $('exam-submit-btn').style.display = 'inline-block';
  $('exam-next-btn').style.display = 'none';
  $('score-fill').style.width = `${(APP.state.examScore / words.length) * 100}%`;
  document.querySelector('.exam-result').style.display = 'none';
  const examBody = document.querySelector('.exam-body');
  if (examBody) examBody.style.display = 'block';
}

function checkExamAnswer() {
  const input = $('exam-input');
  const answer = input.value.trim().toLowerCase();
  if (!answer) return showToast('Escribe tu respuesta');
  const correct = APP.state.currentLessonWords[APP.state.examIndex].toLowerCase();
  const isCorrect = answer === correct || answer === correct.replace(/[.?!]/g, '').trim();

  input.disabled = true;
  input.className = isCorrect ? 'exam-input correct' : 'exam-input incorrect';

  const fb = $('exam-feedback');
  if (isCorrect) {
    APP.state.examScore++;
    fb.textContent = '✅ ¡Correcto!';
    fb.className = 'exam-feedback correct';
  } else {
    fb.innerHTML = `❌ Incorrecto. Respuesta: <span class="correct-answer">${APP.state.currentLessonWords[APP.state.examIndex]}</span>`;
    fb.className = 'exam-feedback incorrect';
  }

  $('score-fill').style.width = `${(APP.state.examScore / APP.state.examTotal) * 100}%`;
  $('exam-submit-btn').style.display = 'none';
  $('exam-next-btn').style.display = 'inline-block';
}

function nextExamQuestion() {
  APP.state.examIndex++;
  showExamQuestion();
}

function finishExam() {
  const total = APP.state.examTotal;
  const score = APP.state.examScore;
  const pct = Math.round((score / total) * 100);
  document.querySelector('.exam-body').style.display = 'none';
  const result = document.querySelector('.exam-result');
  result.style.display = 'block';

  let icon, text;
  if (pct === 100) { icon = '🏆'; text = '¡Perfecto! Dominas la lección'; }
  else if (pct >= 80) { icon = '🎉'; text = '¡Excelente! Muy buen trabajo'; }
  else if (pct >= 60) { icon = '👍'; text = 'Bien, sigue practicando'; }
  else if (pct >= 40) { icon = '💪'; text = 'Puedes mejorar, inténtalo de nuevo'; }
  else { icon = '📚'; text = 'Repasa la lección y vuelve a intentarlo'; }

  $('result-icon').textContent = icon;
  $('result-text').textContent = text;
  $('result-score').textContent = `${score}/${total} (${pct}%)`;
}

/* ---- Oral Practice ---- */
async function openOral() {
  if (APP.state.oralWords.length === 0) return showToast('Primero genera una lección');
  APP.state.oralIndex = 0;
  APP.state.oralRecordedBlob = null;
  APP.state.oralRecordedUrl = null;
  $('oral-overlay').classList.add('active');
  $('speed-controls').style.display = 'none';
  $('oral-tips').style.display = 'block';
  showOralWord();
}

function showOralWord() {
  const w = APP.state.oralWords[APP.state.oralIndex];
  if (!w) return;
  $('oral-phrase').textContent = w.word;
  $('oral-translation').textContent = `→ ${w.translation}`;
  $('oral-record-btn').querySelector('span').textContent = 'Grabar';
  $('oral-record-btn').classList.remove('recording');
  $('speed-controls').style.display = 'none';
  $('oral-tips').style.display = 'block';
  const dot = document.querySelector('.teacher-dot');
  dot.className = 'teacher-dot';
  drawWave(null);
}

function drawWave(data) {
  const canvas = $('wave-canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.clientWidth || 320;
  canvas.height = canvas.clientHeight || 80;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!data || data.length === 0) {
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const mid = canvas.height / 2;
    for (let x = 0; x < canvas.width; x++) {
      const y = mid + Math.sin(x * 0.05) * 8 + Math.sin(x * 0.02) * 4;
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
    return;
  }

  ctx.strokeStyle = '#667eea';
  ctx.lineWidth = 2;
  ctx.beginPath();
  const step = Math.floor(data.length / canvas.width) || 1;
  for (let x = 0; x < canvas.width; x++) {
    const idx = Math.min(Math.floor(x * data.length / canvas.width), data.length - 1);
    const y = (data[idx] + 1) / 2 * canvas.height * 0.8 + (canvas.height * 0.1);
    x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();
}

async function toggleRecording() {
  const btn = $('oral-record-btn');
  const dot = document.querySelector('.teacher-dot');

  if (APP.state.oralMediaRecorder && APP.state.oralMediaRecorder.state === 'recording') {
    APP.state.oralMediaRecorder.stop();
    if (APP.state.oralStream) {
      APP.state.oralStream.getTracks().forEach(t => t.stop());
      APP.state.oralStream = null;
    }
    btn.classList.remove('recording');
    btn.querySelector('span').textContent = 'Grabar';
    dot.className = 'teacher-dot';
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    APP.state.oralStream = stream;
    const chunks = [];
    const recorder = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4' });
    APP.state.oralMediaRecorder = recorder;

    recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: recorder.mimeType });
      APP.state.oralRecordedBlob = blob;
      APP.state.oralRecordedUrl = URL.createObjectURL(blob);
      btn.classList.remove('recording');
      btn.querySelector('span').textContent = 'Grabar';
      dot.className = 'teacher-dot';
      $('speed-controls').style.display = 'block';
      $('oral-tips').style.display = 'none';
      showToast('Grabación lista');
    };

    recorder.start();
    btn.classList.add('recording');
    btn.querySelector('span').textContent = 'Detener';
    dot.className = 'teacher-dot recording';

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const src = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    src.connect(analyser);
    const dataArr = new Uint8Array(analyser.frequencyBinCount);

    function updateWave() {
      if (recorder.state !== 'recording') return;
      analyser.getByteTimeDomainData(dataArr);
      drawWave(Array.from(dataArr).map(v => (v - 128) / 128));
      requestAnimationFrame(updateWave);
    }
    updateWave();
  } catch (e) {
    console.warn('Micro error:', e);
    showToast('Permite el acceso al micrófono');
  }
}

function playOral(speed = 1.0) {
  if (!APP.state.oralRecordedUrl) return showToast('Primero graba tu voz');
  const audio = new Audio(APP.state.oralRecordedUrl);
  audio.playbackRate = speed;
  const labels = { 1.0: 'Normal', 0.6: 'Lento', 0.3: 'Muy lento' };
  audio.play().then(() => showToast(`Reproduciendo: ${labels[speed] || speed}`)).catch(() => {});
}

function playTeacherWord() {
  const w = APP.state.oralWords[APP.state.oralIndex];
  if (!w) return;
  speak(w.word, { en: 'en', de: 'de', fr: 'fr', es: 'es' }[APP.state.selectedLang]);
}

/* ---- Exam & Oral event listeners ---- */
$('exam-btn').addEventListener('click', openExam);
$('oral-btn').addEventListener('click', openOral);
$('exam-submit-btn').addEventListener('click', checkExamAnswer);
$('exam-next-btn').addEventListener('click', nextExamQuestion);
$('exam-close-btn').addEventListener('click', () => $('exam-overlay').classList.remove('active'));
$('exam-retry-btn').addEventListener('click', () => { APP.state.examIndex = 0; APP.state.examScore = 0; showExamQuestion(); });
$('exam-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const submit = $('exam-submit-btn');
    const next = $('exam-next-btn');
    if (submit.style.display !== 'none') checkExamAnswer();
    else if (next.style.display !== 'none') nextExamQuestion();
  }
});
$('oral-record-btn').addEventListener('click', toggleRecording);
$('oral-play-btn').addEventListener('click', () => {
  const activeSpeed = document.querySelector('.speed-btn.active');
  playOral(parseFloat(activeSpeed.dataset.speed));
});
$('oral-teacher-btn').addEventListener('click', playTeacherWord);
$('oral-close-btn').addEventListener('click', () => {
  $('oral-overlay').classList.remove('active');
  if (APP.state.oralStream) {
    APP.state.oralStream.getTracks().forEach(t => t.stop());
    APP.state.oralStream = null;
  }
});
$('oral-prev-btn').addEventListener('click', () => {
  if (APP.state.oralIndex > 0) { APP.state.oralIndex--; showOralWord(); }
  else showToast('Primera frase');
});
$('oral-next-btn').addEventListener('click', () => {
  if (APP.state.oralIndex < APP.state.oralWords.length - 1) { APP.state.oralIndex++; showOralWord(); }
  else showToast('Última frase');
});
$('oral-overlay').addEventListener('click', (e) => {
  if (e.target === $('oral-overlay')) {
    if (APP.state.oralStream) { APP.state.oralStream.getTracks().forEach(t => t.stop()); APP.state.oralStream = null; }
    $('oral-overlay').classList.remove('active');
  }
});
$('exam-overlay').addEventListener('click', (e) => {
  if (e.target === $('exam-overlay')) $('exam-overlay').classList.remove('active');
});
document.querySelectorAll('.speed-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

/* ---- Translate Screen ---- */
$('translate-btn').addEventListener('click', async () => {
  const text = $('translate-input').value.trim();
  if (!text) return showToast('Escribe algo para traducir');
  const from = $('translate-from').value;
  const to = $('translate-to').value;
  const result = $('translate-result');
  result.textContent = 'Traduciendo...';
  result.classList.add('visible');
  const translated = await googleTranslate(text, from, to);
  if (translated) {
    result.textContent = translated;
  } else {
    result.textContent = 'Error al traducir. Intenta de nuevo.';
  }
});

$('swap-lang').addEventListener('click', () => {
  const from = $('translate-from');
  const to = $('translate-to');
  [from.value, to.value] = [to.value, from.value];
  $('translate-result').classList.remove('visible');
});

/* ---- Share ---- */
async function shareApp() {
  const shareData = {
    title: 'LinguaTutor AI',
    text: '🎓 Aprende inglés, alemán y francés con LinguaTutor AI — tu profesor inteligente. Niveles A1 a C1.',
    url: window.location.href
  };
  if (navigator.share) {
    try { await navigator.share(shareData); return; } catch (e) { if (e.name !== 'AbortError') console.warn(e); }
  }
  if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast('¡Enlace copiado al portapapeles! Comparte con tus amigos 📤');
    } catch { fallbackShare(); }
  } else { fallbackShare(); }
}

function fallbackShare() {
  const ta = document.createElement('textarea');
  ta.value = window.location.href;
  document.body.appendChild(ta); ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
  showToast('¡Enlace copiado! Comparte LinguaTutor AI 📤');
}

$('share-btn').addEventListener('click', shareApp);
$('share-header-btn').addEventListener('click', shareApp);

/* ---- Navigation Events ---- */
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => showScreen(item.dataset.screen));
});
document.querySelectorAll('.back-btn').forEach(btn => {
  btn.addEventListener('click', () => showScreen(btn.dataset.back));
});
$('profile-btn').addEventListener('click', () => {
  updateStats(); renderHistory(); showScreen('profile');
});
$('new-lesson-btn').addEventListener('click', generateLesson);
$('speak-btn').addEventListener('click', () => {
  const texts = document.querySelectorAll('.word-card .original');
  if (texts.length === 0) return showToast('No hay palabras para escuchar');
  texts.forEach((el, i) => {
    setTimeout(() => speak(el.textContent, { en: 'en', de: 'de', fr: 'fr', es: 'es' }[APP.state.selectedLang]), i * 1500);
  });
});
$('change-photo-btn').addEventListener('click', () => $('photo-input').click());

/* ---- Keyboard shortcuts ---- */
$('translate-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) $('translate-btn').click();
});

window.addEventListener('load', () => {
  updateStats();
  renderHistory();
  if ('speechSynthesis' in window) {
    speechSynthesis.getVoices();
  }
});
