import React from 'react';
import * as _ from 'lodash';
import { Form, Input, Button, message } from 'antd';
import { MailOutlined } from '@ant-design/icons';
import gql from 'graphql-tag';
import { useMutation } from '@apollo/react-hooks';

import { CURRENT_USER_QUERY } from './App';

const REQUEST_RESET_MUTATION = gql`
  mutation REQUEST_RESET_MUTATION($email: String!) {
    requestReset(email: $email) {
        id
    }
  }
`;

const RequestResetPassword = () => {
    const [email, setEmail] = React.useState<string>();
    const [resultMessage, setResultMessage] = React.useState<string>();

    const [requestReset, { loading }] = useMutation(REQUEST_RESET_MUTATION, {
        variables: { email },
        refetchQueries: [{ query: CURRENT_USER_QUERY }]
    });
    return (
        <div className='retain-margin'>
            {resultMessage ? <p>{resultMessage}</p> :
                <>
                    <h2>Request a password reset</h2>
                    <Form
                        initialValues={{ remember: true }}
                        onFinish={async () => {
                            await requestReset()
                                .then(() => {
                                    setResultMessage('Successfully sent! Please check your email for a reset link - THIS LINK WILL EXPIRE IN ONE HOUR.');
                                })
                                .catch(res => {
                                    _.forEach(res.graphQLErrors, error => message.error(error.message));
                                });
                        }}
                    >
                        <Form.Item
                            name="email"
                            rules={[{ required: true, message: 'Please input your email' }]}
                        >
                            <Input prefix={<MailOutlined className="site-form-item-icon" />} placeholder="E-mail" onChange={(e) => setEmail(e.target.value)} />
                        </Form.Item>

                        <Form.Item>
                            <Button disabled={loading} loading={loading} type="primary" htmlType="submit" className="login-form-button">{loading ? "Sending request" : "Reset"}</Button>
                        </Form.Item>
                    </Form>
                </>
            }
        </div>
    );
}
export default RequestResetPassword;