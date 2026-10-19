import {Size} from 'customizer3D_dir/utils/Size.js?c3d=0.5.5';
import {calculateAspectRatioFit} from 'customizer3D_dir/utils/calculateAspectRatioFit.js?c3d=0.5.5';

export class New
{
    constructor(c3d)
    {
      this.c3d = c3d;





/**
 * Tarayıcının ve ekran kartının desteklediği maksimum Texture (Doku) boyutlarını
 * ve VRAM bellek limitlerini sorgulayan yardımcı fonksiyon.
 * 
 * @returns {Object|null} GPU Texture Limit Bilgileri
 */
function getGPUTextureLimits() {
    // 1. Gizli bir canvas oluşturup WebGL2 veya WebGL1 bağlamı (context) alalım
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    if (!gl) {
        console.error('WebGL tarayıcı tarafından desteklenmiyor!');
        return null;
    }

    // 2. GPU donanım parametrelerini sorgula
    const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE); // 2D Texture Max Kenar Pikseli
    const maxCubeMapSize = gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE); // Küp Haritası Max Kenar
    
    // WebGL2 varsa 3D Texture desteğini sorgula
    let max3DTextureSize = 0;
    if (gl instanceof WebGL2RenderingContext) {
        max3DTextureSize = gl.getParameter(gl.MAX_3D_TEXTURE_SIZE);
    }

    // 3. Maksimum piksel ve sıkıştırılmamış RGBA VRAM hesabını yap
    const totalPixels2D = maxTextureSize * maxTextureSize;
    const bytesPerPixel = 4; // RGBA (Red, Green, Blue, Alpha) = 4 Byte
    const vramUsageBytes = totalPixels2D * bytesPerPixel;
    const vramUsageMB = (vramUsageBytes / (1024 * 1024)).toFixed(2);
    const vramUsageGB = (vramUsageBytes / (1024 * 1024 * 1024)).toFixed(2);

    return {
        maxDimensionPx: maxTextureSize,           // Örn: 16384
        maxResolutionText: `${maxTextureSize}x${maxTextureSize}`, // Örn: "16384x16384"
        maxTotalPixels: totalPixels2D,            // Örn: 268,435,456 piksel
        maxCubeMapPx: maxCubeMapSize,             // Örn: 16384
        max3DPx: max3DTextureSize,                // Örn: 2048 (Sadece WebGL2)
        estimatedVramMB: Number(vramUsageMB),     // Örn: 1024 MB
        estimatedVramGB: Number(vramUsageGB)      // Örn: 1.00 GB
    };
}

// ==========================================
// KULLANIM ÖRNEĞİ (Saf JavaScript)
// ==========================================
const textureLimits = getGPUTextureLimits();

if (textureLimits) {
    console.log('--- GPU Texture Limit Analizi ---');
    console.log(`Maksimum Doku Kenar Boyutu : ${textureLimits.maxDimensionPx}px`);
    console.log(`Maksimum Doku Çözünürlüğü : ${textureLimits.maxResolutionText}`);
    console.log(`Toplam Maksimum Piksel    : ${textureLimits.maxTotalPixels.toLocaleString()} px`);
    console.log(`Tek Doku İçin VRAM İhtiyacı: ${textureLimits.estimatedVramMB} MB (${textureLimits.estimatedVramGB} GB)`);
}

// ==========================================
// KULLANIM ÖRNEĞİ (Three.js İçinde)
// ==========================================
// Eğer projenizde Three.js kullanıyorsanız renderer üzerinden doğrudan alabilirsiniz:
/*
import * as THREE from 'three';

const renderer = new THREE.WebGLRenderer();
const maxTextureSize = renderer.capabilities.maxTextureSize;
console.log(`Three.js Max Texture Size: ${maxTextureSize}px`);
*/



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
          <input type="number" value="16384" style="width:120px;padding: 0.3rem;">
        </div>
        
        <div class="inputPercent height" data-icon="Height">
          <input type="number" value="16384" style="width:120px;padding: 0.3rem;">
        </div>
        
        <div class="inputPercent dpi" data-icon="DPI">
          <input list="pre_def_dpi" type="number" value="72" style="width:120px;padding: 0.3rem;">
          <datalist id="pre_def_dpi">
            <option value="72"></option>
            <option value="96"></option>
            <option value="150"></option>
            <option value="300"></option>
          </datalist>
        </div>

        <select style="width:120px;margin-bottom:1rem;border: 1px solid var(--c3dColorText);border-radius: 3px;padding: 0.15rem;">
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
      const dpi = div.querySelector('div.dpi > input');
      const createButton = div.querySelector('button.create');
      const cancelButton = div.querySelector('button.cancel');

      let oldUnit = select.value;
      let oldValueWidth = width.value;
      let oldValueHeight = height.value;
      let oldValueDPI = dpi.value;

      const _onInput = () => {

        oldValueWidth = width.value;
        oldValueHeight = height.value;
        oldValueDPI = dpi.value;
        oldUnit = select.value;

        const maxSize = new Size({size: this.c3d.MAX_IMAGE_SIZE + 'px', DPI: dpi.value})[oldUnit];
        const maxSizeStr = maxSize.toFixed(2).replace('.00', '');

        if(width.value > parseFloat(maxSizeStr) || height.value > parseFloat(maxSizeStr))
        {
          if(width.value > maxSize) width.value = maxSizeStr;
          if(height.value > maxSize) height.value = maxSizeStr;
          alert("Width and/or Height exceeds the max. image size!\nThe image cannot be larger than 4K @ 72DPI!\nMax. Image Size: " + maxSizeStr + oldUnit);
        }
      };

      width.addEventListener('input', _onInput);
      height.addEventListener('input', _onInput);

      select.addEventListener('change', (e) =>
      {
        const unit = select.value;
        const sizeWidth = new Size({size: oldValueWidth + oldUnit, DPI: dpi.value});
        const sizeHeight = new Size({size: oldValueHeight + oldUnit, DPI: dpi.value});

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
