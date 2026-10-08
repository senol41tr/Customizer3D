import {Size} from 'customizer3D_dir/utils/Size.js?c3d=0.5.1';
import {calculateAspectRatioFit} from 'customizer3D_dir/utils/calculateAspectRatioFit.js?c3d=0.5.1';

export class New
{
    constructor(c3d)
    {
      this.c3d = c3d;
    }

    async new2D()
    {
      this._showDialog();
    }


    _showDialog()
    {
      this.c3d.showHideUI.hide();
      const canvas2D = document.querySelector(this.c3d.props.canvas2d);
      const canvas3D = this.c3d.three.getCanvas().parentNode; // div
      canvas2D.classList.add('blur');
      canvas3D.classList.add('blur');

      const html = `
        
        <h1 style="padding-bottom:1rem;">Create New 2D<br>Document</h1>

        <div class="inputPercent width" data-icon="Width">
          <input type="number" value="2048" style="width:120px;padding: 0.3rem;">
        </div>
        
        <div class="inputPercent height" data-icon="Height">
          <input type="number" value="2048" style="width:120px;padding: 0.3rem;">
        </div>

        <select style="width:120px;margin-bottom:1rem;border: 1px solid var(--customizerColorText);border-radius: 3px;padding: 0.15rem;">
          <option value="px" selected>Pixel</option>
          <option value="cm">Centimeter</option>
          <option value="mm">Millimeter</option>
          <option value="in">Inch</option>
        </select>

        <button class="create">Create</button>
        <button class="cancel" style="background-color:red;color:white;">Cancel</button>
      `;
      const div = document.createElement('div');
      div.style.cssText = 'display:flex; flex-direction:column;gap:0.5rem;padding:1rem;';
      div.innerHTML = html;

      const select = div.querySelector('select');
      const width = div.querySelector('div.width > input');
      const height = div.querySelector('div.height > input');
      const createButton = div.querySelector('button.create');
      const cancelButton = div.querySelector('button.cancel');

      let oldUnit = select.value;
      let oldValueWidth = width.value;
      let oldValueHeight = height.value;

      const _onInput = () => {

        oldValueWidth = width.value;
        oldValueHeight = height.value;
        oldUnit = select.value;

        const maxSize = new Size({size: this.c3d.MAX_IMAGE_SIZE + 'px'})[oldUnit];
        const maxSizeStr = maxSize.toFixed(2).replace('.00', '');

        if(width.value > parseFloat(maxSizeStr) || height.value > parseFloat(maxSizeStr))
        {
          if(width.value > maxSize) width.value = maxSizeStr;
          if(height.value > maxSize) height.value = maxSizeStr;
          alert("Width and/or Height exceeds the max. image size!\nThe image cannot be larger than 4K!\nMax. Image Size: " + maxSizeStr + oldUnit);
        }
      };

      width.addEventListener('input', _onInput);
      height.addEventListener('input', _onInput);

      select.addEventListener('change', (e) =>
      {
        const unit = select.value;
        const sizeWidth = new Size({size: oldValueWidth + oldUnit});
        const sizeHeight = new Size({size: oldValueHeight + oldUnit});

        width.step = unit == 'px' ? '1' : '0.01';
        height.step = unit == 'px' ? '1' : '0.01';

        let w = sizeWidth[unit];
        let h = sizeHeight[unit];

        if(unit == 'px')
        {
          w = Math.round(w);
          h = Math.round(h);
        }

        width.value = w.toFixed(2).replace('.00', '');
        height.value = h.toFixed(2).replace('.00', '');

      });

      cancelButton.addEventListener('click', () => {
        this.c3d.showHideUI.show();
        this.c3d.contextMenu.hide();
        const canvas2D = document.querySelector(this.c3d.props.canvas2d);
        const canvas3D = this.c3d.three.getCanvas().parentNode; // div
        canvas2D.classList.remove('blur');
        canvas3D.classList.remove('blur');
      });


      createButton.addEventListener('click', async () => {
        await this._createNewFile(width.value, height.value, select.value);
        cancelButton.click();
      });


      this.c3d.contextMenu.setHTMLObj(div);
      this.c3d.contextMenu.show();

    }

    async _createNewFile(width, height, unit)
    {
        await this.c3d.file.loadModule(
            C3D_SERVER + 'js/customizer3D/file/assets/TwoD.js',
            C3D_SERVER + 'js/customizer3D/file/assets/TwoD.glb'
        );

        // set print size
        const printSize = this.c3d.props.data.front.printSize;
        printSize.width = width + unit;
        printSize.height = height + unit;

        // resize plane
        const size = calculateAspectRatioFit(width, height, 0.2, 0.2);
        this.c3d.glbScene.getObjectByName('front').scale.set(size.width, 0.2, size.height);
    }
}
