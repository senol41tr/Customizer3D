import {Open} from 'customizer3D_dir/file/operations/Open.js';
import {SaveAs} from 'customizer3D_dir/file/operations/SaveAs.js';
import {Export} from 'customizer3D_dir/file/operations/Export.js';

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
