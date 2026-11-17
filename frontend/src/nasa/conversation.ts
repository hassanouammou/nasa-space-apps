export type CometLanguage = 'en' | 'fr';

const frenchWords = /\b(bonjour|bonsoir|salut|coucou|ca va|a bientot|merci|comment|combien|pourquoi|quelle?s?|qu['’]est-ce|est-ce|peux|peut-on|tu|vous|j['’]ai|je|oxygene|astronautes?|lune|jours?|tempete|abri|gravite|distance entre|echantillons?|legumes|au revoir)\b/;
const englishWords = /\b(hello|hi|hey|thanks|thank|please|what|how|why|when|which|where|the|you|i|oxygen|moon|days?|goodbye)\b/;
const greeting = /^(hello|hi|hey|good morning|good afternoon|good evening|bonjour|bonsoir|salut|coucou)(?:\s+comet)?\b[\s,!?.:;—-]*/;

export function cometMessage(input:string, previous:CometLanguage='en') {
  const normalized=input.trim().toLowerCase().normalize('NFD').replace(/\p{M}/gu,'').replace(/[’‘]/g,"'");
  const first=normalized.match(greeting);
  const language:CometLanguage=first
    ? /^(bonjour|bonsoir|salut|coucou)$/.test(first[1])?'fr':'en'
    : frenchWords.test(normalized)?'fr':englishWords.test(normalized)?'en':previous;
  const question=normalized.slice(first?.[0].length??0);
  const phrase=question.replace(/\bcomet\b/g,'').replace(/[^a-z' ]/g,' ').replace(/\s+/g,' ').trim();
  const pick=(en:string,fr:string)=>language==='fr'?fr:en;
  let reply:string|undefined;
  if(first&&!phrase)
    reply=pick('Hi! I’m Comet. What would you like to know about the Moon?', 'Bonjour ! Je suis Comet. Qu’aimerais-tu savoir sur la Lune ?');
  else if(/^(how are you(?: doing)?|how's it going|ca va(?: bien)?|comment ca va|comment vas tu|comment allez vous)$/.test(phrase))
    reply=pick('I’m doing well and ready to explore! Want to talk about the Moon or life on a space base?', 'Ça va bien, merci ! On parle de la Lune ou de la vie dans une base spatiale ?');
  else if(/^(thanks(?: a lot)?|thank you(?: so much)?|many thanks|merci(?: beaucoup| bien| pour ton aide)?)$/.test(phrase))
    reply=pick('You’re welcome! I’m here if you have another question.', 'Avec plaisir ! Je suis là si tu as une autre question.');
  else if(/^(bye(?: bye)?|goodbye|see you(?: later)?|au revoir|a bientot|a plus)$/.test(phrase))
    reply=pick('See you on the Moon!', 'À bientôt sur la Lune !');
  else if(/^(who are you|what(?:'s| is) your name|what can you do|help|qui es tu|qui est|comment t'appelles tu|quel est ton nom|que peux tu faire|aide(?: moi)?)$/.test(phrase))
    reply=pick('I’m Comet, your Moon base guide. Ask me about astronauts, space food, or Moon rocks. For science answers, I show you the NASA source.', 'Je suis Comet, ton guide de la base lunaire. Pose-moi une question sur les astronautes, les repas dans l’espace ou les roches de la Lune. Je te montre la source NASA de mes réponses scientifiques.');
  return {language,question,reply};
}
