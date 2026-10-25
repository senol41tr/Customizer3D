import {isIOS} from 'customizer3D_dir/utils/isMobile.js?c3d=0.5.9';

export class ShowHideUI
{
    constructor(c3d)
    {
        this.c3d = c3d;
        this._subWindows =
        [
            'textLayer',
            'imageLayer',
            'shapeLayer',
            'threeDTextLayer',
            'threeDLogoLayer'
        ];
    }

    show()
    {
        this._setState('visible');
    }

    hide()
    {
        this._setState('hidden');
    }

    showSubWindows()
    {

    }

    hideSubWindows()
    {
        this._subWindows.forEach(w => {
            
            this.c3d[w].hide();

        });
    }

    _setState(state)
    {
        document.querySelector(this.c3d.props.layers).style.visibility = 
        document.querySelector(this.c3d.props.help).style.visibility = 
        document.querySelector(this.c3d.props.controls).style.visibility = 
        document.querySelector(this.c3d.props.settings).style.visibility = state;
        document.querySelector(this.c3d.props.container + ' > div.webXR').style.visibility = isIOS() ? 'hidden' : state;
    }


    enableContainer()
    {
        this._setContainerState(true);
    }

    disableContainer()
    {
        this._setContainerState(false);
    }

    _setContainerState(state)
    {
        const els = document.querySelectorAll(this.c3d.props.container + ' > *').forEach((e) => {

            if(e.classList.contains('preloader')) return;
            e.style.pointerEvents = state ? 'all' : 'none';
            e.style.opacity = state ? 1 : 0.3;

        });        
    }

}
