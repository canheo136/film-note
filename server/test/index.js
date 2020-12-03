/**
 * Create testing data.
 * change dir to here and run `node index.js`
 */

const mockData = require('./MOCK_DATA.json');
const firestore = require('../cloud-firestore/firestore');
const { RemoveUnicode, ReplaceSpace, RemoveSpecialChars } = require('./../cloud-firestore/utils');

/**
 * @param {String} str 
 * @returns {String[]}
 */
function cleanAndSplitString(str = '') {
    str = str.toLowerCase();
    str = ReplaceSpace(str);
    str = RemoveSpecialChars(str);
    str = RemoveUnicode(str);
    return str.split(' ');
}

function createKeyWordsField() {
    return mockData.map(d => {
        // Create key words from content and title.
        // Split all content to array (1 word is element of array)
        let keyWords = d.Content.map(c => c.toLowerCase().split(' ')).flat(Infinity);
        // Merge title
        keyWords = keyWords.concat(cleanAndSplitString(d.Title));
        // Remove duplicate items
        d.KeyWords = keyWords.filter((v, i, s) => s.indexOf(v) === i || v.length === 0);
        return d;
    })
}

function createFirestoreData() {
    const data = createKeyWordsField();
    const ref = firestore.GetCollectionReference();

    data.forEach(d => { ref.add(d); })
}

createFirestoreData();
