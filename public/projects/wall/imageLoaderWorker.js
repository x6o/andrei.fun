self.onmessage = async (e) => {
    const { x, y, highRes, key } = e.data;

    const imgSrc = highRes
        ? `https://picsum.photos/seed/${x}_${y}/1600/900.jpg`
        : `https://picsum.photos/seed/${x}_${y}/160/90.jpg`;

    try {
        // Fetch the image as a blob
        const response = await fetch(imgSrc);
        if (!response.ok) throw new Error(`Failed to fetch image: ${imgSrc}`);

        const blob = await response.blob();

        // Convert blob to a transferable object URL
        const objectURL = URL.createObjectURL(blob);

        // Send the URL back to the main thread
        self.postMessage({ key, imgSrc: objectURL, success: true });
    } catch (error) {
        console.error(error.message);
        self.postMessage({ key, success: false });
    }
};