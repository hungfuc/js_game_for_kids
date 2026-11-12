export function loadImage(url) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error(`Could not load image: ${url}`));
        image.src = url;
    });
}
export function announce(text) {
    const output = document.getElementById('status');
    if (output && output.textContent !== text)
        output.textContent = text;
}
