import React from 'react';
import { Switch, Route, withRouter } from 'react-router';
import gql from 'graphql-tag';
import { useQuery } from '@apollo/react-hooks';

import Header from './Header';
import SignUp from './SignUp';
import Login from './Login';
import Products from './Products';
import Inventories from './Inventories';
//import Inventory from './Inventory';
import Customers from './Customers';
import Sales from './Sales';
import Expenses from './Expenses';
import Reports from './Reports';
import RequestResetPassword from './RequestResetPassword';
import ResetPassword from './ResetPassword';
import ConfirmEmail from './ConfirmEmail';
import FeatureBug from './FeatureBug';
import CustomSpin from './CustomSpin';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsConditions from './pages/TermsConditions';
import Csv from './pages/docs/Csv';

const CURRENT_USER_QUERY = gql`
  {
    me {
      id
      email
      verified
      permissions
      name
    }
}
`;

const Page404 = React.memo((props) => (
  <p>Page not found.</p>
));

const userContext = React.createContext({
  id: '',
  email: '',
  verified: false,
  permissions: []
});

function App() {
  const { data, loading } = useQuery(CURRENT_USER_QUERY);
  const user = data ? data.me : null;

  return (
      <userContext.Provider value={user}>
        <div className='app-wrapper'>
          <div className="App">
            <Header user={user} />
            <div className='page-wrapper'>
              {loading ?
                <CustomSpin /> :
                <Switch>
                  <Route exact path="/" component={Reports} />
                  <Route exact path="/signup" component={SignUp} />
                  <Route exact path="/login" component={Login} />
                  <Route exact path="/products" component={Products} />
                  <Route exact path="/inventories" component={Inventories} />
                  {/*<Route exact path="/inventory" component={Inventory} />*/}
                  <Route exact path="/customers" component={Customers} />
                  <Route exact path="/expenses" component={Expenses} />
                  <Route exact path="/sales" component={Sales} />
                  <Route exact path="/requestResetPassword" component={RequestResetPassword} />
                  <Route exact path="/resetPassword" component={ResetPassword} />
                  <Route exact path="/confirmEmail" component={ConfirmEmail} />
                  <Route exact path="/typeform" component={FeatureBug} />
                  <Route exact path="/privacy-policy" component={PrivacyPolicy} />
                  <Route exact path="/terms-conditions" component={TermsConditions} />
                  <Route exact path="/docs/csv" component={Csv} />
                  <Route component={Page404} />
                </Switch>
              }
            </div>
          </div>
        </div>
      </userContext.Provider>
  );
}

export default withRouter(App);
export { userContext };
export { CURRENT_USER_QUERY };