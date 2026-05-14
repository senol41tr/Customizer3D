
export class ZIndex
{
    constructor(c3d)
    {
        this.c3d = c3d;
        this.maxIndex = this._findHighestZIndex();
    }

    get index()
    {
        return this.maxIndex++;
    }

    // https://stackoverflow.com/a/46541274
    _findHighestZIndex()
    {
        return Array.from(document.querySelector(this.c3d.props.container).querySelectorAll('*'))
        .map(a => parseInt(window.getComputedStyle(a).zIndex))
        .filter(a => !isNaN(a))
        .sort()
        .pop();
    }
    
}
