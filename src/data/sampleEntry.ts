import type { JournalEntry } from '../hooks/useJournal';

const sampleDate = (() => {
  const d = new Date();
  d.setDate(d.getDate() - 3);
  return d.toISOString().split('T')[0];
})();

const sampleIso = (() => {
  const d = new Date();
  d.setDate(d.getDate() - 3);
  return d.toISOString();
})();

export const sampleEntry: JournalEntry = {
  id: 'sample-doogie-001',
  date: sampleDate,
  content: [
    "Saved a man's life today.",
    "",
    "Routine appendectomy, but the chief resident said my technique was 'remarkably composed for a fourteen-year-old.' I wanted to tell him that composure is just adrenaline that hasn't found the door yet. I didn't.",
    "",
    "Vinnie is convinced this means I should ask Wanda out. He has a chart. An actual chart. Apparently the curve of 'life-saving events' is supposed to track with 'romantic confidence.' I have no idea what to say to her. I have a half-decent understanding of three medical textbooks and zero understanding of one Wanda Plenn.",
    "",
    "Mom asked how my day was. I told her: fine. What else do you say at fourteen, after holding a stranger's intestines.",
  ].join('\n'),
  createdAt: sampleIso,
  updatedAt: sampleIso,
};
