const MaxCol = 3;
const MaxFilterHistory = 10;
const ListModeClasses = 'col-8';
const GridModeClasses = 'col-sm-8 col-lg-4';

/**
 * container attribute: `role="note-container"`
 **/
class _NoteContainer {
    /**
     * @param {Object} options
     * @param {String} options.viewMode list | grid, default is grid
     */
    constructor(options = {}) {
        const { viewMode = 'grid' } = options;

        this.isGrid = viewMode === 'grid';
        this.items = [];
        this.container = $('div[role="note-container"]');
        /**
         * Note object of visible items from previous filter
         */
        this.filterStack = [];
        this.initEvent();
    }

    /**
     * @event
     * @private
     **/
    onItemClick(id, target) {
        const item = this.items.filter(i => i.note.ID === id)[0];
        if (!item) throw new Error('Wrong !!');

        const placeholder = item.element.find('.card');
        item.beforeExpand = function (hasCard) {
            // Already created preview card
            if (hasCard) return;
            // Fetching, waittttttt ...
            if(placeholder.children('.card-center').length !== 0) return;
            // Show loading effect
            placeholder.append(`<div class="card-center"><div class="spinner-border text-primary"></div></div>`);
        }
        item.afterExpand = function (hasCard) {
            if (hasCard) return;
            fetchOpenGrap({ url: item.note.Link })
                .then(item.createPreviewCard.bind(item))
                .catch(err => {
                    item.createPreviewCard(null);
                    console.warn(err);
                });
        }
        item.toggleCollapse();
    }
    /**
     * @event
     * @private
     **/
    onCheckboxClick(id, target) {
        const item = this.items.filter(i => i.note.ID === id)[0];
        if (!item) throw new Error('Wrong !!');

        const isChecked = item.toggleCheckBox();
        updateNote({
            path: item.note.Path,
            data: { Seen: isChecked }
        })
            .then(res => {
                _Alert.Success(`Marked <strong>${item.note.Title}</strong> as <strong>${isChecked ? 'seen' : 'new'}</strong>`);
            })
            .catch(err => {
                item.toggleCheckBox();  // Reverse if error
                _Alert.Error(`Update failed!`);
                console.warn(err);
            })
    }
    /**
     * @event
     * @private
     **/
    onOptionClick(id, target) {
        const item = this.items.filter(i => i.note.ID === id)[0];
        if (!item) throw new Error('Wrong !!');
        menu.show({ note: item.note, target: target });
    }

    /**
     * Init events at the container level,
     * sub items will be modified dynamically
     * @private
     */
    initEvent() {
        const seft = this;
        this.container.on('click', '[role="note-item"]', function (e) {
            const id = $(this).data('id');
            switch (e.target.className.trim().toLowerCase()) {
                case 'content':
                case 'list-group-item note-item':
                    seft.onItemClick.call(seft, id, this);
                    break;

                case 'checkbox':
                case 'checkbox checked':
                    seft.onCheckboxClick.call(seft, id, e.target);
                    break;

                case 'option':
                    seft.onOptionClick.call(seft, id, e.target);
                    break;
            }
        })
    }

    /**
     * @private
     **/
    initColumns() {
        const cols = []
        const createCol = () => $(`<div class="${this.isGrid ? GridModeClasses : ListModeClasses}"></div>`);

        this.clear();
        for (let i = 0; i < MaxCol; i++) {
            cols.push(createCol().appendTo(this.container));
        }
        return cols;
    }
    /**
     * @private
     */
    addSearchHistory(notes = this.items) {
        this.filterStack.push(
            notes.filter(i => i.visible).map(i => deepClone(i.note))
        );
        if(this.filterStack.length > MaxFilterHistory)
            this.filterStack.splice(0, 1);
    }
    /**
     * @param {_NoteItem[]} items to hide, defaul is all items
     * @return {Promise} resolve when all items are hidden
     **/
    hideAll(items = this.items) {
        const tasks = items.filter(i => i.visible).map(i => i.hide());
        return Promise.all(tasks);
    }
    /**
     * @param {_NoteItem[]} items to show, defaul is all items
     * @return {Promise} resolve when all items are shown
     **/
    showAll(items = this.items) {
        const tasks = items.filter(i => !i.visible).map(i => i.show());

        return Promise.all(tasks)
            .then(this.reorderVisibleItems(items));
    }
    initItem(items = []) {
        this.items = [];
        this.items = [...items];
        return this;
    }

    /**
     * Find all columns in `container` or create new if not found
     * @returns {jQuery} jQuery
     */
    getColumns() {
        const cols = this.container.find('> div:not(.center)');
        return cols.length > 0 ? cols : this.initColumns();
    }
    /**
     * @returns {jQuery} jQuery
     */
    getShortestCol() {
        let shortedColIndex = 0;
        const cols = this.getColumns();
        const lengthOfCols = cols.map((i, e) => $(e).children().length).toArray();

        lengthOfCols.forEach((length, index) => {
            if (lengthOfCols[shortedColIndex] > length) {
                shortedColIndex = index;
            }
        })
        return $(cols[shortedColIndex]);
    }

    /**
     * call `reorderVisibleItems` to apply
     * @param {Object} options
     * @param {String} options.alphabet `asc` or `desc`, falsy to skip
     * @param {String} options.create `asc` or `desc`, falsy to skip
     * @param {String} options.update `asc` or `desc`, falsy to skip
     * @example
     *  _container.sortItem({
     *      alphabet: 'asc',
     *      // create: 'desc',
     *      // update: 'asc'
     *  })
     */
    sortItems(options = {}) {
        const { alphabet = null, create = null, update = null } = options;
        if(alphabet) {
            this.items.sort((i1, i2) => (
                compareNote(i1.note, i2.note, { property: 'Title', type: alphabet })
            ));
        }
        else if(create) {
            this.items.sort((i1, i2) => (
                compareNote(i1.note, i2.note, { property: 'CreateTime', type: create })
            ));
        }
        else if(update) {
            this.items.sort((i1, i2) => (
                compareNote(i1.note, i2.note, { property: 'UpdateTime', type: update })
            ));
        }
        return this;
    }
    /**
     * Make all columns have equivalent number of items
     * @param {Object} options
     * @param {_NoteItem[]} options.items default is all items
     * @param {String} options.direction v (vertial) | h (horizontal), default is vertial
     */
    reorderVisibleItems(options = {}) {
        const { items = this.items, direction = 'vertial' } = options;
        const directions = ['v', 'vertial', 'h', 'horizontal'];
        if (directions.indexOf(direction) === -1)
            throw new Error('Invalid direction');

        const cols = this.getColumns();
        const visibleItems = items.filter(i => i.visible);
        if (visibleItems.length === 0)
            return this.empty();

        let currentCol = 0;
        const maxItemPerCol = rounder(visibleItems.length / MaxCol);
        for (let i = 0; i < visibleItems.length; i++) {
            if (direction.startsWith('v') &&
                // Vertial, make view like this
                // ---- cols ->
                //      a | d | g
                //      b | e | h
                //      c | f | i
                // -- maxItemPerCol --
                (i > 0 && i % maxItemPerCol === 0) &&   // Over max, go next col
                (currentCol + 1 < cols.length)) // Index alway less than length
                currentCol++;

            visibleItems[i].detach();
            visibleItems[i].element.appendTo(cols[currentCol]);

            if (direction.startsWith('h') &&
                // Horizontal, make view like this
                // - cols ->
                // a | b | c
                // d | e | f
                // g | h | i | <-- max item
                ++currentCol >= cols.length)    // Index alway less than length
                currentCol = 0;
        }
        return this;
    }
    /**
     * @param {Object} filters 
     * @param {String} filters.visible all | seen | new
     * @param {String} filters.search film's title
     **/
    filter(filters = {}) {
        const { visible = 'all', search = null } = filters;
        const tasks = [];

        if(typeof search === 'string')
            this.addSearchHistory();
        
        if (typeof search === 'string') {
            // No filter, so not need to reverse
            if (search.length === 0) return this;

            let index = 0;
            let foundItems = this.items;
            const segments = search.toLowerCase().split(' ');

            while (index < segments.length) {
                foundItems = foundItems.filter(({ note }) => {
                    return note.KeyWords.some(word => (
                        word.indexOf(segments[index]) != -1
                    ));
                })
                index++;
            }

            // We will show all notes matched with key words
            // Skip the others filters
            this.hideAll()
                .then(this.showAll(foundItems))
                .then(this.reorderVisibleItems({ items: foundItems }));

            return this;
        }

        this.items.forEach(i => {
            switch (visible) {
                case 'seen':
                    if (i.note.Seen) tasks.push(i.show());
                    else tasks.push(i.hide());
                    break;

                case 'new':
                    if (i.note.Seen) tasks.push(i.hide());
                    else tasks.push(i.show());
                    break;

                default:
                    tasks.push(i.show());   // Show all by default
                    break;
            }
        })
        Promise.all(tasks)
            .then(this.reorderVisibleItems.bind(this));

        return this;
    }
    /**
     * Back to previous filter. This action will show or hide items
     * from previous session
     */
    reverseFilter() {
        const visibleNotes = this.filterStack.pop();
        if(typeof visibleNotes === 'undefined') {
            return this;
        }

        const tasks = this.items.map((item, index) => {
            return visibleNotes.some(note => note.ID === item.note.ID) ?
                item.show() : item.hide();
        })

        Promise.all(tasks)
            .then(this.reorderVisibleItems.bind(this));

        return this;
    }
    /**
     * @param {_NoteItem} item
     */
    addItem(item) {
        this.items.push(item);
        // Add to top of the shortest col
        this.getShortestCol().prepend(item.element);

        return this;
    }
    /**
     * This fn is equivalent with call `initItem` and then `reorderVisibleItems`,
     * except items are ordered with `filter` (if define) before add to view
     * @param {_NoteItem[]} items 
     * @param {Object} filters
     * @param {Boolean} filters.seen
     * @param {String} filters.direction vertical | horizontal
     * @param {Object} sorter @see `_NoteContainer.sortItems`
     */
    addRange(items = [], filters = {}, sorter = {}) {
        const cols = this.clear().initColumns();
        const { seen = undefined } = filters;

        // Something went wrong with filter name
        // seen == new ??? :)
        if (seen === 'new' || seen === 'seen') {
            items.forEach(i => {
                i.visible = (i.note.Seen === Boolean(seen === 'seen'));
            })
        }
        else { } // Visible all by default
        return this.initItem(items)
                .sortItems(sorter)
                .reorderVisibleItems(filters);
    }
    editItem(note = {}) {
        for (let i = this.items.length - 1; i >= 0; i--) {
            if (this.items[i].note.ID === note.ID) {
                this.items[i].note = note;
                this.items[i].refresh();
                break;
            }
        }
        return this;
    }
    removeItem({ path = '', id = '' }) {
        for (let i = this.items.length - 1; i >= 0; i--) {
            if (this.items[i].note.ID === id || this.items[i].note.Path === path) {
                this.items[i].element.remove(); // Remove from view
                this.items.splice(i, 1);    // Remove from local collection
                break;
            }
        }
        return this;
    }
    /**
     * @param {String} viewMode list | grid, skip for toggle
     * @return {Boolean} is grid view
     **/
    toggleViewMode(viewMode = null) {
        // Toggle view mode by bootstrap's grid system,
        // just modify predefine classes of elements which are direct children
        const children = this.container.find('> div:not(.center)');
        // Skip 'empty' or 'loading' element
        if (children.length === 0) return this.isGrid;

        if (viewMode &&
            (viewMode === 'list' || viewMode === 'grid')) {
            this.isGrid = (viewMode === 'grid');
        }
        else this.isGrid = !this.isGrid;

        children.each(index => {
            children.eq(index)
                .removeClass(this.isGrid ? ListModeClasses : GridModeClasses)
                .addClass(this.isGrid ? GridModeClasses : ListModeClasses);
        });

        this.reorderVisibleItems({
            direction: this.isGrid ? 'vertial' : 'horizontal'
        });

        return this.isGrid;
    }
    loading() {
        this.clear();
        this.container.append(`<div class="center"><div class="spinner-border text-primary"></div></div>`)
        return this;
    }
    empty() {
        this.clear();
        this.container.append('<div class="center">Empty</div>');
        return this;
    }
    /**
     * Remove all elements in `container`, include columns
     */
    clear() {
        this.container.children().remove();
        return this;
    }
}

const _container = new _NoteContainer();
