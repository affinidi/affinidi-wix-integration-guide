import wixLocationFrontend from 'wix-location-frontend';
import { authentication } from 'wix-members-frontend';
import { session } from 'wix-storage-frontend';

import { reject } from './util.js';
import { generateAuthUrl } from 'backend/affinidi/affinidi.web.js'

const key = '@affinidi/sso/requestState';

/**
 * Create a URL for navigating to the Affinidi Login.
 * 
 * @returns {Promise<string>}
 */
export const getAuthUrl = async () => {
    session.removeItem(key);
    try {
        console.log('wixLocationFrontend baseURL', wixLocationFrontend.baseUrl);
        const { authorizationUrl, state } = await generateAuthUrl(wixLocationFrontend.baseUrl);
        console.log('authorizationUrl & state ', authorizationUrl, state);
        session.setItem(key, state);
        return authorizationUrl;

    } catch (error) {
        session.removeItem(key);
        return reject('getAuthUrl', error);
    }
};

/**
 * Logs the current site visitor into the site 
 * using the session token returned by the `getAuth()` function.
 * 
 * @retruns {Promise<string>}
 */
export const applyToken = async (skipStateCheck = false) => {
    console.log('query', wixLocationFrontend.query);
    const { sessionToken, state } = wixLocationFrontend.query || {};

    wixLocationFrontend.queryParams.remove(['sessionToken', 'state']);

    return Promise.resolve()
        .then(() => {
            const requestState = session.getItem(key);
            console.log('session state', requestState)

            if (sessionToken && (skipStateCheck === true || requestState === state)) {
                return authentication.applySessionToken(sessionToken).then(() => {});
            }

            return reject('applyToken', 'Invalid sessionToken');
        }).finally(() => {
            session.removeItem(key);
        }).catch((error) => {
		    console.error('applyToken:error ', error);
            return reject('applyToken', error);
        });
};