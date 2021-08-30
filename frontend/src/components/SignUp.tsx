import React from 'react';
import * as _ from 'lodash';
import { Form, Input, Button, message } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import gql from 'graphql-tag';
import { useMutation } from '@apollo/react-hooks';

import { CURRENT_USER_QUERY } from './App';

const SIGNUP_MUTATION = gql`
    mutation signup($email: String!, $password: String!, $confirmPassword: String!) {
        signup(email: $email, password: $password, confirmPassword: $confirmPassword) {
            id
        }
    }
`;

const SignUp = () => {
    const [email, setEmail] = React.useState<string>();
    const [password, setPassword] = React.useState<string>();
    const [confirmPassword, setConfirmPassword] = React.useState<string>();
    const [resultMessage, setResultMessage] = React.useState<string>();

    const [signup, { loading }] = useMutation(SIGNUP_MUTATION, {
        variables: { email, password, confirmPassword },
        refetchQueries: [{ query: CURRENT_USER_QUERY }]
    });
    return (
        <div className='retain-margin'>
            {resultMessage ? <p>{resultMessage}</p> :
                <Form
                    initialValues={{ remember: true }}
                    onFinish={async () => {
                        if (password !== confirmPassword) {
                            message.error('Passwords did not match');
                        } else {
                            await signup()
                                .then(() => {
                                    setResultMessage(`Please check your email ${email} and click on the link to verify your account.`);
                                })
                                .catch(res => {
                                    _.forEach(res.graphQLErrors, error => message.error(error.message));
                                });
                        }
                    }}
                >
                    <Form.Item
                        name="email"
                        rules={[{ required: true, message: 'Please input your email' }]}
                    >
                        <Input prefix={<MailOutlined className="site-form-item-icon" />} placeholder="E-mail" onChange={(e) => setEmail(e.target.value)} />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        rules={[{ required: true, message: 'Please input your password' }]}
                    >
                        <Input
                            prefix={<LockOutlined className="site-form-item-icon" />}
                            type="password"
                            placeholder="Password"
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </Form.Item>

                    <Form.Item
                        name="confirmPassword"
                        rules={[{ required: true, message: 'Please input your password' }]}
                    >
                        <Input
                            prefix={<LockOutlined className="site-form-item-icon" />}
                            type="password"
                            placeholder="Confirm Password"
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </Form.Item>

                    <Form.Item>
                        <Button disabled={loading} loading={loading} type="primary" htmlType="submit" className="login-form-button">{loading ? "Signing Up" : "Sign Up"}</Button>
                        <div>Have an account? <a href="login">Log In</a></div>
                    </Form.Item>
                </Form>
            }
        </div>
    );
}
export default SignUp;