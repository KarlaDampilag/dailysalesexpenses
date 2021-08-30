import React from 'react';

const withWindowDimension = (WrappedComponent: React.ComponentType<any>) => (props: any) => {
    const [width, setWidth] = React.useState<number>(window.innerWidth);

    const updateDimensions = () => {
        setWidth(window.innerWidth);
    }

    React.useEffect(() => {
        window.addEventListener("resize", updateDimensions);
        return () => window.removeEventListener("resize", updateDimensions);
    }, []);

    return (
        <WrappedComponent
            {...props}
            windowWidth={width}
        />
    );
}

export default withWindowDimension;
