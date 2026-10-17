// https://stackoverflow.com/questions/11381673/detecting-a-mobile-browser
export const isMobile = () =>
{
    const toMatch = [
        /Android/i,
        // /webOS/i,
        /iPhone/i,
        // /iPad/i,
        // /iPod/i,
        /BlackBerry/i,
        /Windows Phone/i
    ];
    
    return toMatch.some((toMatchItem) => {
        return navigator.userAgent.match(toMatchItem);
    });
};

export const isIOS = () =>
{
    const toMatch = [
        /iPhone/i,
        /iPad/i,
        /iPod/i
    ];
    
    return toMatch.some((toMatchItem) => {
        return navigator.userAgent.match(toMatchItem);
    });
}
