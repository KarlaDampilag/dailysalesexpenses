import React from 'react';
import _ from 'lodash';
import { Button, Modal } from 'antd';
import { CloseCircleTwoTone } from '@ant-design/icons';

interface PropTypes {
    title: string,
    messages: string[],
    visible: boolean,
    onClose: () => void
}

const ErrorNotificationModal = (props: PropTypes) => {
    return (
        <Modal
                visible={props.visible}
                className='import-error-modal'
                footer={[
                    <Button onClick={props.onClose} key='ok-btn'>OK</Button>
                ]}
            >
                <div className='import-error-modal-container'>
                    <CloseCircleTwoTone style={{ fontSize: '20pt', marginRight: '10px' }} twoToneColor="#ff3318" />
                    <span><b>{props.title}</b></span>
                </div>
                {
                    _.map(props.messages, (message, key) => (
                        <p key={key}>{message}</p>
                    ))
                }
                <p>If you're having trouble uploading your csv file, please contact <a href='mailto:hello@dailysalesexpensesapp.com'>hello@dailysalesexpensesapp.com</a> - we'll be happy to assist you :)</p>
            </Modal>
    );
}

export default ErrorNotificationModal;