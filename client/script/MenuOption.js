const colors = {
    default : '#191d21',
    red     : '#dc3545',
    orange  : '#fd7e14',
    yellow  : '#ffc107',
    green   : '#28a745',
    cyan    : '#17a2b8',
    blue    : '#007bff',
    purple  : '#6f42c1',
    pink    : '#e83e8c',
};

function MenuOption() {
    const menu = $('[role="option-menu"]');
    // Visible elem exclude menu-container (parent elem)
    const visibleMenuWidth = () => menu.find('.dropdown-menu').width();
    const visibleMenuHeight = () => menu.find('.dropdown-menu').height();
    // Popper callback
    const calculateMenuOffset = ({ placement, reference, popper }) => {
        // Move to left if out of viewport width
        const rightEdge = reference.x + reference.width + visibleMenuWidth();
        if (rightEdge >= window.innerWidth)
            return [
                -visibleMenuWidth() - reference.width,
                -reference.height
            ];

        // Move up if out of viewport height
        const bottomEdge = reference.y + reference.height + visibleMenuHeight();
        if (bottomEdge >= window.innerHeight)
            return [
                reference.width,
                -visibleMenuHeight() - reference.height
            ];

        // Set next to option button by default
        return [reference.width, -reference.height];
    }
    // Show option menu next to option button
    // Nothing here, just call calculateMenuOffset();
    const popperOptions = { modifiers: [{ name: 'offset', options: { offset: calculateMenuOffset } }] };

    /**
     * Implement this event
     * @param {String} action the action of menu item click on
     * @param {Note} note Note object
     * @param {String} colorName != null if action === 'picker'
     * @event
     */
    this.onMenuClick = function (action, note, colorName) { }
    /**
     * @param {Object} options
     * @param {Note} options.note Note object
     * @param {HTMLElement} options.target elem to show menu next to
     * @return Popper instance
     * */
    this.show = function (options = {}) {
        const { target, note } = options;
        const colorPicker = menu.find('[role="popover-colors"]');
        const popper = Popper.createPopper(target, menu.get(0), popperOptions);
        menu.attr('data-show', ''); // Required by Popper
        // menu.attr('data-path', note.Path);

        menu.on('mouseenter', '[data-action="select-color"]', function() {
            colorPicker.find(`.${note.Color}`).addClass('active');
            colorPicker.addClass('show');
        })
        menu.on('mouseleave', '.dropdown-menu', function(e) {
            colorPicker.removeClass('show');
        })

        // Attach handle on menu items
        menu.on('mousedown', '[data-action], [data-color]', e => {
            const action = e.target.getAttribute('data-action');
            
            if(action !== 'select-color') {
                const colorName = e.target.getAttribute('data-color');
                this.onMenuClick(action, note, colorName);
            }
        });

        // Hide option menu on next click
        $(document).on('mouseup', e => {
            const action = e.target.getAttribute('data-action');
            // Color picker not have action
            if(action == null || action !== 'select-color') {
                this.hide(popper);
            }
        })

        return popper;
    }
    /**
     * 
     * @param {Popper} popper got after shown option menu, via `Popper.createPopper` method
     */
    this.hide = function (popper) {
        popper.destroy();
        $(document).off('mouseup');
        menu.off('mouseenter mouseleave mousedown');
        menu.removeAttr('data-show');
        // menu.removeAttr('data-show data-path');
        menu.find('[role="popover-colors"]').removeClass('show')
        menu.find('[role="popover-colors"] .active').removeClass('active');
    }
    
    const colorItems = Object.keys(colors).map(color => (
        `<div class="color-item ${color}" data-color="${color}" data-action="picker"></div>`
    ));
    menu.find('[role="popover-colors"]').append(colorItems);

    return this;
}

const menu = new MenuOption();
