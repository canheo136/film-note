// const ClassSuffix = ['', 'success', 'danger', 'warning', 'info'];
/**
 * container attribute: `role="alert-container"`
 **/
class _Alert {
    /**
     * @param {Object} options
     * @param {String} options.type bootstrap contextual classes (suffix only), default is `primary`
     * @param {String} options.message suport html
     * @param {Number} options.timeout in milliseconds, auto hide alert after `timeout`, 0 to never hide
     * @param {Object} options.action default is null
     * @param {String} options.action.msg suport html
     * @param {Function} options.action.callback
     **/
    constructor(options = {}) {
        const {
            type = 'primary',
            message = '',
            action = null,
        } = options;

        this.timer = null;
        this.timeout = typeof options.timeout === 'number' ? options.timeout : 3000;
        this.timerHandler = null;
        this.container = $('[role="alert-container"]');
        this.element = $(`
                <div class="alert alert-${type} alert-dismissible fade">
                    <button type="button" class="close" data-dismiss="alert">&times;</button>
                    ${message}
                </div>
            `);

        if (action != null) {
            const { msg = '', callback = () => { } } = options.action;
            const actionTag = $(`<span class="alert-action">${msg}</span>`);
            actionTag.on('click', e => {
                clearTimeout(this.timer);
                this.hide();
            });
            actionTag.appendTo(this.element);
            this.timerHandler = callback;
        }
    }

    show() {
        this.element.appendTo(this.container).addClass('show');
        if (this.timeout > 0)
            this.timer = setTimeout(() => {
                this.hide();
                execFn(this.timerHandler, this);
            }, this.timeout);
        return this;
    }
    hide() {
        this.element.alert('close');
        return this;
    }

    /**
     * @param {String} message support HTML
     **/
    static Info(message = '') {
        return new _Alert({ type: 'info', message: message }).show();
    }
    /**
     * @param {String} message support HTML
     **/
    static Success(message = '') {
        return new _Alert({ type: 'success', message: message }).show();
    }
    /**
     * @param {String} message support HTML
     **/
    static Warning(message = '') {
        return new _Alert({ type: 'warning', message: message }).show();
    }
    /**
     * @param {String} message support HTML
     **/
    static Error(message = '') {
        return new _Alert({ type: 'danger', message: message }).show();
    }
    /**
     * @param {Object} o
     * @param {String} o.message
     * @param {Function} o.callback
     **/
    static Cancelation({ message = '', callback }) {
        return new _Alert({
            timeout: 4000,
            message: message,
            action: {
                msg: 'undo',
                callback: callback
            }
        }).show();
    }
}
