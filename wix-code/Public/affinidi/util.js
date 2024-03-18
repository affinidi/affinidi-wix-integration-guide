/**
 * @param {string} name
 * @param {Error | string} error
 */
export const reject = (name, error) => {
    const message = typeof error === 'string' ?
        error :
        (error && error.message) || String(error);

    return Promise.reject(
        new Error(`Failed to ${name} - original error - ${message}`),
    );
};

/**
 * @param {...string} strArray
 * @returns {string}
 */
export const urlJoin = (...strArray) => {
    const resultArray = strArray.map((item, index) => {
        if (index > 0) {
            item = item.replace(/^[/]+/, '');
        }

        if (index < strArray.length - 1) {
            return item.replace(/[/]+$/, '');
        }

        return item.replace(/[/]+$/, '/');
    });

    let str = resultArray.join('/').replace(/\/(\?|&|#[^!])/g, '$1');
    let parts = str.split('?');

    str = parts.shift() + (parts.length > 0 ? '?' : '') + parts.join('&');

    return str;
};

/**
 * @param {string} rootUrl
 * @param {string} [redirectUri]
 * @returns {string}
 */
export const getUrl = (rootUrl, redirectUri) => {
    // Default redirect to home page
    if (typeof redirectUri !== 'string') {
        return rootUrl;
    }

    // Redirection URI is absolute
    if (/^https?:\/\//.test(redirectUri)) {
        return redirectUri;
    }

    return urlJoin(rootUrl, redirectUri);
};