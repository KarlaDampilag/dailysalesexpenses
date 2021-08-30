import React from 'react';
import { Button } from 'antd';
import { DownloadOutlined  } from '@ant-design/icons';
import { ButtonProps } from 'antd/lib/button/button';

interface Properties extends ButtonProps {
    title?: string;
}

const DownloadButton = (props: Properties) => {
    const { title, ...otherProps } = props;
    return (
        <Button
            className='btn-add-margin-left'
            icon={<DownloadOutlined />}
            {...otherProps}
        >
            <span>{props.title ? props.title : 'Download'}</span>
        </Button>
    );
}

export default DownloadButton;