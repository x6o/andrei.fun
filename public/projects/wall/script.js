

const canvas = document.getElementById("tileCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Grid settings
const tileWidth = 160; // 16:9 aspect ratio (for 16 width, 9 height => width/height = 16/9)
const tileHeight = 90;
const minZoom = 0.6;  // Limit for zooming out
const maxZoom = 2;   // Limit for zooming in
const gridSize = 150; // Size of the grid (50x50 tiles)
let scale = 1;
let offsetX = canvas.width / 2 - tileWidth / 2; // Initially center the canvas
let offsetY = canvas.height / 2 - tileHeight / 2; // Initially center the canvas

let hoveredTile = null; // To track the hovered tile
let hoveredScale = 1; // Scale factor for the hovered tile
const hoverScaleTarget = 1.2; // Target scale when hovering
const hoverScaleSpeed = 0.1; // Speed of scaling animation
let selectedTile = null; //{ x: 0, y: 0 }; // Start with the center tile selected


// Image cache
const imageCache = {};

// Calculate the buffer size based on zoom level
function calculateBuffer() {
  return Math.max(3, Math.ceil(3 / scale)); // Ensure 3 additional rows/columns around the viewport
}

function getImageKey(x, y) {
    const isHightDefImage = scale > 1.5;
    return `${x},${y},${isHightDefImage? "1":"0"}`;
}

function animateHoveredTile() {
    if (hoveredTile) {
      hoveredScale += (hoverScaleTarget - hoveredScale) * hoverScaleSpeed;
    } else {
      hoveredScale += (1 - hoveredScale) * hoverScaleSpeed;
    }
  
    if (Math.abs(hoveredScale - (hoveredTile ? hoverScaleTarget : 1)) > 0.01) {
      requestAnimationFrame(animateHoveredTile);
    }
  
    drawGrid(); // Continuously redraw the grid for the animation
  }


function getVisibleTiles() {
    const buffer = calculateBuffer();
  
    const startX = Math.floor((-offsetX / scale) / tileWidth) - buffer;
    const endX = Math.ceil((canvas.width - offsetX) / (scale * tileWidth)) + buffer;
    const startY = Math.floor((-offsetY / scale) / tileHeight) - buffer;
    const endY = Math.ceil((canvas.height - offsetY) / (scale * tileHeight)) + buffer;
  
    return { startX, endX, startY, endY };
  }
  
  function loadVisibleImages() {
    const { startX, endX, startY, endY } = getVisibleTiles();
  
    // Load images only for tiles within the visible range
    for (let x = startX; x <= endX; x++) {
      for (let y = startY; y <= endY; y++) {
        const highRes = scale > 1.5; // Adjust the threshold as needed
        const key = getImageKey(x,y);

        // console.log("isHighRes", highRes)
        const imgSrc = highRes 
            ? `https://picsum.photos/seed/${x}_${y}/1600/900.jpg`
            : `https://picsum.photos/seed/${x}_${y}/160/90.jpg`;

        if (!imageCache[key]) {
          const img = new Image();
          img.src = imgSrc;
          imageCache[key] = img;

          // Attach an error handler
            img.onerror = function () {
                console.error(`Failed to load image for tile ${key}`);
                delete imageCache[key]; // Remove broken image from cache
            };
        } else {
            // console.log("incache", imageCache[key], highRes)
        }
      }
    }
  
    // Remove images for tiles that are no longer visible
    Object.keys(imageCache).forEach((key) => {
      const [x, y, highDef] = key.split(',').map(Number);
      if (x < startX || x > endX || y < startY || y > endY) {
        // delete imageCache[key];
      }
    });
  }
  
  // Update `drawGrid` to load visible images dynamically
  function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);
  
    // Calculate visible tiles and load images
    loadVisibleImages();
  
    const { startX, endX, startY, endY } = getVisibleTiles();
  
    for (let x = startX; x <= endX; x++) {
      for (let y = startY; y <= endY; y++) {
        const tileX = x * tileWidth;
        const tileY = y * tileHeight;
  
        const key = getImageKey(x,y);
        const img = imageCache[key];

  
      const isHovered = hoveredTile && hoveredTile.x === x && hoveredTile.y === y;
      if (isHovered) continue; // Skip the hovered tile in this loop

      const currentScale = isHovered ? hoveredScale : 1;

      const scaledTileWidth = tileWidth * currentScale;
      const scaledTileHeight = tileHeight * currentScale;

      const centerX = tileX + tileWidth / 2;
      const centerY = tileY + tileHeight / 2;

      const drawX = centerX - scaledTileWidth / 2;
      const drawY = centerY - scaledTileHeight / 2;
  
      if (img && img.complete) {
        ctx.drawImage(img, drawX, drawY, scaledTileWidth, scaledTileHeight);
      } else {
        ctx.fillStyle = "#f0f0f0";
        ctx.fillRect(drawX, drawY, scaledTileWidth, scaledTileHeight);
      }

        const isSelected = selectedTile && selectedTile.x === x && selectedTile.y === y;
  
        ctx.strokeStyle = isHovered || isSelected  ? "green" : "#ddd";
        ctx.strokeRect(drawX, drawY, scaledTileWidth, scaledTileHeight);
  
        ctx.fillStyle = "#ff0000";
        ctx.font = "14px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`${x},${y}`, tileX + tileWidth / 2, tileY + tileHeight / 2);
      }
    }

        // Second loop: Draw only the hovered tile on top
    if (hoveredTile) {
        const { x, y } = hoveredTile;
        const tileX = x * tileWidth;
        const tileY = y * tileHeight;
    
        const key = getImageKey(x,y);
        const img = imageCache[key];
    
        const scaledTileWidth = tileWidth * hoveredScale;
        const scaledTileHeight = tileHeight * hoveredScale;
    
        const centerX = tileX + tileWidth / 2;
        const centerY = tileY + tileHeight / 2;
    
        const drawX = centerX - scaledTileWidth / 2;
        const drawY = centerY - scaledTileHeight / 2;
    
        // Add shadow effect
        ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
        ctx.shadowBlur = 50;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 5;

        if (img && img.complete) {
        ctx.drawImage(img, drawX, drawY, scaledTileWidth, scaledTileHeight);
        } else {
        ctx.fillStyle = "#f0f0f0";
        ctx.fillRect(drawX, drawY, scaledTileWidth, scaledTileHeight);
        }

          // Reset shadow to avoid affecting other tiles
        // ctx.shadowColor = "transparent";
        // ctx.shadowBlur = 0;
        // ctx.shadowOffsetX = 0;
        // ctx.shadowOffsetY = 0;
    
        ctx.strokeStyle = "#eee";
        ctx.strokeRect(drawX, drawY, scaledTileWidth, scaledTileHeight);
    
        ctx.fillStyle = "#ff0000";
        ctx.font = "14px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`${x},${y}`, centerX, centerY);
    }
  
    ctx.restore();
  }
  

// Panning and zooming
let isPanning = false;
let startX, startY;


canvas.addEventListener("mousedown", (e) => {
  isPanning = true;
  startX = e.clientX;
  startY = e.clientY;
});

canvas.addEventListener("mouseup", () => {
  isPanning = false;
});

canvas.addEventListener("mousemove", (e) => {
  if (isPanning) {
    offsetX += e.clientX - startX;
    offsetY += e.clientY - startY;
    startX = e.clientX;
    startY = e.clientY;
    drawGrid();  // Redraw the grid after panning
    canvas.style.cursor = "grabbing";
  } else {
    // Update hovered tile based on mouse position
    const mouseX = (e.clientX - offsetX) / scale;
    const mouseY = (e.clientY - offsetY) / scale;

    const tileX = Math.floor(mouseX / tileWidth);
    const tileY = Math.floor(mouseY / tileHeight);

    if (hoveredTile && (hoveredTile.x !== tileX || hoveredTile.y !== tileY)) {
      hoveredTile = { x: tileX, y: tileY };
      hoveredScale = 1; // Reset scale when a new tile is hovered
      animateHoveredTile(); // Start the hover animation
      drawGrid();
    } else if (!hoveredTile) {
      hoveredTile = { x: tileX, y: tileY };
      drawGrid();
    }

    canvas.style.cursor = hoveredTile ? "pointer" : "default";
  }
});

canvas.addEventListener("mouseout", () => {
  hoveredTile = null; // Reset hovered tile when mouse leaves the canvas
  hoveredScale = 1; // Reset scale
  animateHoveredTile(); // Animate back to normal
});

// Zoom functionality with subtle zoom animation
canvas.addEventListener("wheel", (e) => {
  e.preventDefault();

  const mouseX = (e.clientX - offsetX) / scale;
  const mouseY = (e.clientY - offsetY) / scale;

  // Zooming with limits
  const zoomFactor = 1.1;
  if (e.deltaY < 0) {
    scale = Math.min(scale * zoomFactor, maxZoom); // Prevent zooming in beyond maxZoom
  } else {
    scale = Math.max(scale / zoomFactor, minZoom); // Prevent zooming out beyond minZoom
  }

  offsetX = e.clientX - mouseX * scale;
  offsetY = e.clientY - mouseY * scale;
  
  drawGrid();  // Redraw the grid after zooming
});

// Handle window resizing
window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
//   offsetX = canvas.width / 2;
//   offsetY = canvas.height / 2;
  drawGrid();  // Redraw grid after resizing
});

// Add event listener to reset button
const resetButton = document.getElementById("resetButton");
resetButton.addEventListener("click", () => {
  // Reset the target position to (0, 0) tile (centered)
  offsetX = canvas.width / 2 - tileWidth / 2;
  offsetY = canvas.height / 2 - tileHeight / 2;
  drawGrid();  // Redraw the grid after resetting
});

// Keyboard navigation
window.addEventListener("keydown", (e) => {
    let { x, y } = selectedTile ?? {x:null, y:null};
  
    switch (e.key) {
      case "ArrowUp":
        y -= 1;
        break;
      case "ArrowDown":
        y += 1;
        break;
      case "ArrowLeft":
        x -= 1;
        break;
      case "ArrowRight":
        x += 1;
        break;
      case " ":
      case "Enter":
        if (x&&y) {
            console.log(`Tile selected: x=${selectedTile.x}, y=${selectedTile.y}`);
        }
        return;
      default:
        return; // Ignore other keys
    }
  
    // Update selected tile and redraw
    selectedTile = { x, y };
    drawGrid();
  });

// Initial draw
drawGrid();
