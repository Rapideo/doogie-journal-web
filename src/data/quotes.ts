// Quotes from Doogie Howser, M.D. journal entries (1989-1993)
// Sources: quotes.net, doogiehowser.fandom.com

export const DOOGIE_QUOTES = [
  "The more things change, the more they stay the same.",
  "Today I made my first real adult decision. I decided to stay a kid a little longer.",
  "There's nothing better than being cool and having a lot of friends... except being uncool and having one real friend.",
  "Fathers and sons... When we're little we want to be just like them. When we're teenagers we want nothing to do with them. When we're adults we end up just like them.",
  "Getting is good. Giving is better. Once you understand that, it's always Christmas.",
  "If you have to let go of a dream, it helps to have something else to hold on to... a friend.",
  "I've spent nineteen years learning how to be Doogie Howser, M.D. Now it's time to learn how to be just Doogie.",
  "I examined the facts to find the truth. But Vinnie showed me I had to look beyond the truth to find justice.",
  "Each time I took a second look, someone was given a second chance. Being wrong has never felt so right.",
  "The best rewards come when you risk the most. Sometimes the risk is its own reward.",
  "There's so much about life that I don't understand. Maybe I do retreat into medicine where I can feel superior.",
  "Kissed my first girl. Lost my first patient. Life will never be the same again.",
  "Tonight I did the unthinkable. I acted like an impulsive, crazy, adolescent, hormonal genius.",
  "This week Vinnie and I discovered there's something infinitely more satisfying than being thought of as a man -- acting like one.",
  "They say beauty is in the eye of the beholder. Maybe if we all spent a little less time beholding - we'd all be a lot happier.",
  "When I was a child, all my days were filled with endless wonder.",
  "It takes courage to live life fully.",
];

export function getRandomQuote(): string {
  return DOOGIE_QUOTES[Math.floor(Math.random() * DOOGIE_QUOTES.length)];
}
