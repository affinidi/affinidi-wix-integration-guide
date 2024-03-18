import { response } from 'wix-http-functions';
import { authentication } from 'wix-members-backend';
import { Issuer, generators } from 'openid-client';
import { getSecret } from 'wix-secrets-backend'
import { reject, getUrl, urlJoin } from 'public/affinidi/util.js';

const credentialsName = 'affinidi-sso-credentials';
const config = {
    "redirectUri": "/_functions/getAuthCallback",
    "loggedInPage": "/affinidi-loggedin"
};


const getSSOSettings = async (baseUrl) => {

    const credentials = await getSecret(credentialsName);
    let options = JSON.parse(credentials);
    options = { ...options, "redirect_uri": urlJoin(baseUrl, await config.redirectUri) };
    return options;
}

/**
 * @param {string} baseUrl
 */
const getClient = async (baseUrl) => {
    try {

        const options = await getSSOSettings(baseUrl);
        const affinidi = await Issuer.discover(options.issuer);
        const client = new affinidi.Client({
            client_id: options.client_id,
            redirect_uris: [options.redirect_uri],
            response_types: ['code'],
            token_endpoint_auth_method: 'none',
        })
        return client;

    } catch (error) {
        return reject('getClient', error);
    }
};

export const getAuthUrl = async (baseUrl) => {

    const options = await getSSOSettings(baseUrl);
    const state = generators.state();
    const params = {
        code_challenge: generators.codeChallenge(options.code_verifier),
        code_challenge_method: 'S256',
        response_type: 'code',
        scope: 'openid',
        state,
    }

    const client = await getClient(baseUrl);

    const authorizationUrl = client.authorizationUrl(params);

    return { authorizationUrl, state };
};

/**
 * Handles the redirect from Affinidi and generates a session token.
 * 
 * @param {wix_http_functions.WixHttpFunctionRequest} request 
 * @returns {Promise}
 */
export const getAuth = async (request) => {
    try {

        const baseUrl = request.baseUrl.split('/').slice(0, -1).join('/');

        const { code, state, error, error_description } = request.query;

        if (!code && error) {
            const location = urlJoin(baseUrl, `/?error=${error}&error_description=${error_description}`);
            return response({
                status: 302,
                headers: { location },
            });

        }

        const options = await getSSOSettings(baseUrl);

        const client = await getClient(baseUrl);

        const tokenSet = await client.callback(options.redirect_uri, { code, state }, { state, code_verifier: options.code_verifier });

        console.log('tokenSet', tokenSet);

        const id_token = tokenSet.id_token;
        const token = JSON.parse(Buffer.from(id_token.split('.')[1], 'base64').toString());

        const { email } = token;

        console.log('id_token', token);

        const sessionToken = await authentication.generateSessionToken(email);
        const loggedInPage = config.loggedInPage;
        const location = urlJoin(baseUrl, `/${loggedInPage}?sessionToken=${sessionToken}&state=${state}`);

        return response({
            status: 302,
            headers: { location },
        });
    } catch (error) {
        return reject('getAuth', error);
    }
}