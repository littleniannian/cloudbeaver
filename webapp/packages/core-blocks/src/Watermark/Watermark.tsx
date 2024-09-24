import React, { useEffect, useState } from 'react';

interface WatermarkProps {
  text: string;
  fontSize?: number;
  fontFamily?: string;
  textColor?: string;
  rotate?: number;
  zIndex?: number;
  theme?: 'light' | 'dark';
}

const Watermark: React.FC<WatermarkProps> = ({
  text,
  fontSize = 16,
  fontFamily = 'Arial',
  textColor = 'rgba(0, 0, 0, 0.1)',
  rotate = -45,
  zIndex = 9999,
  theme = 'light',
}) => {
  const [watermarkUrl, setWatermarkUrl] = useState<string>('');

  useEffect(() => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (context) {
      const scale = window.devicePixelRatio;
      canvas.width = 300 * scale;
      canvas.height = 150 * scale;
      context.scale(scale, scale);

      context.font = `${fontSize}px ${fontFamily}`;
      context.fillStyle = theme === 'light' ? textColor : 'rgba(255, 255, 255, 0.1)';
      context.rotate((rotate * Math.PI) / 180);
      context.fillText(text, 0, 100);

      setWatermarkUrl(canvas.toDataURL());
    }
  }, [text, fontSize, fontFamily, textColor, rotate, theme]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex,
        pointerEvents: 'none',
        backgroundImage: `url(${watermarkUrl})`,
        backgroundRepeat: 'repeat',
      }}
    />
  );
};

export default Watermark;
