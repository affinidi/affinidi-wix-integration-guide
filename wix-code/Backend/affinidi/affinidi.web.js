
import { getAuthUrl } from './auth.js';
import { reject, getUrl } from 'public/affinidi/util.js';

import { Permissions, webMethod } from "wix-web-module";

export const generateAuthUrl = webMethod(
  Permissions.Anyone, 
  async (baseUrl) => { 
     try {
        const response = await getAuthUrl(baseUrl);
        return response;
    } catch (error) {
        return reject('generateAuthUrl', error);
    }
  }
);
