/**
 * Make a request using fetch API
 * @param {Object} options 
 * @param {String} options.route
 * @param {Object} options.data data to send
 * @param {String} options.method http methods, default is `POST`
 * @param {Function} options.before callback before fetch
 * @param {Function} options.after callback after fecth
 * @returns {Promise<JSON>} res
 */
function sendRequest(options = {}) {
    const {
        route = null,
        data = {},
        method = 'POST',
        before = null,
        after = null
    } = options;

    const status = res => {
        if (res.status < 200 || res.status >= 300)
            return Promise.reject(res);

        return Promise.resolve(res);
    }

    if (typeof before === 'function') before();

    return fetch(host + route, {
        method: method,
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
            'secret-key': secretKey
        },
        body: data ? JSON.stringify(data) : ''
    })
        .then(status)
        .then(res => res.json())
        .then(data => {
            if (data.error) throw new Error(data.error);

            console.log({ res: data });
            return data;
        })
        .finally(() => {
            if (typeof after === 'function') after();
        })
}

/**
 * Fetch notes from server
 * @param {Object} options 
 * @param {String} options.id Note id
 * @param {String} options.path Note path
 * @param {Boolean} options.seen Note seen state
 * @param {String} options.title Note title
 * @param {Function} options.before callback before fetch
 * @param {Function} options.after callback after fecth
 * @returns {Promise<Note[]>} res
 */
function fetchNotes(options = {}) {
    const { id, path, seen, title,
        before, after } = options;

    return sendRequest({
        // Read with filter or read all notes
        route: (id || path || seen || title) ? '/r' : '/ra',
        data: {
            id: id,
            path: path,
            seen: seen,
            title: title
        },
        before: before,
        after: after
    })
}

/**
 * Where's my 'h'? WTH ???
 * @param {Object} options
 * @param {String} options.url
 * @param {Function} options.before callback before fetch
 * @param {Function} options.after callback after fecth
 * @returns {Promise<Object>} res
 */
function fetchOpenGrap(options = {}) {
    const { url, before, after } = options;
    if (typeof url != 'string' || url.length === 0)
        return Promise.reject('Invalid url');

    return sendRequest({
        route: '/preview',
        data: { url: url },
        before: before,
        after: after
    })
        .then(res => {
            if (!res.ogImage || !res.ogImage.url ||
                !res.requestUrl || !res.ogTitle ||
                !res.ogDescription || !res.ogSiteName)
                throw new Error('Invalid open graph');

            return res;
        })
}

function createNote(options = {}) {
    const { Title = '', Link = '', Content = [],
        before, after } = options;

    if (Title.length === 0 || Link.length === 0 ||   // Empty text
        Content.length === 0 ||                     // Or empty array
        Content.join('').length === 0)              // Or all items are empty text
        return Promise.reject('Missing data when create note');

    return sendRequest({
        route: '/c',
        data: { Link, Title, Content },
        before: before,
        after: after
    });
}

function deleteNote(options = {}) {
    const { path, before, after } = options;
    if (path.length <= 0)
        return Promise.reject('Invalid path');

    return sendRequest({
        route: '/d',
        data: { path },
        before: before,
        after: after
    });
}

/**
 * 
 * @param {Object} options 
 * @param {String} options.Path
 * @param {Object} options.data use properties of `Note` object as key
 * @param {Function} options.before
 * @param {Function} options.after
 */
function updateNote(options = {}) {
    const {
        path = '', data = null,
        before, after
    } = options;

    return sendRequest({
        route: '/u',
        data: { path, data },
        before: before,
        after: after
    })
}

/**
 * Replace unicode chars
 * @param {String} str
 * @returns {String}
 */
function removeUnicodeForCompare(str = '') {
    if (typeof str !== 'string' || str.length === 0) return '';
    // Remove a unicode char with double of matched one.
    // When compare, it still match operators `<` and `>`.
    // ex: à -> 'aa' => 'aa' > 'a'
    str = str.toLowerCase();
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'aa');
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'ee');
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'ii');
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'oo');
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'uu');
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'yy');
    str = str.replace(/đ/g, 'dd');
    return str;
}

/**
 * Remove html tags from input
 * @param {String} input
 * @returns {String} the cleaned string
 */
function cleanPastedHTML(input) {
    if (typeof input !== "string") return '';
    // 1. remove line breaks / Mso classes
    const stringStripper = /(\n|\r| class=(")?Mso[a-zA-Z]+(")?)/g;
    let output = input.replace(stringStripper, ' ');
    // 2. strip Word generated HTML comments
    const commentSripper = new RegExp('<!--(.*?)-->', 'g');
    output = output.replace(commentSripper, '');
    let tagStripper = new RegExp('<(/)*(meta|link|span|\\?xml:|st1:|o:|font)(.*?)>', 'gi');
    // 3. remove tags leave content if any
    output = output.replace(tagStripper, '');
    // 4. Remove everything in between and including tags '<style(.)style(.)>'
    const badTags = ['style', 'script', 'applet', 'embed', 'noframes', 'noscript'];

    for (let i = 0; i < badTags.length; i++) {
        tagStripper = new RegExp('<' + badTags[i] + '.*?' + badTags[i] + '(.*?)>', 'gi');
        output = output.replace(tagStripper, '');
    }
    // 5. remove attributes ' style="..."'
    const badAttributes = ['style', 'start'];
    for (let i = 0; i < badAttributes.length; i++) {
        let attributeStripper = new RegExp(' ' + badAttributes[i] + '="(.*?)"', 'gi');
        output = output.replace(attributeStripper, '');
    }
    return output;
}

/**
 * @param {Note} note1 
 * @param {Note} note2 
 * @param {Object} options 
 * @param {String} options.property prop of Note to compare
 * @param {String} options.type asc | desc
 * @returns {Function} The callback function for `Array.prototype.sort`
 */
function compareNote(note1, note2, options = {}) {
    /**
     * @returns {Number}
     * `-1 if note1 < note2`
     * `1 if note1 > note2`,
     * `0 if note1 equals note2` and reversed in `desc`
     */
    function compare(val1, val2, type = 'asc') {
        const isASC = type.toLowerCase().startsWith('asc');
        if (typeof val1 === 'string') {
            val1 = removeUnicodeForCompare(val1);
            val2 = removeUnicodeForCompare(val2);
        }

        if (val1 < val2) return isASC ? -1 : 1;
        if (val1 > val2) return isASC ? 1 : -1;
        return 0;
    };

    return compare(note1[options.property], note2[options.property], options.type);
}

function isURL(text = '') {
    text = text.trim().toLowerCase();

    return text.startsWith('http://') ||
        text.startsWith('https://');
}

function isInt(n) {
    return Number(n) === n && n % 1 === 0;
}

function isFloat(n) {
    return Number(n) === n && n % 1 !== 0;
}

function isFn(f) {
    return typeof f === 'function';
}

/**
 * Execute if `f` is a function
 * @param {*} f
 * @param {Object} context
 */
function execFn(f, context) {
    if (!isFn(f)) return;
    f.apply(context, [...arguments].slice(2));
}

/**
 * @param {Number} n
 * @returns {Number}
 */
function rounder(n) {
    if (typeof n !== 'number')
        throw new Error('Not a number');

    const downward = Math.round(n);
    return (n > downward + 0.5) ? ++n : downward;
}

function deepClone(data) {
    return JSON.parse(JSON.stringify(data));
}
