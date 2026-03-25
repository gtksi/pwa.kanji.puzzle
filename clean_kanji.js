const fs = require('fs');
const lists = JSON.parse(fs.readFileSync('kanji_lists.json', 'utf8'));

const clean = (str) => {
  // Remove Hiragana, Katakana, and common symbols/punctuation
  return str.replace(/[\u3040-\u309F\u30A0-\u30FF、。]/g, '');
};

const updated = {};
for (const grade in lists) {
  updated[grade] = clean(lists[grade]);
  console.log(`Grade ${grade}: ${updated[grade].length} characters`);
}

fs.writeFileSync('kanji_lists.json', JSON.stringify(updated, null, 2));
console.log('Cleaned kanji_lists.json');
