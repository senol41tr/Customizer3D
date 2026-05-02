
// https://stackoverflow.com/a/58882518
export const trimCanvas = (oldCanvas) => 
{
    //create a new canvas
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', {willReadFrequently: true});

    //set dimensions
    canvas.width = oldCanvas.width;
    canvas.height = oldCanvas.height;

    //apply the old canvas to the new one
    context.drawImage(oldCanvas, 0, 0);

    const topLeft = {
        x: canvas.width,
        y: canvas.height,
        update(x,y){
            this.x = Math.min(this.x,x);
            this.y = Math.min(this.y,y);
        }
    };

    const bottomRight = {
        x: 0,
        y: 0,
        update(x,y){
            this.x = Math.max(this.x,x);
            this.y = Math.max(this.y,y);
        }
    };

    const imageData = context.getImageData(0,0,canvas.width,canvas.height);

    for(let x = 0; x < canvas.width; x++) {
        for(let y = 0; y < canvas.height; y++) {
            const alpha = imageData.data[((y * (canvas.width * 4)) + (x * 4)) + 3];
            if(alpha !== 0){
                topLeft.update(x,y);
                bottomRight.update(x,y);
            }
        }
    }

    const width = bottomRight.x - topLeft.x;
    const height = bottomRight.y - topLeft.y;

    const croppedCanvas = context.getImageData(topLeft.x,topLeft.y,width,height);
    canvas.width = width;
    canvas.height = height;
    context.putImageData(croppedCanvas,0,0);

    return canvas;

}