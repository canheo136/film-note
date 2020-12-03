const admin = require('firebase-admin');
const { KeyWordGenerator } = require('./utils');
const key = require('./serviceAccountKey.json');
const Note = require('./Note');

admin.initializeApp({
	credential: admin.credential.cert(key)
});

const NotesPath = '/notes';
const BackupPath = '/backup';
const db = admin.firestore();

class FireStore {
	constructor(){}

	/**
	 * @param {Note} note 
	 * @returns {Promise<Note>}
	 */
	async Create(note = null) {
		if(note == null) throw new Error('Null arg');

		const snapshot = await db.collection(NotesPath).add(note.toPlainObject());
		return Note.Parse(await snapshot.get(), `${NotesPath}/${snapshot.id}`);
	}

	/**
	 * Priority: `id > path > seen > title`
	 * The filter with lower priority will be ignored
	 * @deprecated
	 * @param {Object} filters
	 * @returns {Promise<Array<Note>>}
	 */
	async Read(filters = {}) {
		const { id, path, seen, title } = filters;

		if(typeof id === 'string') {
			// Invalid id
			if(id.indexOf('/') != -1) return [];

			const doc = await db.doc(`${NotesPath}/${id}`).get();
			return doc.exists ? [Note.Parse(doc, `${NotesPath}/${doc.id}`)] : [];
		}

		if(typeof path === 'string') {
			// Invalid path
			if(!path.startsWith(NotesPath)) return [];
			// Depend on how firestore define 'path to doc', see lib source code
			if(path.split('/').length % 2 === 0) return [];
				
			const doc = await db.doc(path).get();
			return doc.exists ? [Note.Parse(doc, `${NotesPath}/${doc.id}`)] : [];
		}

		if(typeof seen === 'boolean') {
			const snapshot = await db.collection(NotesPath)
				.where('Seen', '==', seen)
				.get();

			if(snapshot.empty) return [];
			return snapshot.docs.map(doc => Note.Parse(doc, `${NotesPath}/${doc.id}`));
		}

		return [];
	}

	/**
	 * @returns {Promise<Array<Note>>}
	 */
	async ReadAll() {
		const snapshot = await db.collection(NotesPath).get();

		if(snapshot.empty) return [];
		return snapshot.docs.map(doc => Note.Parse(doc, `${NotesPath}/${doc.id}`));
	}

	/**
	 * Delete entire collection by path 
	 * @param {String} path
	 * @returns {Promise<boolean>} true if success
	 */
	async Delete(path = '') {
		if(!path.startsWith(NotesPath)) throw new Error('Invalid path');
		const ref = db.doc(path);

		return ref.get()
			.then(oldNote => this.Backup(oldNote.data()))
			.then(() => ref.delete())
			.then(() => true)
			.catch(err => {
				console.warn(err);
				return false;
			});
	}

	/**
	 * @param {String} path 
	 * @param {*} data
	 * @returns {Note} 
	 */
	async Update(path = '', data = null) {
		if(Array.isArray(data.Content) && typeof data.Title === 'string')
			data.KeyWords = KeyWordGenerator([...data.Content, data.Title]);

		const ref = db.doc(path);
		return ref.update(data)
			.then(() => ref.get())
			.then(doc => Note.Parse(doc, path))
			.catch(err => {
				console.warn(err);
				return null;
			});
	}

	/**
	 * @param {Note} note
	 * @private
	 */
	async Backup(note = {}) {
		const snapshot = await db.collection(BackupPath).add(note);
		return await snapshot.get();
	}

	/**
	 * Test only
	 * @returns {FirebaseFirestore.CollectionReference<FirebaseFirestore.DocumentData>}
	 */
	GetCollectionReference() {
		return db.collection(NotesPath);
	}
}

module.exports = new FireStore();
