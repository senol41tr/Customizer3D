import * as THREE from 'three';
import {Size} from 'customizer3D_dir/utils/Size.js?c3d=0.6.1';
import {calculateAspectRatioFit} from 'customizer3D_dir/utils/calculateAspectRatioFit.js?c3d=0.6.1';
import {calculateDynamicDPI, getLimits} from 'customizer3D_dir/utils/getPrintDims.js?c3d=0.6.1';

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

      <select class="presets" style="border: 1px solid var(--c3dColorText);border-radius: 3px;padding: 0.15rem;">
        <option value="" selected>Presets</option>
      </select>

      <div class="inputPercent width" data-icon="${this.c3d.lang['width']}">
        <input type="number" value="2048" style="padding: 0.3rem;width: 100%;">
      </div>
      
      <div class="inputPercent height" data-icon="${this.c3d.lang['height']}">
        <input type="number" value="2048" style="padding: 0.3rem;width: 100%;">
      </div>
      
      <div class="inputPercent dpi" data-icon="DPI">
        <input list="dpis" type="number" value="72" style="padding: 0.3rem;width: 100%;">
        <datalist id="dpis">
          <option value="72">
          <option value="96">
          <option value="150">
          <option value="300">
        </datalist>
      </div>

      <select class="unit" style="margin-bottom:1rem;border: 1px solid var(--c3dColorText);border-radius: 3px;padding: 0.15rem;">
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

    const selectPreset = div.querySelector('select.presets');
    const selectUnit = div.querySelector('select.unit');
    const width = div.querySelector('div.width > input');
    const height = div.querySelector('div.height > input');
    const dpi = div.querySelector('div.dpi > input');
    const createButton = div.querySelector('button.create');
    const cancelButton = div.querySelector('button.cancel');
    const limits = getLimits(this.c3d);

    let oldUnit = selectUnit.value;
    let oldValueWidth = width.value;
    let oldValueHeight = height.value;

    let maxSize = new Size({size: limits.display + 'px'})[oldUnit];

    const _onInput = (e) =>
    {
      dpi.value = calculateDynamicDPI(this.c3d, Math.max(width.value, height.value), selectUnit.value);

      const maxSizeNumber = selectUnit.value == 'px' ? Math.round(maxSize) : maxSize;
      const maxSizeStr = maxSizeNumber.toFixed(2).replace('.00', '');

      if(width.value > parseFloat(maxSizeStr) || height.value > parseFloat(maxSizeStr))
      {
        if(width.value > maxSizeNumber) { width.value = maxSizeStr; oldValueWidth = maxSizeNumber; }
        if(height.value > maxSizeNumber) { height.value = maxSizeStr; oldValueHeight = maxSizeNumber; }
        alert("Width and/or Height exceeds the max. image size!\nMax. Image Size: " + maxSizeStr + selectUnit.value);
        if(selectUnit.value == 'px' && limits.print == Math.round(new Size({size: e.currentTarget.value + selectUnit.value}).mm))
        {
          e.currentTarget.value = limits.display;
        }
      }
      else
      {
        oldValueWidth = width.value;
        oldValueHeight = height.value;
        oldUnit = selectUnit.value;
      }

    };

    width.addEventListener('input', _onInput);
    width.addEventListener('focus', () => width.select());
    height.addEventListener('input', _onInput);
    height.addEventListener('focus', () => height.select());
    dpi.addEventListener('change', _onInput);
    dpi.addEventListener('focus', () => { dpi.value = ''; });
    dpi.addEventListener('blur', () => { if(dpi.value == '') _onInput(); });


    selectUnit.addEventListener('change', (e) =>
    {
      const unit = selectUnit.value;
      const sizeWidth = new Size({size: oldValueWidth + oldUnit});
      const sizeHeight = new Size({size: oldValueHeight + oldUnit});

      if(unit != 'px') selectPreset.value = '';

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

    
    if(limits.display >= 1024)
    {
      let presetSize = limits.display;
      const preselLabels = {
        16384: '16K - Ultra (Very Slow Export)',
        8192: '8K - High (Slow Export)',
        4096: '4K - Standard (Normal Export)',
        2048: '2K - Normal (Fast Export)',
      }
      while(presetSize > 1024)
      {
        const option = document.createElement('option');
        const label = presetSize + 'x' + presetSize + 'px';
        option.value = presetSize;
        option.innerText = preselLabels[presetSize] ? preselLabels[presetSize] : label;
        selectPreset.append(option);
        presetSize /= 2;
      }
      selectPreset.addEventListener('change', (e) =>
      {
        if(selectPreset.value == '') return;
        width.value = selectPreset.value;
        height.value = selectPreset.value;
        oldUnit = 'px';
        selectUnit.value = 'px';
        oldValueWidth = width.value;
        oldValueHeight = height.value;
        selectUnit.dispatchEvent(new Event('change'));
      });
    }
    else
    {
      selectPreset.style.display = 'none';
    }


    cancelButton.addEventListener('click', () => {
      this.c3d.showHideUI.show();
      this.c3d.contextMenu.hide();
      const canvas2D = document.querySelector(this.c3d.props.canvas2d);
      const canvas3D = this.c3d.three.getCanvas().parentNode; // div
      canvas2D.classList.remove('blur');
      canvas3D.classList.remove('blur');
    });


    createButton.addEventListener('click', async () => {
      await this._createNewFile(width.value, height.value, selectUnit.value, dpi.value);
      cancelButton.click();
    });


    this.c3d.contextMenu.setWidth(200);
    this.c3d.contextMenu.setHTMLObj(div);
    this.c3d.contextMenu.show();

  }

  async _createNewFile(width, height, unit, dpi)
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
    ps.unit = unit;
    ps.dpi = dpi;
    
    await this.c3d._createLayerData();
       
    setTimeout(() => {this.c3d._setNavActive('area', true, false);}, 500);

  }
}
