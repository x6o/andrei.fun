// Grid settings for perfect hexagonal tiling
const tileWidth = 160;
const tileHeight = tileWidth * 0.876; // height = width * sin(60°)
const verticalOffset = tileHeight * 0.876; // Reduce vertical offset to eliminate gaps
const horizontalOffset = tileWidth + 3.455; // Full width for proper spacing
const minZoom = 0.7;
const maxZoom = 2;
const gridSize = 150;
let scale = 1;
let offsetX = 0;
let offsetY = 0;

// Mouse and touch interaction states
let isPanning = false;
let wasPanning = false;
let startX = 0;
let startY = 0;

// Create main container
const container = document.createElement('div');
container.id = 'grid-container';
container.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #000000;
`;
document.body.appendChild(container);

// Add black background to body as well to ensure no white edges
document.body.style.backgroundColor = '#000000';

// Create grid wrapper for transformations
const gridWrapper = document.createElement('div');
gridWrapper.id = 'grid-wrapper';
gridWrapper.style.cssText = `
    position: absolute;
    transform-origin: 0 0;
`;
container.appendChild(gridWrapper);

// Image cache and tile tracking
const imageCache = {};
const visibleTiles = new Set();
let hoveredTile = null;

// Update center area size
const centerAreaSize = tileWidth * 2;

// Add CSS for loader to the document
const styleSheet = document.createElement("style");
styleSheet.textContent = `
    .loader {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 24px;
        height: 24px;
        margin: -12px 0 0 -12px;
        border: 3px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top-color: #fff;
        animation: spin 1s ease-in-out infinite;
        pointer-events: none;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    .fullscreen-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0);
        transition: background-color 0.3s ease;
        z-index: 1000;
        display: flex;
        pointer-events: none;
    }

    .fullscreen-image-container {
        flex: 1;
        position: relative;
        overflow: hidden;
        pointer-events: auto;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .fullscreen-image {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
    }

    .social-sidebar {
        width: 285px;
        background: white;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        padding: 20px;
        box-sizing: border-box;
        overflow-y: auto;
        pointer-events: auto;
    }

    .social-sidebar.visible {
        transform: translateX(0);
    }

    .author-profile {
        display: flex;
        align-items: center;
        margin-bottom: 20px;
    }

    .author-avatar {
        width: 50px;
        height: 50px;
        border-radius: 25px;
        margin-right: 15px;
        background-size: cover;
    }

    .author-info {
        flex: 1;
    }

    .author-name {
        font-weight: bold;
        margin-bottom: 5px;
    }

    .author-username {
        color: #666;
    }

    .like-section {
        display: flex;
        align-items: center;
        margin-bottom: 20px;
        padding: 10px 0;
        border-bottom: 1px solid #eee;
    }

    .like-button {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        padding: 5px 10px;
        margin-right: 10px;
    }

    .comments-section {
        margin-bottom: 20px;
    }

    .comment {
        margin-bottom: 15px;
        padding-bottom: 15px;
        border-bottom: 1px solid #eee;
    }

    .comment-author {
        font-weight: bold;
        margin-bottom: 5px;
    }

    .comment-text {
        color: #333;
    }

    .add-comment {
        position: relative;
    }

    .comment-input {
        width: 100%;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
        resize: none;
        box-sizing: border-box;
    }

    .post-button {
        position: absolute;
        right: 10px;
        bottom: 10px;
        background: #0095f6;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 5px 10px;
        cursor: pointer;
    }

    .post-button:disabled {
        background: #b2dffc;
        cursor: default;
    }

    .grid-tile {
        position: absolute;
        width: ${tileWidth}px;
        height: ${tileWidth}px;
        cursor: pointer;
        transition: transform 0.2s ease, filter 0.2s ease;
        clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
        background-color: #000000;
        background-size: cover;
        background-position: center;
        overflow: visible;
    }

    .grid-tile:hover {
        filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.8));
        z-index: 1;
    }

    .center-area {
        position: absolute;
        width: ${centerAreaSize}px;
        height: ${centerAreaSize}px;
        left: 50%;
        top: 50%;
        transform: translate(-25%, -25%);
        background: #000000;
        border-radius: 50%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 2;
        color: white;
        text-align: center;
        border: 2px solid rgba(255, 255, 255, 0.2);
        pointer-events: none;
    }

    .center-logo {
        font-size: 36px;
        margin-bottom: 15px;
    }

    .center-slogan {
        font-size: 18px;
        max-width: 80%;
        line-height: 1.4;
    }

    #resetButton {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.85);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 20px;
        padding: 8px 20px 8px 16px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.3s ease;
        opacity: 0;
        pointer-events: none;
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 6px;
    }

    #resetButton:hover {
        background: rgba(0, 0, 0, 0.95);
        border-color: rgba(255, 255, 255, 0.3);
    }

    #resetButton.visible {
        opacity: 1;
        pointer-events: auto;
    }

    #resetButton svg {
        width: 14px;
        height: 14px;
        fill: currentColor;
    }

    .tile-loader {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 40px;
        height: 40px;
        border: 3px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top-color: #fff;
        animation: spin 1s linear infinite;
        z-index: 2;
    }

    @keyframes spin {
        to {
            transform: translate(-50%, -50%) rotate(360deg);
        }
    }

    .grid-tile.loading::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 1;
    }

    .tile-coordinates {
        position: absolute;
        bottom: 8px;
        left: 50%;
        transform: translateX(-50%);
        color: rgba(255, 255, 255, 0.6);
        font-size: 12px;
        font-family: monospace;
        pointer-events: none;
        z-index: 1;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
        background: rgba(0, 0, 0, 0.3);
        padding: 2px 6px;
        border-radius: 4px;
    }

    .grid-tile:hover .tile-coordinates {
        color: rgba(255, 255, 255, 0.9);
    }
`;
document.head.appendChild(styleSheet);

// Create a Web Worker for image loading
const workerCode = `
    const imageCache = {};
    
    self.onmessage = function(e) {
        const { x, y, highRes, key } = e.data;
        const imgSrc = highRes 
            ? \`https://picsum.photos/seed/\${x}_\${y}/1600/1600.jpg\`
            : \`https://picsum.photos/seed/\${x}_\${y}/160/160.jpg\`;

        //const imgSrc = highRes 
        //    ? \`https://fakeimg.pl/1600x900\`
        //    : \`https://fakeimg.pl/160x90\`;

        if (imageCache[key]) {
            self.postMessage({ key, imgSrc: imageCache[key], status: 'cached' });
            return;
        }

        fetch(imgSrc)
            .then(response => response.blob())
            .then(blob => {
                const imgUrl = URL.createObjectURL(blob);
                imageCache[key] = imgUrl;
                self.postMessage({ key, imgSrc: imgUrl, status: 'loaded' });
            })
            .catch(error => {
                self.postMessage({ key, error: error.message, status: 'error' });
            });
    };
`;

const workerBlob = new Blob([workerCode], { type: 'application/javascript' });
const worker = new Worker(URL.createObjectURL(workerBlob));

// Add function to get image key that includes resolution
function getImageKey(x, y) {
    const isHighDefImage = scale > 1.5;
    return `${x},${y},${isHighDefImage ? "1" : "0"}`;
}

// Create and add center area to the grid wrapper
const centerArea = document.createElement('div');
centerArea.className = 'center-area';
centerArea.innerHTML = `
    <div class="center-logo">GridScape™</div>
    <div class="center-slogan">Text text text<br>More text</div>
`;
gridWrapper.appendChild(centerArea);

function isWithinCenterArea(x, y) {
    // Convert grid coordinates to pixel coordinates
    const pixelX = x * horizontalOffset + (y % 2 ? horizontalOffset/2 : 0);
    const pixelY = y * verticalOffset;
    
    // Calculate distance from grid center
    const dx = pixelX;
    const dy = pixelY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Return true if within center area radius
    return distance < centerAreaSize * 0.75;
}

function createTile(x, y) {
    // Skip tiles that would be in the center area
    if (isWithinCenterArea(x, y)) {
        return null;
    }

    const tile = document.createElement('div');
    tile.className = 'grid-tile';
    tile.dataset.x = x;
    tile.dataset.y = y;
    tile.dataset.highRes = 'false'; // Track if high-res is loaded

    // Add coordinates display
    const coordinates = document.createElement('div');
    coordinates.className = 'tile-coordinates';
    coordinates.textContent = `${x},${y}`;
    tile.appendChild(coordinates);

    // Calculate position for perfect hexagonal tiling
    const xPos = x * horizontalOffset + (y % 2 ? horizontalOffset/2 : 0);
    const yPos = y * verticalOffset;

    tile.style.cssText = `
        position: absolute;
        width: ${tileWidth}px;
        height: ${tileWidth}px;
        left: ${xPos}px;
        top: ${yPos}px;
        transition: transform 0.2s ease, filter 0.2s ease;
    `;

    tile.addEventListener('mouseenter', () => {
        hoveredTile = { x, y };
        tile.style.transform = 'scale(1.2)';
        tile.style.zIndex = '1';
        tile.style.filter = 'drop-shadow(0 0 20px rgba(255, 255, 255, 0.8))';
    });

    tile.addEventListener('mouseleave', () => {
        hoveredTile = null;
        tile.style.transform = 'scale(1)';
        tile.style.zIndex = '0';
        tile.style.filter = 'none';
    });

    return tile;
}

// Update image loading function for tiles
function loadImage(tile, x, y, forceHighRes = false) {
    const img = new Image();
    
    img.onload = () => {
        tile.style.backgroundImage = `url(${img.src})`;
    };
    
    // Determine if we should load high-res based on current scale
    const shouldLoadHighRes = forceHighRes || scale > 1.5;
    
    // Switch to high-res
    if (shouldLoadHighRes && tile.dataset.highRes === 'false') {
        img.src = `https://fakeimg.pl/1600x1600`;
        tile.dataset.highRes = 'true';
    } 
    // Switch back to low-res
    else if (!shouldLoadHighRes && tile.dataset.highRes === 'true') {
        img.src = `https://fakeimg.pl/600x600`;
        tile.dataset.highRes = 'false';
    }
    // Initial low-res load
    else if (!shouldLoadHighRes && tile.dataset.highRes === 'false') {
        img.src = `https://fakeimg.pl/600x600`;
    }
}

// Handle worker responses
worker.onmessage = function(e) {
    const { key, imgSrc, status, error } = e.data;
    
    // Find all tiles waiting for this image
    const tiles = document.querySelectorAll(`[data-loading="${key}"]`);
    
    tiles.forEach(tile => {
        if (status === 'loaded' || status === 'cached') {
            tile.style.backgroundImage = `url(${imgSrc})`;
            tile.style.backgroundSize = 'cover';
            
            // Remove loader if it exists
            const loader = tile.querySelector('.loader');
            if (loader) {
                tile.removeChild(loader);
            }
        } else if (status === 'error') {
            console.error(`Failed to load image for tile ${key}: ${error}`);
            
            // Remove loader if it exists
            const loader = tile.querySelector('.loader');
            if (loader) {
                tile.removeChild(loader);
            }
        }
        
        delete tile.dataset.loading;
    });
};

function updateVisibleTiles() {
    const buffer = Math.max(3, Math.ceil(4 / scale));
    
    // Calculate viewport center in grid coordinates
    const centerX = (-offsetX / scale + window.innerWidth / 2 / scale) / horizontalOffset;
    const centerY = (-offsetY / scale + window.innerHeight / 2 / scale) / verticalOffset;
    
    // Adjust calculations for tighter hexagonal grid
    const startX = Math.floor((-offsetX / scale) / horizontalOffset) - buffer;
    const endX = Math.ceil((window.innerWidth - offsetX) / (scale * horizontalOffset)) + buffer;
    const startY = Math.floor((-offsetY / scale) / verticalOffset) - buffer;
    const endY = Math.ceil((window.innerHeight - offsetY) / (scale * verticalOffset)) + buffer;

    // Collect all tiles that need to be loaded
    const tilesToLoad = [];
    const currentTiles = new Set();

    for (let x = startX; x <= endX; x++) {
        for (let y = startY; y <= endY; y++) {
            const key = `${x},${y}`;
            currentTiles.add(key);

            if (!visibleTiles.has(key)) {
                const tile = createTile(x, y);
                if (tile) {
                    gridWrapper.appendChild(tile);
                    visibleTiles.add(key);
                    
                    // Calculate distance from center for loading priority
                    const dx = x - centerX;
                    const dy = y - centerY;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    tilesToLoad.push({ tile, x, y, distance });
                }
            } else {
                // Check existing tiles for resolution update if needed
                const tile = gridWrapper.querySelector(`[data-x="${x}"][data-y="${y}"]`);
                if (tile && scale > 1.5 && tile.dataset.highRes === 'false') {
                    loadImage(tile, x, y, true);
                }
            }
        }
    }

    // Remove tiles that are no longer visible
    for (const key of visibleTiles) {
        if (!currentTiles.has(key)) {
            const [x, y] = key.split(',');
            const tile = gridWrapper.querySelector(`[data-x="${x}"][data-y="${y}"]`);
            if (tile) {
                gridWrapper.removeChild(tile);
            }
            visibleTiles.delete(key);
        }
    }

    // Update grid wrapper transform only - center area will transform with it
    gridWrapper.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;

    // Sort tiles by distance from center before loading
    tilesToLoad.sort((a, b) => a.distance - b.distance);

    // Load images in the background, starting from center
    requestIdleCallback(() => {
        tilesToLoad.forEach(({ tile, x, y }) => {
            loadImage(tile, x, y);
        });
    }, { timeout: 1000 });

    // Update button visibility
    updateButtonVisibility();
}

// Mouse panning functionality
container.addEventListener('mousedown', (e) => {
    isPanning = true;
    wasPanning = false;
    startX = e.clientX;
    startY = e.clientY;
    container.style.cursor = 'grabbing';
});

container.addEventListener('mousemove', (e) => {
    if (isPanning) {
        wasPanning = true;
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        offsetX += deltaX;
        offsetY += deltaY;
        startX = e.clientX;
        startY = e.clientY;
        updateVisibleTiles();
    }
});

container.addEventListener('mouseup', () => {
    isPanning = false;
    container.style.cursor = 'default';
});

container.addEventListener('mouseleave', () => {
    isPanning = false;
    container.style.cursor = 'default';
});

// Touch handling variables
let lastTouchDistance = 0;
let isTouching = false;
let wasTouching = false;

// Update touch handlers
let touchStartTime = 0;
let touchStartX = 0;
let touchStartY = 0;

container.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
        isTouching = true;
        wasTouching = false;
        touchStartTime = Date.now();
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        
        const touch = e.touches[0];
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        if (element && element.classList.contains('grid-tile')) {
            const x = parseInt(element.dataset.x);
            const y = parseInt(element.dataset.y);
            hoveredTile = { x, y };
            element.style.transform = 'scale(1.2)';
            element.style.zIndex = '1';
            element.style.filter = 'drop-shadow(0 5px 15px rgba(0,0,0,0.3))';
        }
    } else if (e.touches.length === 2) {
        lastTouchDistance = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
        );
    }
    e.preventDefault();
}, { passive: false });

container.addEventListener('touchmove', (e) => {
    if (!isTouching) return;
    wasTouching = true;

    if (e.touches.length === 1) {
        // Handle panning
        const deltaX = e.touches[0].clientX - startX;
        const deltaY = e.touches[0].clientY - startY;
        
        offsetX += deltaX;
        offsetY += deltaY;
        
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
        // Handle pinch zooming
        const currentDistance = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
        );
        
        if (lastTouchDistance > 0) {
            // Calculate center of pinch
            const touchCenter = {
                x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
                y: (e.touches[0].clientY + e.touches[1].clientY) / 2
            };
            
            // Calculate zoom
            const wasHighRes = scale > 1.5;
            const zoomDelta = currentDistance / lastTouchDistance;
            const prevScale = scale;
            scale = Math.min(Math.max(scale * zoomDelta, minZoom), maxZoom);
            
            // Adjust offset to zoom around pinch center
            const mouseX = (touchCenter.x - offsetX) / prevScale;
            const mouseY = (touchCenter.y - offsetY) / prevScale;
            offsetX = touchCenter.x - mouseX * scale;
            offsetY = touchCenter.y - mouseY * scale;

            // Check if we crossed the high-res threshold
            const isHighRes = scale > 1.5;
            if (wasHighRes !== isHighRes) {
                for (const key of visibleTiles) {
                    const [x, y] = key.split(',');
                    const tile = gridWrapper.querySelector(`[data-x="${x}"][data-y="${y}"]`);
                    if (tile) {
                        loadImage(tile, parseInt(x), parseInt(y));
                    }
                }
            }
        }
        
        lastTouchDistance = currentDistance;
    }
    
    updateVisibleTiles();
    e.preventDefault();
}, { passive: false });

container.addEventListener('touchend', (e) => {
    const touchEndTime = Date.now();
    const touchDuration = touchEndTime - touchStartTime;
    
    // Calculate touch movement
    const touch = e.changedTouches[0];
    const deltaX = Math.abs(touch.clientX - touchStartX);
    const deltaY = Math.abs(touch.clientY - touchStartY);
    const maxMovement = 10; // pixels

    // If it was a short tap without much movement, trigger the fullscreen view
    if (touchDuration < 300 && deltaX < maxMovement && deltaY < maxMovement && hoveredTile && !wasTouching) {
        const element = gridWrapper.querySelector(`[data-x="${hoveredTile.x}"][data-y="${hoveredTile.y}"]`);
        if (element) {
            // Reset the hover effect
            element.style.transform = 'scale(1)';
            element.style.zIndex = '0';
            element.style.filter = 'none';
            
            // Simulate click to open fullscreen
            const { x, y } = hoveredTile;
            element.classList.add('loading');
            const loader = document.createElement('div');
            loader.className = 'tile-loader';
            element.appendChild(loader);

            const highResImage = new Image();
            highResImage.onload = () => {
                element.classList.remove('loading');
                element.removeChild(loader);
                showFullscreenImage(element, x, y);
            };
            highResImage.src = `https://fakeimg.pl/1600x1600`;
        }
    } else if (!wasTouching && hoveredTile) {
        const element = gridWrapper.querySelector(`[data-x="${hoveredTile.x}"][data-y="${hoveredTile.y}"]`);
        if (element) {
            element.style.transform = 'scale(1)';
            element.style.zIndex = '0';
            element.style.filter = 'none';
        }
    }
    
    if (e.touches.length === 0) {
        isTouching = false;
        hoveredTile = null;
    }
});

// Click/tap handler
container.addEventListener('click', (e) => {
    if (wasPanning || wasTouching) {
        wasPanning = false;
        wasTouching = false;
        return;
    }

    if (hoveredTile) {
        const { x, y } = hoveredTile;
        
        // Get the clicked tile
        const tile = gridWrapper.querySelector(`[data-x="${x}"][data-y="${y}"]`);
        
        // Add loading state to tile
        tile.classList.add('loading');
        const loader = document.createElement('div');
        loader.className = 'tile-loader';
        tile.appendChild(loader);

        // Load high-res image
        const highResImage = new Image();
        highResImage.onload = () => {
            // Remove loading state
            tile.classList.remove('loading');
            tile.removeChild(loader);

            // Create and show fullscreen view
            showFullscreenImage(tile, x, y);
        };
        highResImage.src = `https://fakeimg.pl/1600x1600`;
    }
});

// Separate function for showing fullscreen view
function showFullscreenImage(tile, x, y) {
    const tileRect = tile.getBoundingClientRect();

    const fullscreenContainer = document.createElement('div');
    fullscreenContainer.className = 'fullscreen-container';

    const imageContainer = document.createElement('div');
    imageContainer.className = 'fullscreen-image-container';

    const fullscreenImage = document.createElement('img');
    fullscreenImage.className = 'fullscreen-image';
    
    // Use 1600x1600 for fullscreen view
    fullscreenImage.src = `https://fakeimg.pl/1600x1600`;
    
    fullscreenImage.style.cssText = `
        position: absolute;
        width: 1600px;
        height: 1600px;
        transform-origin: 0 0;
        transition: none;
    `;

    // Create sidebar with coordinates
    const sidebar = document.createElement('div');
    sidebar.className = 'social-sidebar';
    sidebar.innerHTML = `
        <div class="author-profile">
            <div class="author-avatar" style="background-image: url('https://picsum.photos/50/50')"></div>
            <div class="author-info">
                <div class="author-name">John Doe</div>
                <div class="author-username">@johndoe</div>
            </div>
        </div>
        <div class="coordinates-section" style="padding: 10px 0; margin-bottom: 15px; border-bottom: 1px solid #eee;">
            <div style="font-family: monospace; color: #666;">
                Coordinates: (${x}, ${y})
            </div>
        </div>
        <div class="like-section">
            <button class="like-button">❤️</button>
            <span class="like-count">1,234 likes</span>
        </div>
        <div class="comments-section">
            <div class="comment">
                <div class="comment-author">alice_smith</div>
                <div class="comment-text">Beautiful shot! Love the composition.</div>
            </div>
            <div class="comment">
                <div class="comment-author">photo_enthusiast</div>
                <div class="comment-text">The lighting in this is perfect!</div>
            </div>
        </div>
        <div class="add-comment">
            <textarea class="comment-input" placeholder="Add a comment..." rows="3"></textarea>
            <button class="post-button" disabled>Post</button>
        </div>
    `;

    imageContainer.appendChild(fullscreenImage);
    fullscreenContainer.appendChild(imageContainer);
    fullscreenContainer.appendChild(sidebar);
    document.body.appendChild(fullscreenContainer);

    // Calculate and set initial position
    const initialScale = tileRect.width / 1600;
    fullscreenImage.style.transform = `
        translate(${tileRect.left}px, ${tileRect.top}px) 
        scale(${initialScale})
    `;

    // Force reflow
    fullscreenImage.offsetHeight;

    // Start transition to fullscreen
    fullscreenImage.style.transition = 'transform 0.3s linear';
    requestAnimationFrame(() => {
        fullscreenContainer.style.backgroundColor = 'rgba(0,0,0,0.9)';
        
        const containerWidth = window.innerWidth - 285;
        const containerHeight = window.innerHeight;
        const targetScale = Math.min(
            containerWidth / 1600,
            containerHeight / 1600
        );
        const targetX = (containerWidth - 1600 * targetScale) / 2;
        const targetY = (containerHeight - 1600 * targetScale) / 2;

        fullscreenImage.style.transform = `
            translate(${targetX}px, ${targetY}px) 
            scale(${targetScale})
        `;
        sidebar.classList.add('visible');
    });

    // Add comment input functionality
    const commentInput = sidebar.querySelector('.comment-input');
    const postButton = sidebar.querySelector('.post-button');
    
    commentInput.addEventListener('input', () => {
        postButton.disabled = !commentInput.value.trim();
    });

    // Like button functionality
    const likeButton = sidebar.querySelector('.like-button');
    const likeCount = sidebar.querySelector('.like-count');
    let isLiked = false;
    
    likeButton.addEventListener('click', () => {
        isLiked = !isLiked;
        likeButton.textContent = isLiked ? '❤️' : '🤍';
        likeCount.textContent = isLiked ? '1,235 likes' : '1,234 likes';
    });

    // Close on image click with reverse animation
    imageContainer.addEventListener('click', () => {
        const currentTile = gridWrapper.querySelector(`[data-x="${x}"][data-y="${y}"]`);
        const currentTileRect = currentTile.getBoundingClientRect();
        const finalScale = currentTileRect.width / 1600;

        // Reset the absolute positioning and dimensions for the closing animation
        fullscreenImage.style.position = 'absolute';
        fullscreenImage.style.width = '1600px';
        fullscreenImage.style.height = '1600px';
        
        sidebar.classList.remove('visible');
        fullscreenContainer.style.backgroundColor = 'rgba(0,0,0,0)';
        fullscreenImage.style.transform = `
            translate(${currentTileRect.left}px, ${currentTileRect.top}px) 
            scale(${finalScale})
        `;

        setTimeout(() => {
            document.body.removeChild(fullscreenContainer);
        }, 300);
    });
}

// Create reset button with center icon
const resetButton = document.createElement('button');
resetButton.id = 'resetButton';
resetButton.innerHTML = `
<?xml version="1.0" encoding="utf-8"?><svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="122.88px" height="122.88px" viewBox="0 0 122.88 122.88" enable-background="new 0 0 122.88 122.88" xml:space="preserve"><g><path fill-rule="evenodd" clip-rule="evenodd" d="M61.438,0c33.938,0,61.442,27.509,61.442,61.442S95.375,122.88,61.438,122.88 C27.509,122.88,0,95.376,0,61.442S27.509,0,61.438,0L61.438,0z M61.442,43.027c10.17,0,18.413,8.245,18.413,18.416 c0,10.17-8.243,18.413-18.413,18.413c-10.171,0-18.416-8.243-18.416-18.413C43.026,51.272,51.271,43.027,61.442,43.027 L61.442,43.027z M61.438,18.389c23.778,0,43.054,19.279,43.054,43.054s-19.275,43.049-43.054,43.049 c-23.77,0-43.049-19.274-43.049-43.049S37.668,18.389,61.438,18.389L61.438,18.389z"/></g></svg>
    Go to center
`;
document.body.appendChild(resetButton);

// Function to check if view is centered
function isViewCentered() {
    const targetOffsetX = window.innerWidth / 2 - tileWidth / 2;
    const targetOffsetY = window.innerHeight / 2 - tileHeight / 2;
    const targetScale = 1;

    // Calculate percentage offset from center (10% of screen dimensions)
    const toleranceX = window.innerWidth * 0.40;
    const toleranceY = window.innerHeight * 0.40;
    const toleranceScale = 0.3; // 30% scale difference
    
    return Math.abs(offsetX - targetOffsetX) < toleranceX &&
           Math.abs(offsetY - targetOffsetY) < toleranceY &&
           Math.abs(scale - targetScale) < toleranceScale;
}

// Function to update button visibility
function updateButtonVisibility() {
    if (isViewCentered()) {
        resetButton.classList.remove('visible');
    } else {
        resetButton.classList.add('visible');
    }
}

// Reset button functionality
resetButton.addEventListener('click', () => {
    const targetOffsetX = window.innerWidth / 2 - tileWidth / 2;
    const targetOffsetY = window.innerHeight / 2 - tileHeight / 2;
    const targetScale = 1;

    // Store starting positions
    const startOffsetX = offsetX;
    const startOffsetY = offsetY;
    const startScale = scale;

    // Animation settings
    const duration = 250;
    const startTime = performance.now();

    function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);

        // Interpolate values
        offsetX = startOffsetX + (targetOffsetX - startOffsetX) * easeProgress;
        offsetY = startOffsetY + (targetOffsetY - startOffsetY) * easeProgress;
        scale = startScale + (targetScale - startScale) * easeProgress;

        // Update the grid
        updateVisibleTiles();

        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    }

    requestAnimationFrame(animate);
});

// Initial button visibility check
updateButtonVisibility();

// Mouse wheel zoom
container.addEventListener('wheel', (e) => {
    e.preventDefault();
    
    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const gridX = (mouseX - offsetX) / scale;
    const gridY = (mouseY - offsetY) / scale;

    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.min(Math.max(scale * delta, minZoom), maxZoom);
    
    // Only proceed if the new scale is within bounds
    if (newScale !== scale && newScale >= minZoom && newScale <= maxZoom) {
        // Check if we're crossing the resolution threshold
        const wasAboveThreshold = scale > 1.5;
        const isAboveThreshold = newScale > 1.5;
        
        scale = newScale;
        
        offsetX = mouseX - gridX * scale;
        offsetY = mouseY - gridY * scale;
        
        updateGridTransform();
        
        // If we crossed the threshold, force resolution update for all visible tiles
        if (wasAboveThreshold !== isAboveThreshold) {
            const visibleTileElements = gridWrapper.querySelectorAll('.grid-tile');
            visibleTileElements.forEach(tile => {
                const x = parseInt(tile.dataset.x);
                const y = parseInt(tile.dataset.y);
                loadImage(tile, x, y, isAboveThreshold);
            });
        }
        
        updateVisibleTiles();
    }
});

// Function to center the viewport
function centerViewport() {
    // Calculate center position
    offsetX = window.innerWidth / 2 - tileWidth / 2;
    offsetY = window.innerHeight / 2 - tileHeight / 2;
    scale = 1;
    
    // Update the transform
    gridWrapper.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
    
    // Update visible tiles
    updateVisibleTiles();
}

// Call centerViewport immediately after creating the grid
centerViewport();

// Also handle window resize
window.addEventListener('resize', centerViewport);

// Add load event listener as backup
window.addEventListener('load', centerViewport);

// Add the updateGridTransform function
function updateGridTransform() {
    // Ensure scale is within bounds before applying transform
    const boundedScale = Math.min(Math.max(scale, minZoom), maxZoom);
    gridWrapper.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${boundedScale})`;
}

// Initialize grid with proper bounds
scale = Math.min(Math.max(scale, minZoom), maxZoom);
container.style.cursor = 'grab';
updateGridTransform();
updateVisibleTiles();
