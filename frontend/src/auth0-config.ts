import { Auth0ProviderOptions } from '@auth0/auth0-react';

export const auth0Config: Auth0ProviderOptions = {
  domain: process.env.REACT_APP_AUTH0_DOMAIN!,
  clientId: process.env.REACT_APP_AUTH0_CLIENT_ID!,
  authorizationParams: {
    redirect_uri: window.location.origin,
    audience: process.env.REACT_APP_AUTH0_AUDIENCE,
    scope: 'openid profile email read:posts write:posts read:profile',
  },
};
