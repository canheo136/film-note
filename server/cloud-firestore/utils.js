/**
 * Replace unicode chars by 
 * @param {String} str
 * @returns {String}
 */
function RemoveUnicode(str = '') {
    if(typeof str !== 'string' || str.length === 0) return '';
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
    str = str.replace(/đ/g, 'd');
    return str;
}

/**
 * Replace all space (tab, newline, ...) with single space
 * @param {String} str 
 * @returns {String}
 */
function ReplaceSpace(str = '') {
    if(typeof str !== 'string' || str.length === 0) return '';
    return str.replace(/\s\s+/g, ' ');
}

/**
 * Remove all characters which are not number (0-9), alphabet (a-z) or single space.
 * @param {String} str 
 * @returns {String}
 */
function RemoveSpecialChars(str = '') {
    return str.replace(/[^0-9a-zA-Z ]+/g, '');
}

function cleanAndSplitString(str = '') {
    // The order is important
    str = str.toLowerCase();
    str = ReplaceSpace(str);
    str = RemoveUnicode(str);
    str = RemoveSpecialChars(str);
    return str.split(' ');
}

/**
 * Create key words field for `Note`
 * @param {String[]} data 
 */
function KeyWordGenerator(data = []) {
    // Key words is the array of words which split from a sentence
    // After this, data can be 2-dimensions
    data = data.map(c => cleanAndSplitString(c));
    // Convert to single array
    data = data.flat(Infinity);
    // Remove duplicate
    data = data.filter((v, i, s) => s.indexOf(v) === i);
    // Remove empty
    return data.filter(v => v.length > 0);
}

module.exports.RemoveUnicode = RemoveUnicode;
module.exports.ReplaceSpace = ReplaceSpace;
module.exports.RemoveSpecialChars = RemoveSpecialChars;
module.exports.KeyWordGenerator = KeyWordGenerator;
