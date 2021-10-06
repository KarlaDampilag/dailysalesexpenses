import React from 'react';
import { ExclamationCircleOutlined, BellOutlined } from '@ant-design/icons';

interface PropTypes {
    children: any;
    type: 'info' | 'warning';
    title: string;
}

const HighlightParagraph = (props: PropTypes) => {
    return (
        <div className='highlight-paragraph-container'>
            <div>
            <p className='highlight-paragraph-title'><span className='highlight-paragraph-icon'>{props.type === 'warning' ? <ExclamationCircleOutlined /> : <BellOutlined />}</span> {props.title}</p>
            </div>
            {props.children}
        </div>
    )
}

export default HighlightParagraph;