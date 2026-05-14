// https://stackoverflow.com/questions/16600030/how-to-resize-images-proportionally-keeping-the-aspect-ratio
export const calculateAspectRatioFit = (srcWidth, srcHeight, maxWidth, maxHeight) => {
    var ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);
    return { width: srcWidth*ratio, height: srcHeight*ratio };
}