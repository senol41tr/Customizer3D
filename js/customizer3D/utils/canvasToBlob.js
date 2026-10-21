export const canvasToBlob = async(canvas) =>
{
    try
    {
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 1.0));
        return blob;
    }
    catch(e)
    {
        alert(e);
    }
}
