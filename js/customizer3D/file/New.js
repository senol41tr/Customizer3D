import * as THREE from 'three';
import {Size} from 'customizer3D_dir/utils/Size.js?c3d=0.5.6';
import {calculateAspectRatioFit} from 'customizer3D_dir/utils/calculateAspectRatioFit.js?c3d=0.5.6';
import {getLimits} from 'customizer3D_dir/utils/getPrintDims.js?c3d=0.5.6';

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
        
        <h1 style="padding-bottom:1rem;">${this.c3d.lang['create-new-2d-title']}</h1>

        <div class="inputPercent width" data-icon="${this.c3d.lang['width']}">
          <input type="number" value="2048" style="width:120px;padding: 0.3rem;">
        </div>
        
        <div class="inputPercent height" data-icon="${this.c3d.lang['height']}">
          <input type="number" value="2048" style="width:120px;padding: 0.3rem;">
        </div>

        <select style="width:120px;margin-bottom:1rem;border: 1px solid var(--c3dColorText);border-radius: 3px;padding: 0.15rem;">
          <option value="px" selected>Pixel</option>
          <option value="cm">Centimeter</option>
          <option value="mm">Millimeter</option>
          <option value="in">Inch</option>
        </select>

        <button class="create">${this.c3d.lang['create']}</button>
        <button class="cancel" style="background-color:red;color:white;">${this.c3d.lang['cancel']}</button>
      `;
      const div = document.createElement('div');
      div.style.cssText = 'display:flex; flex-direction:column;gap:0.5rem;padding:1rem;';
      div.innerHTML = html;

      const select = div.querySelector('select');
      const width = div.querySelector('div.width > input');
      const height = div.querySelector('div.height > input');
      const createButton = div.querySelector('button.create');
      const cancelButton = div.querySelector('button.cancel');

      const limits = getLimits();
      let oldUnit = select.value;
      let oldValueWidth = width.value;
      let oldValueHeight = height.value;
      let maxSize = new Size({size: limits.display + 'px'})[oldUnit];

      const _onInput = (e) =>
      {
        oldValueWidth = width.value;
        oldValueHeight = height.value;
        oldUnit = select.value;

        const maxSizeNumber = oldUnit == 'px' ? Math.round(maxSize) : maxSize;
        const maxSizeStr = maxSizeNumber.toFixed(2).replace('.00', '');

        if(width.value > parseFloat(maxSizeStr) || height.value > parseFloat(maxSizeStr))
        {
          if(width.value > maxSizeNumber) { width.value = maxSizeStr; oldValueWidth = maxSizeNumber; }
          if(height.value > maxSizeNumber) { height.value = maxSizeStr; oldValueHeight = maxSizeNumber; }
          alert("Width and/or Height exceeds the max. image size!\nMax. Image Size: " + maxSizeStr + oldUnit);
        }

        if(oldUnit == 'px' && limits.print == Math.round(new Size({size: e.currentTarget.value + oldUnit}).mm))
        {
          e.currentTarget.value = limits.display;
        }

      };

      width.addEventListener('input', _onInput);
      width.addEventListener('focus', () => width.select());
      height.addEventListener('input', _onInput);
      height.addEventListener('focus', () => height.select());

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

        if(unit == 'px')
        {
          maxSize = limits.display;
          oldUnit = 'px';
        }
        else
        {
          maxSize = new Size({size: limits.print + 'mm'})[unit];
        }
        
        width.dispatchEvent(new Event('input'));
        height.dispatchEvent(new Event('input'));

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
          C3D_SERVER + 'js/customizer3D/file/modules/C2D.js'
      );

      const group = new THREE.Group();
      const size = calculateAspectRatioFit(width, height, 0.5, 0.5);
      const geometry = new THREE.PlaneGeometry(size.width, size.height);
      const material = new THREE.MeshBasicMaterial();
      const plane = new THREE.Mesh(geometry, material);
      plane.scale.x = -1;
      plane.rotation.z = -Math.PI;
      plane.name = 'area';
      group.add(plane);
      
      this.c3d.three.scene.add(group);
      this.c3d.glbScene = group;

      const ps = this.c3d.props.data.area.printSize;
      ps.width = width + unit;
      ps.height = height + unit;
      
      await this.c3d._createLayerData();

      setTimeout(() => this.c3d._setNavActive('area', true, false), 500);

    }
}
