// https://stackoverflow.com/a/64123890
export const fetchWithProgress = async (url, onProgress) =>
{
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
        const response = await fetch(url, { signal: controller.signal });
        const reader = response.body.getReader();
        
        let lastReceivedTime = Date.now();
        const inactivityLimit = 5000;
        
        const values = [];
        let loaded = 0;

        while (true) {
            const currentTime = Date.now();
            if (currentTime - lastReceivedTime > inactivityLimit) {
                throw new Error("Connection timed out: Data stream stopped.");
            }

            const { done, value } = await reader.read();
            if (done) break;

            lastReceivedTime = Date.now(); 
            
            values.push(value);
            loaded += value.byteLength;
        }

        clearTimeout(timeoutId);
        const blob = new Blob(values);
        return await blob.arrayBuffer();

    } catch (e) {
        if (e.name === 'AbortError') alert("The request exceeded the total time limit. Please reload the page.\n" + e);
        else alert(e);
    }
};
