import { ok, badRequest } from 'wix-http-functions';
import { getAuth } from 'backend/affinidi/auth.js';

export function get_getAuthCallback(request) {
    console.log('callback called');
    return getAuth(request)
        .catch((error) => {
            console.log(error);
            let options = {
                "headers": {
                    "Content-Type": "application/json"
                },
                "body": {
                    "error": error.message
                }
            };
            return badRequest(options);

        });
}