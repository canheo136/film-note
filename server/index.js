const express = require('express');
const bodyParser = require('body-parser');
const Note = require('./cloud-firestore/Note');
const FireStore = require('./cloud-firestore/firestore');
const scraper = require('open-graph-scraper');
const { cors, HeaderFilter } = require('./middleware');

const app = express();
// Use `config.setSecretKey` on browser to set key
const { PORT = 3000, SecretKey = 'test_key' } = process.env;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(HeaderFilter(SecretKey));

app.get('/', (req, res) => { res.status(200).end(); })
app.post('/preview', (req, res) => {
    scraper({ url: req.body.url })
    .then(data => { res.json(data.result); })
    .catch(err => { res.json(err.result); })
})
app.post('/c', async (req, res) => {
    const newNote = new Note(req.body.Title, req.body.Content, req.body.Link);
    FireStore.Create(newNote)
        .then(createdNote => res.json(createdNote))
        .catch(err => res.json(err));
})
app.post('/r', async (req, res) => {
    const note = await FireStore.Read({
        id: req.body.id,
        path: req.body.path,
        seen: req.body.seen,
        title: req.body.title,
    });
    res.json(note);
})
app.post('/ra', async (req, res) => {
    FireStore.ReadAll()
        .then(notes => res.json(notes))
        .catch(err => res.json([]));
})
app.post('/u', async (req, res) => {
    FireStore.Update(req.body.path, req.body.data)
        .then(note => res.json(note))
        .catch(error => res.json({ error }));
})
app.post('/d', async (req, res) => {
    FireStore.Delete(req.body.path)
        .then(() => res.json({ success: true }))
        .catch(error => res.json({ error }));
})

app.listen(PORT, () => { console.log(`Server is running on port ${PORT}`); })
