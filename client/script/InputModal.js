function InputModal() {
    let state = { path: '', action: '' };

    const modal = $('#input-modal');
    const inputContainer = modal.find('.list-group.note-group');
    const elemByRole = role => inputContainer.find(`[role="${role}"]`);
    const init = () => {
        modal.on('hidden.bs.modal', this.clear.bind(this));
        modal.on('shown.bs.modal', e => {
            if (typeof this.onShow === "function")
                this.onShow(e.target);
        });
        modal.on('click', '[data-action="save"]', this.save.bind(this));
        modal.on('keyup', '[role="content"]', function (e) {
            if (e.ctrlKey && e.keyCode === 13) {
                // Ctrl + enter, add new element;
                $(this).clone().text('').insertAfter(this).focus();
            }

            if (e.ctrlKey && e.keyCode === 46) {
                // Ctrl + delete, delete active element
                const selector = '[role="content"]';

                if (modal.find(selector).length > 1) {
                    const prevElem = $(this).prev(selector);
                    const nextElem = $(this).next(selector);

                    if (nextElem.length != 0) nextElem.focus();
                    else if (prevElem.length != 0) prevElem.focus();

                    $(this).remove();
                }
            }
        })
    }
    const createInput = (text = '', role = '') => {
        role = role.toLowerCase();

        const roles = ['title', 'content', 'link'];
        if (roles.indexOf(role) === -1)
            throw new Error('Invalid input role');

        return $(`<div class="list-group-item padding-sm" contenteditable="true" placeholder="${role.charAt(0).toUpperCase() + role.slice(1)}" role="${role}">${text}</div>`);
    }

    this.onShow = function (target) { }
    this.onSaveChanges = function (data) { }

    this.save = function () {
        const link = elemByRole('link').text();
        const title = elemByRole('title').text();
        const content = elemByRole('content').map((i, e) => e.innerHTML).toArray();

        const data = {
            Link: link.replace(/<.+?>/g, ''),
            Title: title.replace(/<.+?>/g, ''),
            Content: content.map(c => c.replace(/<.+?>/g, ''))
        };

        if (typeof this.onSaveChanges === "function")
            this.onSaveChanges(state.path, data, state.action);
        this.toggle('hide');
    }
    this.show = function (options = {}) {
        const { path, title, link, content } = options;
        const isEdit = path && title && link && content;

        state.path = path;
        state.action = isEdit ? 'edit' : 'create';

        return this.header(isEdit ? title : 'Create note')
            .title(isEdit ? title : '')
            .link(isEdit ? link : '')
            .content(isEdit ? content : [])
            .toggle('show');
    }
    this.toggle = function (state = 'toggle') {
        const states = ['show', 'hide', 'toggle'];
        if (states.indexOf(state.toLowerCase()) >= 0)
            modal.modal(state);

        return this;
    }
    this.header = function (title) {
        modal.find('.modal-title').text(title);
        return this;
    }
    this.title = function (title) {
        if (typeof title === 'undefined') {
            elemByRole('title').remove();
            return this;
        }
        const elem = createInput(title, 'title');
        // Title is alway the 1st elem in container
        inputContainer.prepend(elem);
        return this;
    }
    this.content = function (content) {
        if (typeof content === 'undefined') {
            elemByRole('content').remove();
            return this;
        }
        if (Array.isArray(content) && content.length > 0) {
            content.forEach(c => this.content(c));
            return this;
        }

        const elem = createInput(content, 'content');
        // Content is alway between title and link.
        // Make the newest content is alway on the bottom
        elemByRole('link').before(elem);
        return this;
    }
    this.link = function (link) {
        if (typeof link === 'undefined') {
            elemByRole('link').remove();
            return this;
        }
        const elem = createInput(link, 'link');
        // Link is alway the last elem in container
        inputContainer.append(elem);
        return this;
    }
    this.clear = function () {
        this.title(null);
        inputContainer.children().remove();
        for (let prop in state)
            prop = '';
        return this;
    }

    init();

    return this;
}

const inputModal = new InputModal();
