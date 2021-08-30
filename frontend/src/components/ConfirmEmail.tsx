import React from 'react';
import * as _ from 'lodash';
import { message } from 'antd';
import gql from 'graphql-tag';
import { useMutation } from '@apollo/react-hooks';
import { useHistory } from 'react-router-dom';

import { CURRENT_USER_QUERY } from './App';

const CONFIRM_MUTATION = gql`
  mutation CONFIRM_MUTATION($confirmEmailToken: String!) {
    confirmEmail(confirmEmailToken: $confirmEmailToken) {
        id
        email
        name
    }
  }
`;

const ResetPassword = (props: any) => {
    const history = useHistory();  // FIXME pass this down as react context!
    const params = new URLSearchParams(props.location.search);
    const confirmEmailToken = params.get('confirmEmailToken');

    const [resultMessage, setResultMessage] = React.useState<string>('Confirming email, please wait...');

    const [confirmEmail] = useMutation(CONFIRM_MUTATION, {
        variables: { confirmEmailToken },
        refetchQueries: [{ query: CURRENT_USER_QUERY }]
    });

    React.useEffect(() => {
        const runConfirmEmailMutation = async () => {
            if (!confirmEmailToken) {
                setResultMessage('Confirmation token not found! Please make sure to navigate to this page by clicking on the link that was sent to your email.');
            } else {
                await confirmEmail()
                    .then(() => {
                        setResultMessage('Email successfully verified! Redirecting...');
                        setTimeout(() => {
                            history.push('/products');
                        }, 3000);
                    })
                    .catch(res => {
                        _.forEach(res.graphQLErrors, error => message.error(error.message));
                    });
            }
        }
        runConfirmEmailMutation();
    }, [confirmEmailToken, confirmEmail, history]);

    return (
        <h2>{resultMessage}</h2>
    );
}
export default ResetPassword;