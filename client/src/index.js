import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import { Auth0Provider } from '@auth0/auth0-react';

const domain = secrets.REACT_APP_AUTH0_DOMAIN;
const clientId = secrets.REACT_APP_AUTH0_CLIENT_ID;

ReactDOM.render(
  <Auth0Provider domain={domain} clientId={clientId} redirectUri={window.location.origin}>
    <App />
  </Auth0Provider>,
  document.getElementById('root')
);
