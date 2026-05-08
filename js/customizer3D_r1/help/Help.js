import {Dragable} from 'customizer3D_dir/dragable/Dragable.js?c3d=101';
import {isMobile} from 'customizer3D_dir/utils/isMobile.js?c3d=101';

export class Help
{
    constructor(c3d)
    {
        this.c3d = c3d;
        this.htmlEl = document.querySelector(this.c3d.props.help);

        const desc = 'help_' + (isMobile() ? 'mobile' : 'desktop');

        this.htmlEl.innerHTML = `
        <div class="title">
            <div class="title">
                <img src="${C3D_SERVER}svg/help.svg?c3d=101" alt="Icon" class="icon" draggable="false">
            </div>
        </div>

        <div class="content">
            ${this.c3d.lang[desc]}
        </div>`;

        const dragable = new Dragable({
            dragEl: this.htmlEl.querySelector('div.title'),
            container: this.htmlEl,
            root: document.querySelector(this.c3d.props.container),
            c3d: this.c3d
        });

        this.htmlEl.querySelector('div.title > div.title > img.icon').addEventListener('click', this._onClick.bind(this));

    }

    _onClick(e)
    {
        e.preventDefault();

        const content = this.htmlEl.querySelector('div.content');
        const visible = content.style.display == 'none' || content.style.display == '' ;
        const icon = this.htmlEl.querySelector('div.title > div.title > img.icon');
        content.style.display = visible ? 'flex' : 'none';
        icon.src = C3D_SERVER + 'svg/' + (visible ? 'plus' : 'help') + '.svg';
        icon.style.rotate = visible ? '45deg' : '0deg';
    }

}
