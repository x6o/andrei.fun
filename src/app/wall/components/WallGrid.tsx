'use client';

export function WallGrid() {
  const getInitialState = () => {
    if (typeof window === 'undefined') return {};
    return {
      scale: 1,
      offsetX: window.innerWidth / 2 - 160 / 2,
      offsetY: window.innerHeight / 2 - 160 * 0.876 / 2,
    };
  };

  return (
    <main aria-label="Interactive Grid">
      <div 
        id="grid-container" 
        className="fixed inset-0 overflow-hidden bg-black"
        data-initial-state={JSON.stringify(getInitialState())}
      >
        <div id="grid-wrapper" className="absolute transform-gpu">
          {Array.from({ length: 9 }, (_, i) => {
            const x = (i % 3) - 1;
            const y = Math.floor(i / 3) - 1;
            return (
              <article
                key={`${x},${y}`}
                className="grid-tile absolute"
                data-x={x}
                data-y={y}
                data-high-res="true"
                style={{
                  width: '160px',
                  height: '160px',
                  transform: `translate(${x * (160 + 3.455) + (y % 2 ? (160 + 3.455)/2 : 0)}px, ${y * (160 * 0.876 * 0.876)}px)`,
                }}
              >
                <div className="tile-coordinates opacity-0 hover:opacity-100">
                  {x},{y}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
} 