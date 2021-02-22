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
     * @param {boolean} options.action.exchange false to assign callback for timer, true for action text
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
        this.actionHandler = null;
        this.container = $('[role="alert-container"]');
        this.element = $(`
                <div class="alert alert-${type} alert-dismissible fade">
                    <button type="button" class="close" data-dismiss="alert">&times;</button>
                    ${message}
                </div>
            `);

        if (action != null) {
            const { msg = '', exchange = false, callback = () => { } } = options.action;
            const actionTag = $(`<span class="alert-action">${msg}</span>`);

            if(exchange === true)
                this.actionHandler = callback;
            else
                this.timerHandler = callback;

            actionTag.on('click', e => {
                execFn(this.actionHandler);
                clearTimeout(this.timer);
                this.hide();
            });
            actionTag.appendTo(this.element);
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
     * @param {Object}   options
     * @param {Number}   options.timeout
     * @param {String}   options.message
     * @param {Function} options.callback
     * @param {String}   options.actionText
     * @param {boolean}  options.exchange
     */
    static Action(options = {}) {
        const { timeout, message, callback, actionText, exchange } = options;

        return new _Alert({
            timeout: timeout,
            message: message,
            action: {
                msg: actionText,
                exchange: exchange,
                callback: callback,
            }
        }).show();
    }

    
    static Cancelable({ message = '', callback }) {
        _Alert.Action({
            timeout: 5000,
            message: message,
            actionText: 'undo',
            callback: callback
        });
    }
}
