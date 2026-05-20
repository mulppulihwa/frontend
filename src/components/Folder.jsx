import { useState } from 'react';
import './Folder.css';

const Folder = ({ color = '#5227FF', size = 1, items = [], frontContent, className = '' }) => {
  const maxItems = 3;
  const papers = items.slice(0, maxItems);
  while (papers.length < maxItems) papers.push(null);

  const [open, setOpen] = useState(false);
  const [paperOffsets, setPaperOffsets] = useState(Array.from({ length: maxItems }, () => ({ x: 0, y: 0 })));

  const folderBackColor = color;
  const paper1 = '#ffffff';
  const paper2 = '#ffffff';
  const paper3 = '#ffffff';

  const handleClick = () => {
    setOpen(prev => !prev);
    if (open) setPaperOffsets(Array.from({ length: maxItems }, () => ({ x: 0, y: 0 })));
  };

  const handlePaperMouseMove = (e, index) => {
    if (!open) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = (e.clientX - (rect.left + rect.width / 2)) * 0.15;
    const offsetY = (e.clientY - (rect.top + rect.height / 2)) * 0.15;
    setPaperOffsets(prev => {
      const next = [...prev];
      next[index] = { x: offsetX, y: offsetY };
      return next;
    });
  };

  const handlePaperMouseLeave = (_, index) => {
    setPaperOffsets(prev => {
      const next = [...prev];
      next[index] = { x: 0, y: 0 };
      return next;
    });
  };

  return (
    <div style={{ transform: `scale(${size})` }} className={className}>
      <div
        className={`folder${open ? ' open' : ''}`}
        style={{
          '--folder-color': color,
          '--folder-back-color': folderBackColor,
          '--paper-1': paper1,
          '--paper-2': paper2,
          '--paper-3': paper3,
        }}
        onClick={handleClick}
      >
        <div className="folder__back">
          {papers.map((item, i) => (
            <div
              key={i}
              className={`paper paper-${i + 1}`}
              onMouseMove={e => handlePaperMouseMove(e, i)}
              onMouseLeave={e => handlePaperMouseLeave(e, i)}
              style={open ? { '--magnet-x': `${paperOffsets[i]?.x || 0}px`, '--magnet-y': `${paperOffsets[i]?.y || 0}px` } : {}}
            >
              {item}
            </div>
          ))}
          <div className="folder__front" />
          <div className="folder__front right" />
          {frontContent && <div className="folder__mascot">{frontContent}</div>}
        </div>
      </div>
    </div>
  );
};

export default Folder;
