import React from 'react';
import { Popconfirm, Button } from 'antd';

interface PropTypes {
    onDelete: () => void;
    onClick: () => void;
    className?: string;
}
const DeleteButton = (props: PropTypes) => {
    return (
        <Popconfirm
            title="Are you sure to delete? This action is irreversible!"
            okText="Delete"
            cancelText="Cancel"
            onConfirm={props.onDelete}
        >
            <Button onClick={props.onClick} className={props.className}><span aria-label='delete' role='img'>❌</span></Button>
        </Popconfirm>
    )
}
export default DeleteButton;