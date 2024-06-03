import React from 'react';

const CustomMarkerRenderer = ({ lat, lng }) => {
  return (
    <div
      className="dot"
      style={{
        position: 'absolute',
        transform: 'translate(-50%, -50%)',
      }}
    />
  );
};

export default CustomMarkerRenderer;