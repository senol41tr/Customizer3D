import jsPDF from 'base/jspdf@4.0.0/jspdf.es.min.js';
import {Size} from 'customizer3D_dir/utils/Size.js?c3d=0.5.5';
import {drawLayerToCTX} from 'customizer3D_dir/layers//utils/drawLayerToCTX.js';

export class Export
{
    constructor(c3d)
    {
      this.c3d = c3d;
    }

    async exportAsPDF()
    {

      this.c3d.showHideUI.hide();
      this.c3d.preloader.show();
      this.c3d.preloader.set(this.c3d.lang['creating-pdf']);

      const layersData = Object.entries(this.c3d.props.data);
      const layersDiv = document.querySelector(this.c3d.props.layers);
      const ce = this.c3d.colorEngine;

      let printWidth, printHeight, uint8Array;

      // CREATE NEW PDF

      const pdf = new jsPDF({
        unit: 'mm',
        putOnlyUsedFonts: true,
        compress: true,
        lineHeight: 0
      });

      pdf.deletePage(1);
      pdf.__private__.setPdfVersion('1.4');


      // SET PDF PROPERTIES

      pdf.setProperties
      ({
        title: this.c3d.props.modelName,
        author: 'Customizer3D (https://ssarigul.tr/Customizer3D)',
        creator: 'jsPDF (https://github.com/parallax/jsPDF)'
      });


      // ADD DEFAULT FONT (which can support multi-language)

      const defaultFont = 'Signika-Regular';
      if(!pdf.existsFileInVFS(defaultFont))
      {
        const response = await fetch(C3D_SERVER + 'fonts/' + defaultFont + '.ttf');
        const blob = await response.blob();
        const base64 = await new Promise((resolve) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result)
            reader.readAsDataURL(blob)
        });

        const rawBase64 = base64.split(',')[1];
        pdf.addFileToVFS(defaultFont, rawBase64);
        pdf.addFont(defaultFont, defaultFont, 'normal');
      }


      const addColorInfos = (str, color) =>
      {
        str = str.substring(0,1).toUpperCase() + str.substring(1);
        const colorCMYK = ce.cmyk(color);
        pdf.addPage([130, 54], 'landscape');
        pdf.saveGraphicsState();
        pdf.setFillColor(0,0,0,0);
        pdf.setFontSize(16);
        pdf.setFont(defaultFont, 'normal');
        pdf.text(`${str} Color:`, 52, 12);
        pdf.setFontSize(10);
        pdf.text(`
          HEX: ${ce.hex(color, false).toUpperCase()}\n
          ${ce.rgb(color, false).toUpperCase()}\n
          ${ce.cmyk(color, false).toUpperCase()}
          `, 52, 18, {lineHeightFactor: 1});
        pdf.setDrawColor(0);
        pdf.setFillColor(colorCMYK.C, colorCMYK.M, colorCMYK.Y, colorCMYK.K);
        pdf.setLineWidth(3);
        pdf.rect(7, 7, 40, 40, 'FD');
        pdf.restoreGraphicsState();
      };



      // ADD LAYERS TO PDF

      for (let i = 0; i < layersData.length; i++)
      {
        const meshName = layersData[i][0];

        if(meshName == '*')
        {
          const layers = layersDiv.querySelectorAll('div.content > div.layer');
          
          for (let j = 0; j < layers.length; j++)
          {
            const container = layers[j];
            const layer = container.querySelector('div.content > div.layers > div.colorOnly');
            addColorInfos(container.dataset.mesh, layer.self.color);
          }
          continue;
        }


        const layers = layersDiv.querySelectorAll('[data-mesh=\'' + meshName + '\'] > div.content > div.layers > div');

        // mesh colorOnly
        if(layers.length == 1 && layers[0].classList.contains('colorOnly'))
        {
          addColorInfos(meshName, layers[0].self.color);
          continue;
        }

        // mesh with predefined color(s)
        if(layersData[i][1].hasOwnProperty('materials') && layersData[i][1]['materials'][0].hasOwnProperty('colors'))
        {
          const activeSpan = layersDiv.querySelector('div.'+ meshName +' > div.content > div.buttons > span.active');
          addColorInfos(this.c3d.props.modelName, activeSpan.style.backgroundColor);          
          continue;

        }

        this.c3d.preloader.set(this.c3d.lang['being-exported'] + '<br>' + layersData[i][1].label + '...');

        // get size
        const printSize = layersData[i][1].printSize;
        if(printSize)
        {
          printWidth = new Size({size: printSize.width, DPI: 72}).mm;
          printHeight = new Size({size: printSize.height, DPI: 72}).mm;
        }
        else
        {
          printWidth = 100;
          printHeight = 54;
        }


        // ADD NEW PAGE

        pdf.addPage([printHeight, printWidth], printHeight > printWidth ? 'portrait' : 'landscape');

        const canvas = document.createElement('canvas');

        canvas.width = new Size({size: printWidth + 'mm', DPI: 300}).px;
        canvas.height = new Size({size: printHeight + 'mm', DPI: 300}).px;

        const blob = await this._getCanvasBlob(canvas, meshName);
        uint8Array = await this.c3d.imageLayer.toUint8Array(blob);

        pdf.addImage(uint8Array, 'PNG', 0, 0,printWidth, printHeight, null, 'FAST', 0);

        // ADD TITLE

        const titleDescription = layersData[i][1].label || (mesh.name + ( mesh.material.name ? '(' + mesh.material.name + ')' : ''));
        pdf.saveGraphicsState();
        pdf.setTextColor(1,1,1,1);
        pdf.setFont(defaultFont, 'normal');
        pdf.setFontSize(6);
        const textDims = pdf.getTextDimensions(titleDescription);
        pdf.setFillColor(1,0,1,0);
        pdf.rect(0, 0, textDims.w + 2, textDims.h + 2, 'F');
        pdf.text(titleDescription, 1, 1, {baseline:'top'});
        pdf.restoreGraphicsState();

      }
      
      const date = new Date();
      const fileName = this.c3d.props.modelName + '_'+ (date.getMonth() + 1) + '.' + date.getDate();

      this.c3d.preloader.set(this.c3d.lang['downloading-pdf']);
      pdf.save(fileName + '.pdf');

      setTimeout(() => this.c3d.preloader.hide(), 1000);
      this.c3d.showHideUI.show();

    }

    async exportAsPNG()
    {
      this.c3d.showHideUI.hide();
      this.c3d.preloader.show();
      this.c3d.preloader.set(this.c3d.lang['exporting-png']);

      const layersData = Object.entries(this.c3d.props.data);
      const layersDiv = document.querySelector(this.c3d.props.layers);

      for (let i = 0; i < layersData.length; i++)
      {
        const meshName = layersData[i][0];

        if(meshName == '*') continue;

        const layers = layersDiv.querySelectorAll('[data-mesh=\'' + meshName + '\'] > div.content > div.layers > div');

        // mesh colorOnly
        if(layers.length == 1 && layers[0].classList.contains('colorOnly')) continue;

        // mesh with predefined color(s)
        if(layersData[i][1].hasOwnProperty('materials') && layersData[i][1]['materials'][0].hasOwnProperty('colors')) continue;

        this.c3d.preloader.set(this.c3d.lang['being-exported'] + '<br>' + layersData[i][1].label + '...');

        // get size
        const printSize = layersData[i][1].printSize;
        const canvas = document.createElement('canvas');

        canvas.width = new Size({size: printSize.width, DPI: 300}).px;
        canvas.height = new Size({size: printSize.height, DPI: 300}).px;

        const blob = await this._getCanvasBlob(canvas, meshName);
        const a = document.createElement('a');
        const blobUrl = URL.createObjectURL(blob);
        a.href = blobUrl;
        a.download = meshName + '.png';
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(blobUrl), 200);
      }

      setTimeout(() => this.c3d.preloader.hide(), 1000);
      this.c3d.showHideUI.show();

    }



    async _getCanvasBlob(canvas, meshName)
    {
      const layersDiv = document.querySelector(this.c3d.props.layers);
      const layers = layersDiv.querySelectorAll('[data-mesh=\'' + meshName + '\'] > div.content > div.layers > div');

      // write layers
      for (let j = layers.length - 1; j >= 0; j--)
      {
        const layer = layers[j].self;

        if(!layer.visible) continue;
          
        // draw image to canvas
        drawLayerToCTX(this.c3d, canvas, layer);

      }

      const blob = await this.c3d.imageLayer.canvasToBlob(canvas);

      return blob;

    }

}
