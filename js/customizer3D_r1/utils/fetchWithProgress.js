// https://stackoverflow.com/a/64123890
export const fetchWithProgress = async (url, onProgress) =>
{
    try
    {
        const response = await fetch(url, {
            headers: {
            "Content-Type": "application/octet-stream"
            }
        });
        const contentLength = response.headers.get('content-length');
        const total = parseInt(contentLength, 10);
        const values = []
        let loaded = 0;

        const reader = response.body.getReader();
        while (true) {
            const {done, value} = await reader.read();
            if (done) break;
            values.push(value)
            loaded += value.byteLength;
            onProgress((loaded / total * 100).toFixed(1));
        }

        const blob = new Blob(values);
        const arrayBuffer = await blob.arrayBuffer();

        return arrayBuffer;
    }
    catch (e)
    {
        alert(e);
    }
};
