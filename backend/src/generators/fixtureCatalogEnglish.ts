import type { GeneratedStory } from "@story-teacher/shared";

function questions(input: { hero: string; object: string; action: string; reason: string; word: string; meaning: string; before: string; after: string }): GeneratedStory["questions"] {
  return [
    { statement: `What object did ${input.hero} find?`, options: [input.object, "A golden key", "An empty map", "A little bell"], correctAnswer: 0, skill: "literal", explanation: `The story directly says that ${input.hero} found ${input.object}.` },
    { statement: `What can we infer from ${input.hero}'s decision?`, options: ["The mission was forgotten", `The choice was to ${input.action}`, "The team wanted to leave", "Nobody stopped to think"], correctAnswer: 1, skill: "inference", explanation: `The actions show that the choice was to ${input.action}.` },
    { statement: `What does “${input.word}” mean in this story?`, options: ["Very noisy", "Far away", input.meaning, "Extremely heavy"], correctAnswer: 2, skill: "vocabulary", explanation: `In this context, “${input.word}” means ${input.meaning.toLowerCase()}.` },
    { statement: "What happened first?", options: [input.after, "The adventure ended", "Everyone celebrated", input.before], correctAnswer: 3, skill: "sequence", explanation: `${input.before} happened before ${input.after.toLowerCase()}.` },
    { statement: "Why was the problem solved?", options: ["Because night arrived", input.reason, "Because nobody acted", "Because the object vanished"], correctAnswer: 1, skill: "cause_effect", explanation: input.reason },
  ];
}

export const englishFixtureStories: Record<string, GeneratedStory> = {
  "space-signal": {
    title: "The Signal from the Blue Planet",
    story: "Luna was traveling in a small school spaceship when she found a glowing crystal beside a satellite. The crystal flashed in a careful rhythm. Luna wrote down every pulse and realized that it was a call for help. Instead of continuing alone, she shared the discovery with her crew. Together, they aimed the antennas and found an explorer robot trapped inside a cave. The route was fragile, so they moved carefully. By combining their ideas, they built a magnetic bridge and helped the robot return. Luna learned that a shared question can shine brighter than a rushed answer.",
    questions: questions({ hero: "Luna", object: "A glowing crystal", action: "share the discovery", reason: "The crew combined their ideas", word: "fragile", meaning: "Easy to break", before: "Luna recorded the flashes", after: "The crew built a bridge" }),
  },
  "fantasy-library": {
    title: "The Library That Changed Places",
    story: "Mara reached the castle of a thousand windows and found a silver book under a staircase. Every time she opened it, the library appeared in a different tower. The clue seemed confusing, but Mara noticed that the pictures pointed to the sun's position. She decided to wait and compare the shadows. When the light touched the round window, the book revealed the correct path. Mara called the other apprentices, and together they ordered the pages by time of day. They found the missing room and returned every book to its shelf. Patience turned a huge mystery into a series of small clues.",
    questions: questions({ hero: "Mara", object: "A silver book", action: "wait and compare the shadows", reason: "The apprentices ordered the pages by time", word: "confusing", meaning: "Difficult to understand", before: "Mara studied the pictures", after: "The apprentices ordered the pages" }),
  },
  "ocean-song": {
    title: "The Song Beneath the Reef",
    story: "Nico was exploring the reef in his submarine when he found a glowing shell. When he held it near his ear, he heard a slow melody. The notes matched the call of a whale that could not find its family. Nico recorded the sound, but he did not want to decide alone. He asked a biologist for help, and they compared the rhythms without disturbing the animals. Then they placed buoys that repeated the melody at a gentle volume. The whale followed the signals into open water and recognized its family's song. Nico learned that careful observation is also a way to help.",
    questions: questions({ hero: "Nico", object: "A glowing shell", action: "ask a biologist for help", reason: "They placed gentle sound signals", word: "gentle", meaning: "Soft and calm", before: "Nico recorded the sound", after: "They placed the buoys" }),
  },
  "jungle-seed": {
    title: "The Traveling Seed",
    story: "Tilo walked through the rainforest after the rain and found a violet seed. The soil near the river was damp, but the current could carry it away. Tilo asked a gardening turtle for help. Together, they chose a safe place, loosened the soil, and covered the seed with leaves. Days later, a sturdy sprout appeared. Its roots held the riverbank together and gave small insects a home. Tilo discovered that caring for something tiny can improve an entire place.",
    questions: questions({ hero: "Tilo", object: "A violet seed", action: "ask for help", reason: "They chose a safe place", word: "sturdy", meaning: "Strong and stable", before: "Tilo found the seed", after: "A sprout appeared" }),
  },
  "invention-clock": {
    title: "The Clock of Good Questions",
    story: "Ada was building a clock for the workshop when she found a transparent gear inside an old box. When she installed it, the clock did not show the time. Instead, it displayed a different question with every turn. Ada first thought it was broken, but she decided to record the messages. She discovered that each question helped her check one part of the invention. She invited her classmates to answer them. Together, they reduced the noise, organized the pieces, and improved the energy system. The clock worked because Ada turned an unexpected error into a chance to investigate.",
    questions: questions({ hero: "Ada", object: "A transparent gear", action: "record the messages", reason: "The team answered the questions together", word: "unexpected", meaning: "Not planned or predicted", before: "Ada installed the gear", after: "The team improved the energy system" }),
  },
  "music-bridge": {
    title: "The Bridge of Sounds",
    story: "Sol reached a quiet square and found a small blue drum. When Sol tapped it, one floor tile lit up. Soft sounds revealed that every rhythm brightened another part of the path. Sol invited other children to create a sequence. First they listened, then they played in turns, and finally a colorful bridge appeared. Everyone crossed without rushing. Sol understood that a song grows when each person leaves space to listen to others.",
    questions: questions({ hero: "Sol", object: "A small blue drum", action: "invite other children", reason: "Everyone respected the rhythm and turns", word: "sequence", meaning: "An ordered series", before: "Sol played the drum", after: "A colorful bridge appeared" }),
  },
};
