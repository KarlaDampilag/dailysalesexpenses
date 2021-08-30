import React from 'react';
import { Spin } from 'antd';

const CustomSpin = () => (
    <div style={{ 'textAlign': 'center', 'marginTop': '35px' }}>
        <Spin tip='Loading...' size='large' />
    </div>
);
export default CustomSpin;