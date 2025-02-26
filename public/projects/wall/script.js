// Grid settings
const tileWidth = 160;
const tileHeight = 90;
const minZoom = 0.6;
const maxZoom = 4;
const gridSize = 150;
let scale = 1;
let offsetX = window.innerWidth / 2 - tileWidth / 2;
let offsetY = window.innerHeight / 2 - tileHeight / 2;

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
    background: #f0f0f0;
`;
document.body.appendChild(container);

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
        flex-direction: row;
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

    @media (max-width: 768px) {
        .fullscreen-container {
            flex-direction: column;
        }

        .fullscreen-image-container {
            height: 60%;
            min-height: 300px;
        }

        .social-sidebar {
            width: 100%;
            height: 40%;
            transform: translateY(100%);
        }

        .social-sidebar.visible {
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(styleSheet);

// Create a Web Worker for image loading
const workerCode = `
    const imageCache = {};
    
    self.onmessage = function(e) {
        const { x, y, highRes, key } = e.data;
        const imgSrc = highRes 
            ? \`https://picsum.photos/seed/\${x}_\${y}/1600/900.jpg\`
            : \`https://picsum.photos/seed/\${x}_\${y}/160/90.jpg\`;
            
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

function createTile(x, y) {
    const tile = document.createElement('div');
    tile.className = 'grid-tile';
    tile.dataset.x = x;
    tile.dataset.y = y;
    tile.style.cssText = `
        position: absolute;
        width: ${tileWidth}px;
        height: ${tileHeight}px;
        left: ${x * tileWidth}px;
        top: ${y * tileHeight}px;
        border: 1px solid #ddd;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        cursor: pointer;
        background: #f0f0f0;
        overflow: hidden;
    `;

    const coords = document.createElement('div');
    coords.style.cssText = `
        position: absolute;
        width: 100%;
        text-align: center;
        top: 50%;
        transform: translateY(-50%);
        color: red;
        font-family: Arial;
        font-size: 14px;
        pointer-events: none;
        z-index: 1;
    `;
    coords.textContent = `${x},${y}`;
    tile.appendChild(coords);

    tile.addEventListener('mouseenter', () => {
        hoveredTile = { x, y };
        tile.style.transform = 'scale(1.2)';
        tile.style.zIndex = '1';
        tile.style.boxShadow = '0 5px 15px rgba(0,0,0,0.3)';
    });

    tile.addEventListener('mouseleave', () => {
        hoveredTile = null;
        tile.style.transform = 'scale(1)';
        tile.style.zIndex = '0';
        tile.style.boxShadow = 'none';
    });

    return tile;
}

// Modify the loadImage function to use the worker
function loadImage(tile, x, y) {
    const key = getImageKey(x, y);
    const highRes = scale > 1.5;

    // If we're already loading this image, don't start another load
    if (tile.dataset.loading === key) {
        return;
    }

    // Show loader only if we don't have any background image yet
    if (!tile.style.backgroundImage) {
        const loader = document.createElement('div');
        loader.className = 'loader';
        tile.appendChild(loader);
    }

    // Mark this tile as loading
    tile.dataset.loading = key;

    // Request image load from worker
    worker.postMessage({ x, y, highRes, key });
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
    const buffer = Math.max(3, Math.ceil(3 / scale));
    const startX = Math.floor((-offsetX / scale) / tileWidth) - buffer;
    const endX = Math.ceil((window.innerWidth - offsetX) / (scale * tileWidth)) + buffer;
    const startY = Math.floor((-offsetY / scale) / tileHeight) - buffer;
    const endY = Math.ceil((window.innerHeight - offsetY) / (scale * tileHeight)) + buffer;

    // Collect all tiles that need to be loaded
    const tilesToLoad = [];
    const currentTiles = new Set();

    for (let x = startX; x <= endX; x++) {
        for (let y = startY; y <= endY; y++) {
            const key = `${x},${y}`;
            currentTiles.add(key);

            if (!visibleTiles.has(key)) {
                const tile = createTile(x, y);
                gridWrapper.appendChild(tile);
                visibleTiles.add(key);
                tilesToLoad.push({ tile, x, y });
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

    // Update transform
    gridWrapper.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;

    // Load images in the background
    requestIdleCallback(() => {
        tilesToLoad.forEach(({ tile, x, y }) => {
            loadImage(tile, x, y);
        });
    }, { timeout: 1000 });
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

// Add touch event listeners
container.addEventListener('touchstart', (e) => {
    isTouching = true;
    wasTouching = false;
    
    if (e.touches.length === 1) {
        // Single touch for panning
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
        // Two touches for pinch zooming
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
    if (e.touches.length === 0) {
        isTouching = false;
        lastTouchDistance = 0;
    } else if (e.touches.length === 1) {
        // Reset touch start position for continued panning
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        lastTouchDistance = 0;
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
        const img = new Image();
        img.src = `https://picsum.photos/seed/${x}_${y}/1600/900.jpg`;
        
        img.onload = () => {
            // Get starting position from the actual tile in the grid
            const tile = gridWrapper.querySelector(`[data-x="${x}"][data-y="${y}"]`);
            const tileRect = tile.getBoundingClientRect();

            const fullscreenContainer = document.createElement('div');
            fullscreenContainer.className = 'fullscreen-container';

            const imageContainer = document.createElement('div');
            imageContainer.className = 'fullscreen-image-container';

            const fullscreenImage = document.createElement('img');
            fullscreenImage.className = 'fullscreen-image';
            fullscreenImage.src = img.src;
            fullscreenImage.style.cssText = `
                position: absolute;
                width: ${img.width}px;
                height: ${img.height}px;
                transform-origin: 0 0;
                transition: none;
            `;

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

            // Calculate target dimensions accounting for screen size
            const isMobile = window.innerWidth <= 768;
            const containerWidth = isMobile ? window.innerWidth : window.innerWidth - 285;
            const containerHeight = isMobile ? window.innerHeight * 0.6 : window.innerHeight;
            
            // Calculate scale to fit the image in the available space
            const targetScale = Math.min(
                containerWidth / img.width,
                containerHeight / img.height
            );
            
            // Calculate centered position
            const scaledWidth = img.width * targetScale;
            const scaledHeight = img.height * targetScale;
            const targetX = (containerWidth - scaledWidth) / 2;
            const targetY = isMobile ? (containerHeight - scaledHeight) / 2 : (window.innerHeight - scaledHeight) / 2;

            // Set initial position and size to match the tile exactly
            const initialScale = tileRect.width / img.width;
            fullscreenImage.style.transform = `
                translate(${tileRect.left}px, ${tileRect.top}px) 
                scale(${initialScale})
            `;

            // Force reflow to ensure initial position is rendered
            fullscreenImage.offsetHeight;

            // Add transition and animate to fullscreen
            fullscreenImage.style.transition = 'transform 0.3s linear';
            requestAnimationFrame(() => {
                fullscreenContainer.style.backgroundColor = 'rgba(0,0,0,0.9)';
                fullscreenImage.style.transform = `
                    translate(${targetX}px, ${targetY}px) 
                    scale(${targetScale})
                `;
                sidebar.classList.add('visible');

                // Remove transform after animation completes
                fullscreenImage.addEventListener('transitionend', function handler() {
                    fullscreenImage.style.transform = '';
                    fullscreenImage.style.position = '';
                    fullscreenImage.style.width = '';
                    fullscreenImage.style.height = '';
                    fullscreenImage.removeEventListener('transitionend', handler);
                }, { once: true });
            });

            // Close on image click with reverse animation
            imageContainer.addEventListener('click', () => {
                const currentTile = gridWrapper.querySelector(`[data-x="${x}"][data-y="${y}"]`);
                const currentTileRect = currentTile.getBoundingClientRect();
                const finalScale = currentTileRect.width / img.width;

                // Reset the absolute positioning and dimensions for the closing animation
                fullscreenImage.style.position = 'absolute';
                fullscreenImage.style.width = `${img.width}px`;
                fullscreenImage.style.height = `${img.height}px`;
                
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
        };
    }
});

// Add touch handlers for hover effect
container.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
        const touch = e.touches[0];
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        if (element && element.classList.contains('grid-tile')) {
            const x = parseInt(element.dataset.x);
            const y = parseInt(element.dataset.y);
            hoveredTile = { x, y };
            element.style.transform = 'scale(1.2)';
            element.style.zIndex = '1';
            element.style.boxShadow = '0 5px 15px rgba(0,0,0,0.3)';
        }
    }
    e.preventDefault();
}, { passive: false });

container.addEventListener('touchend', (e) => {
    if (!wasTouching && hoveredTile) {
        const element = gridWrapper.querySelector(`[data-x="${hoveredTile.x}"][data-y="${hoveredTile.y}"]`);
        if (element) {
            element.style.transform = 'scale(1)';
            element.style.zIndex = '0';
            element.style.boxShadow = 'none';
        }
    }
    if (e.touches.length === 0) {
        hoveredTile = null;
    }
});

// Prevent default touch behaviors
container.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
container.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

// Reset button functionality
const resetButton = document.getElementById('resetButton');
if (resetButton) {
    resetButton.addEventListener('click', () => {
        const targetOffsetX = window.innerWidth / 2 - tileWidth / 2;
        const targetOffsetY = window.innerHeight / 2 - tileHeight / 2;
        const targetScale = 1;

        // Store starting positions
        const startOffsetX = offsetX;
        const startOffsetY = offsetY;
        const startScale = scale;

        // Animation settings
        const duration = 500; // Animation duration in ms
        const startTime = performance.now();

        function animate(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function for smooth animation
            const easeProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease-out

            // Interpolate values
            offsetX = startOffsetX + (targetOffsetX - startOffsetX) * easeProgress;
            offsetY = startOffsetY + (targetOffsetY - startOffsetY) * easeProgress;
            scale = startScale + (targetScale - startScale) * easeProgress;

            // Update the grid
            updateVisibleTiles();

            // Continue animation if not finished
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        }

        // Start the animation
        requestAnimationFrame(animate);
    });
}

// Mouse wheel zoom
container.addEventListener('wheel', (e) => {
    e.preventDefault();
    const mouseX = (e.clientX - offsetX) / scale;
    const mouseY = (e.clientY - offsetY) / scale;

    const zoomFactor = 1.1;
    const wasHighRes = scale > 1.5;
    
    if (e.deltaY < 0) {
        scale = Math.min(scale * zoomFactor, maxZoom);
    } else {
        scale = Math.max(scale / zoomFactor, minZoom);
    }

    offsetX = e.clientX - mouseX * scale;
    offsetY = e.clientY - mouseY * scale;

    // Force update of all visible tiles if we cross the high-res threshold
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

    updateVisibleTiles();
}, { passive: false });

// Initial render
updateVisibleTiles();
