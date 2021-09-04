import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import 'antd/dist/antd.css';
import App from './components/App';
import * as serviceWorker from './serviceWorker';
import { BrowserRouter } from 'react-router-dom';
import ReactGA from 'react-ga';

import { ApolloProvider } from '@apollo/react-hooks';
import { ApolloClient } from 'apollo-client';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { createHttpLink  } from 'apollo-link-http';

const serverURL = process.env.NODE_ENV === 'production' ? process.env.REACT_APP_PROD_API_URL : process.env.REACT_APP_DEV_API_URL;

console.log(process.env.NODE_ENV)
console.log(serverURL)

const httpLink = createHttpLink({
  uri: serverURL,
  credentials: 'include'
});

const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache({
    addTypename: false
  })
});

ReactGA.initialize('UA-89939726-8');
ReactGA.pageview(window.location.pathname + window.location.search);

ReactDOM.render(
  <BrowserRouter>
    <ApolloProvider client={client}>
      <div>
        <App />
      </div>
    </ApolloProvider>
  </BrowserRouter>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.register();
