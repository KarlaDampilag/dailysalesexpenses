import React from 'react';
import * as _ from 'lodash';
import { Form, Input, Button, message } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import gql from 'graphql-tag';
import { useMutation } from '@apollo/react-hooks';
import { useHistory } from 'react-router-dom';

import { CURRENT_USER_QUERY } from './App';

const RESET_MUTATION = gql`
  mutation RESET_MUTATION($resetToken: String!, $password: String!, $confirmPassword: String!) {
    resetPassword(resetToken: $resetToken, password: $password, confirmPassword: $confirmPassword) {
        id
        email
        name
    }
  }
`;

const ResetPassword = (props: any) => {
    const history = useHistory();  // FIXME pass this down as react context!
    const [newPassword, setNewPassword] = React.useState<string>();
    const [confirmPassword, setConfirmPassword] = React.useState<string>();
    const [resultMessage, setResultMessage] = React.useState<string>();
    const params = new URLSearchParams(props.location.search);
    const resetToken = params.get('resetToken');

    if (!resetToken) {
        history.push('/requestResetPassword');
    }

    const [resetPassword, { loading }] = useMutation(RESET_MUTATION, {
        variables: { resetToken, password: newPassword, confirmPassword },
        refetchQueries: [{ query: CURRENT_USER_QUERY }]
    });

    return (
        <>
            {resultMessage ? <p>{resultMessage}</p> :
                <>
                    <h2>Enter your new password:</h2>
                    <Form
                        initialValues={{ remember: true }}
                        onFinish={async () => {
                            if (newPassword !== confirmPassword) {
                                message.error('Passwords did not match');
                            } else {
                                await resetPassword()
                                    .then(() => {
                                        setResultMessage('Password successfully changed! Redirecting...');
                                        setTimeout(() => {
                                            history.push('/');
                                        }, 3000);
                                    })
                                    .catch(res => {
                                        _.forEach(res.graphQLErrors, error => message.error(error.message));
                                    });
                            }
                        }}
                    >
                        <Form.Item
                            name="newPassword"
                            rules={[{ required: true, message: 'Please input your new password' }]}
                        >
                            <Input
                                prefix={<LockOutlined className="site-form-item-icon" />}
                                type="password"
                                placeholder="New Password"
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                        </Form.Item>

                        <Form.Item
                            name="confirmPassword"
                            rules={[{ required: true, message: 'Please confirm your new password' }]}
                        >
                            <Input
                                prefix={<LockOutlined className="site-form-item-icon" />}
                                type="password"
                                placeholder="Confirm New Password"
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </Form.Item>

                        <Form.Item>
                            <Button disabled={loading} loading={loading} type="primary" htmlType="submit" className="login-form-button">{loading ? "Processing" : "Reset"}</Button>
                        </Form.Item>
                    </Form>
                </>
            }
        </>
    );
}
export default ResetPassword;