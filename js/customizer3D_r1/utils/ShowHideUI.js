import {isIOS} from 'customizer3D_dir/utils/isMobile.js?c3d=101';

export class ShowHideUI
{
    constructor(c3d)
    {
        this.c3d = c3d;
    }

    show()
    {
        this._setState('visible');

        // hide controls (when needed)
        // const containerDims = Size.htmlDims(this.c3d.props.container);
        // const controlsState = document.body.offsetWidth > containerDims.width || document.body.offsetHeight > containerDims.height;
        // document.querySelector(this.c3d.props.controls).style.visibility = controlsState ? 'visible' : 'hidden';
    }

    hide()
    {
        this._setState('hidden');
    }

    _setState(state)
    {
        document.querySelector(this.c3d.props.layers).style.visibility = 
        document.querySelector(this.c3d.props.help).style.visibility = 
        document.querySelector(this.c3d.props.controls).style.visibility = 
        document.querySelector(this.c3d.props.imageLayer).style.visibility = 
        document.querySelector(this.c3d.props.textLayer).style.visibility = 
        document.querySelector(this.c3d.props.shapeLayer).style.visibility = 
        document.querySelector('section.examples').style.visibility = 
        document.querySelector('div.switchView').style.visibility = 
        document.querySelector(this.c3d.props.settings).style.visibility = state;
        
        this.c3d.glbScene.visible = state == 'visible';

        document.querySelector(this.c3d.props.container + ' > div.webXR').style.visibility = isIOS() ? 'hidden' : state;
    }

}
