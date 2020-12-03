class _NoteItem {
    constructor(data = {}) {
        if (!data.note || !data.note.ID)
            throw new Error();

        this.visible = true;
        this.isCollapsed = true;
        this.hasPreviewCard = false;
        this.note = data.note;
        this.element = this.createElement(data.note);

        /**
         * @event
         **/
        this.beforeExpand = null;
        /**
         * @event
         **/
        this.afterExpand = null;
        /**
         * @event
         **/
        this.beforeCollapse = null;
        /**
         * @event
         **/
        this.afterCollapse = null;
    }

    /**
     * @private
     */
    createElement(note = {}, previewCard) {
        const elem = $(`
            <div class="list-group mb-2" role="note-item" data-id="${note.ID}">
                <div class="list-group-item note-item ${note.Color ? note.Color : 'default'}">
                    <div class="note">
                        <div class="checkbox ${note.Seen ? 'checked' : ''}"></div>
                        <div class="content">${note.Title}</div>
                        <div class="option" title="option"></div>
                    </div>
                    <div class="note-preview collapse">
                        <div class="list-group note-group"></div>
                        <div class="card" data-link=${note.Link}></div>
                    </div>
                </div>
            </div>
        `);
        note.Content.forEach(text => {
            elem.find('.list-group.note-group')
                .append(`<div class="list-group-item">${text}</div>`);
        })
        if (previewCard instanceof jQuery) {
            elem.find('.card').replaceWith(previewCard);
        }

        return elem;
    }
    /**
     * @return {Promise} use for chain when call with fetch API
     **/
    createPreviewCard(openGraph = null) {
        if (this.hasPreviewCard)
            return Promise.reject('Already exists card');

        const placeholder = this.element.find('.card');
        this.hasPreviewCard = true;

        if (!openGraph) {
            // Show link as a content
            placeholder.prev().append(`<div class="list-group-item">${this.note.Link}</div>`);
            placeholder.remove();
            return Promise.resolve();
        }
        const card = $(`
            <div class="card note-group">
                <div class="card-img-top"
                    style="background-image: url('${openGraph.ogImage.url}');">
                </div>
                <div class="card-body">
                    <a class="link" target="blank" href="${openGraph.requestUrl}">${openGraph.ogTitle}</a>
                    <div class="description" title="${openGraph.ogDescription}">${openGraph.ogDescription}</div>
                </div>
                <span class="site-name">${openGraph.ogSiteName}</span>
            </div>
        `);
        placeholder.replaceWith(card);
        return Promise.resolve(card);
    }
    /**
     * Refresh view after `Note` object changed
     **/
    refresh() {
        if (this.note.Seen)
            this.element.find('.checkbox').addClass('checked');
        else
            this.element.find('.checkbox').removeClass('checked');

        this.element.find('.note .content').text(this.note.Title);

        const content = this.element.find('.list-group.note-group');
        content.children().remove();
        this.note.Content.forEach(text => {
            content.append(`<div class="list-group-item">${text}</div>`)
        })

        this.element.find('.note-item')
            .removeClass('default red blue purple pink orange yellow green cyan')
            .addClass(this.note.Color);

        // Maybe link was changed
        const html = `<div class="card" data-link=${this.note.Link}></div>`;
        const card = this.element.find('.card');
        if (card.length > 0)
            card.replaceWith(html);
        else
            content.after(html);
        // Re-fetch link in next expand action
        this.hasPreviewCard = false;
        this.toggleCollapse('hide');
    }
    /**
     * Remove element from view
     **/
    detach() {
        this.element.detach();
        return this;
    }
    /**
     * @returns {Promise} promise alway resolve
     */
    show() {
        return new Promise((resolve, _) => {
            this.visible = true;
            this.element.show(100, resolve);
        })
    }
    /**
     * @returns {Promise} promise alway resolve
     */
    hide() {
        return new Promise((resolve, _) => {
            this.visible = false;
            this.element.hide(100, resolve);
        });
    }
    /**
     * @return {Boolean} visible
     **/
    toggleVisible() {
        if (this.visible) this.hide();
        else this.show();
        return this.visible;
    }
    /**
     * @return {Boolean} isCollapsed
     **/
    toggleCollapse(type = 'toggle') {
        const seft = this;
        const collapser = seft.element.find('.note-preview');
        // Remove old events
        collapser.off('show.bs.collapse').off('shown.bs.collapse');
        collapser.off('hide.bs.collapse').off('hidden.bs.collapse');
        // Add new
        collapser.on('show.bs.collapse', function () {
            seft.element.css('background-color', 'black');
            seft.element.find('> div').addClass('border-secondary');
            execFn(seft.beforeExpand, seft, seft.hasPreviewCard);
        });
        collapser.on('shown.bs.collapse', function () {
            seft.isCollapsed = false;
            execFn(seft.afterExpand, seft, seft.hasPreviewCard);
        });
        collapser.on('hide.bs.collapse', function () {
            execFn(seft.beforeCollapse, seft, seft.hasPreviewCard);
        });
        collapser.on('hidden.bs.collapse', function () {
            seft.isCollapsed = true;
            seft.element.css('background-color', '');
            seft.element.find('> div').removeClass('border-secondary');
            execFn(seft.afterCollapse, seft, seft.hasPreviewCard);
        });
        collapser.collapse(type);

        return seft.isCollapsed;
    }
    /**
     * @return {Boolean} isChecked
     **/
    toggleCheckBox() {
        const checkbox = this.element.find('.checkbox');
        if (this.note.Seen) {
            this.note.Seen = false;
            checkbox.removeClass('checked');
        }
        else {
            this.note.Seen = true;
            checkbox.addClass('checked');
        }
        return Boolean(this.note.Seen);
    }
    /**
     * @param {Note[]} notes response from server
     * @return {_NoteItem[]}
     * */
    static FromObject(notes = []) {
        const output = [];
        for (let i = 0; i < notes.length; i++) {
            output.push(new _NoteItem({ note: notes[i] }));
        }
        return output;
    }
}
