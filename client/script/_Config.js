const StorageKey_host = 'host';
const StorageKey_secret = 'secret';
const StorageKey_config = 'config';

class Config {
    constructor(){
        this.ViewMode = 'grid-view';
        this.Filter = 'all';
        this.Sorter = {
            group: 'datetime',
            type: 'descending'
        };
    }

    /**
     * Save to local storage
     */
    save() {
        const json = JSON.stringify(this);
        localStorage.setItem(StorageKey_config, json);
        return this;
    }

    /**
     * Retrieve config from local storage
     */
    retrieve() {
        const config = JSON.parse(localStorage.getItem(StorageKey_config));
        if(config == null) {
            return this.save();
        }

        this.Filter = config.Filter;
        this.Sorter = config.Sorter;
        this.ViewMode = config.ViewMode;

        return this;
    }

    /**
     * @returns {String}
     */
    getSecretKey() {
        return localStorage.getItem(StorageKey_secret);
    }

    /**
     * @param {String} key 
     */
    setSecretKey(key = '') {
        localStorage.setItem(StorageKey_secret, key);
    }
    /**
     * @returns {String}
     */
    getHost() {
        return localStorage.getItem(StorageKey_host);
    }

    /**
     * @param {String} key 
     */
    setHost(key = '') {
        localStorage.setItem(StorageKey_host, key);
    }
}

const config = new Config().retrieve();
const host = config.getHost();
const secretKey = config.getSecretKey();

console.warn({ host, secretKey });
