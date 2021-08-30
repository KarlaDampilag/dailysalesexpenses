import React from 'react';
import { Button } from 'antd';
import gql from 'graphql-tag';
import { useMutation } from '@apollo/react-hooks';
import { useHistory } from 'react-router-dom';

import { CURRENT_USER_QUERY } from './App';

const SIGN_OUT_MUTATION = gql`
    mutation logout {
        logout
    }
`;

const LogoutButton = () => {
    const history = useHistory();  // FIXME pass this down as react context!
    const [logout] = useMutation(SIGN_OUT_MUTATION, {
        refetchQueries: [{ query: CURRENT_USER_QUERY }]
    });
    return (
        <Button onClick={() => {
            logout();
            history.push(`/`);
        }}>Logout</Button>
    )
}
export default LogoutButton;