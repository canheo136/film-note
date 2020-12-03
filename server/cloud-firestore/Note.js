const { Timestamp } = require('firebase-admin').firestore;
const { KeyWordGenerator  } = require('./utils');

function convertTimestampToMillis(timestamp) {
    return new Timestamp(timestamp.seconds, timestamp.nanoseconds).toMillis();
}

class Note {
    constructor(title = '', content = [], link = '', color = 'default') {
        this.Title = title.trim();
        this.Link = link.trim();
        this.Seen = false;
        this.Color = color;
        if(typeof content === 'string') 
            this.Content = [content.trim()];
        else
            this.Content = content.map(c => c.trim());
        // Unmanage properties
        this.ID = null;
        this.Path = null;
        this.KeyWords = []; // Support search 'array-contains-any'
        this.CreateTime = null;
        this.UpdateTime = null;
    }

    toPlainObject() {
        /**
         * FireStorage required a plain object to create document.
         * Point to make a convenient to create Note object, some cheat here
         * @type {Note}
         */
        let cloneNote = JSON.parse(JSON.stringify(this));

        Object.keys(cloneNote).forEach(key => {
            if(cloneNote[key] == null)
                delete cloneNote[key];
        })

        cloneNote.KeyWords = KeyWordGenerator([...cloneNote.Content, cloneNote.Title]);
		return cloneNote;
    }

    /**
     * @param {FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>} doc 
     * @param {String} path
     * @returns {Note}
     */
    static Parse(doc = {}, path = '') {
        if(!doc.exists) return null;

        const obj = doc.data();
        let note = new Note(obj.Title, obj.Content, obj.Link, obj.Color);
        
        note.ID = doc.id;
        note.Path = path;
        note.Seen = obj.Seen;
        note.KeyWords = obj.KeyWords || note.Title.toLowerCase().split(' ');
        note.CreateTime = convertTimestampToMillis(doc.createTime);
        note.UpdateTime = convertTimestampToMillis(doc.updateTime);
        return note;
    } 
}

module.exports = Note;
