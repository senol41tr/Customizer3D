import {Open} from 'customizer3D_dir/file/Open.js?c3d=0.5.0';
import {SaveAs} from 'customizer3D_dir/file/SaveAs.js?c3d=0.5.0';
import {Export} from 'customizer3D_dir/file/Export.js?c3d=0.5.0';

export class File
{
    constructor(c3d)
    {
        this._Open = new Open(c3d);
        this._SaveAs = new SaveAs(c3d);
        this._Export = new Export(c3d);
    }

    async open(file)
    {
        await this._Open.open(file);
    }

    async loadModule(jsPath, glbPath)
    {
        await this._Open.loadModule(jsPath, glbPath);
    }

    async saveAs()
    {
        await this._SaveAs.save();
    }

    async export()
    {
        await this._Export.exportAsPDF();
    }

}
