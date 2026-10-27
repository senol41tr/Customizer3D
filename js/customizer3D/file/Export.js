import {PDFDocument, StandardFonts, cmyk} from 'base/pdf-lib/pdf-lib.min.esm.js?c3d=0.6.1';
import {Size} from 'customizer3D_dir/utils/Size.js?c3d=0.6.1';
import {drawLayerToCTX} from 'customizer3D_dir/layers/utils/drawLayerToCTX.js?c3d=0.6.1';
import {getLimits} from 'customizer3D_dir/utils/getPrintDims.js?c3d=0.6.1';
import {calculateAspectRatioFit} from 'customizer3D_dir/utils/calculateAspectRatioFit.js?c3d=0.6.1';

export class Export
{
    constructor(c3d)
    {
      this.c3d = c3d;
    }

    async exportAsPDF()
    {

      this.c3d.showHideUI.disableContainer();
      this.c3d.preloader.show();
      this.c3d.preloader.set('<span style="font-size:1.5rem;">' + this.c3d.lang['creating-pdf'] + '</span><br>');

      const layersData = Object.entries(this.c3d.props.data);
      const layersDiv = document.querySelector(this.c3d.props.layers);
      const ce = this.c3d.colorEngine;
      const limits = getLimits(this.c3d);
      const mmToPt = (mm) => mm * 2.834645669; // !!!

      let printWidth, printHeight, page;

      // CREATE NEW PDF

      const pdf = await PDFDocument.create();


      // SET PDF PROPERTIES

      pdf.setTitle(this.c3d.props.modelName || 'Customizer3D Model');
      pdf.setAuthor('Customizer3D (https://ssarigul.tr/Customizer3D)');
      pdf.setCreator('pdf-lib (https://github.com/Hopding/pdf-lib)');


      // ADD DEFAULT FONT

      const defaultFont = await pdf.embedFont(StandardFonts.HelveticaBold);

      // 

      const addColorInfos = (str, color) =>
      {
        const colorCMYK = ce.cmyk(color);
        const pageWidthPt = mmToPt(130);
        const pageHeightPt = mmToPt(54);
        const page = pdf.addPage([pageWidthPt, pageHeightPt]);
        const titleFontSize = 16;
        const titleX = mmToPt(52);
        const titleY = pageHeightPt - mmToPt(12);
        
        str = str.substring(0, 1).toUpperCase() + str.substring(1);
        page.drawText(`${str} Color:`, {
          x: titleX,
          y: titleY,
          size: titleFontSize,
          font: defaultFont,
          color: cmyk(1, 1, 1, 1)
        });

        const detailsFontSize = 10;
        const detailsX = mmToPt(52);
        const detailsY = pageHeightPt - mmToPt(18);

        const textContent = `HEX: ${ce.hex(color, false).toUpperCase()}\n${ce.rgb(color, false).toUpperCase()}\n${ce.cmyk(color, false).toUpperCase()}`;

        page.drawText(textContent, {
          x: detailsX,
          y: detailsY,
          size: detailsFontSize,
          font: defaultFont,
          color: cmyk(1, 1, 1, 1),
          lineHeight: detailsFontSize * 1.2
        });

        page.drawRectangle({
          x: mmToPt(7),
          y: pageHeightPt - mmToPt(7 + 40),
          width: mmToPt(40),
          height: mmToPt(40),
          color: cmyk(colorCMYK.C, colorCMYK.M, colorCMYK.Y, colorCMYK.K),
          borderColor: cmyk(1, 1, 1, 1),
          borderWidth: mmToPt(3)
        });
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
          console.log(1);
          
          addColorInfos(this.c3d.props.data[meshName].label || meshName, layers[0].self.color);
          continue;
        }

        // mesh with predefined color(s)
        if(layersData[i][1].hasOwnProperty('materials') && layersData[i][1]['materials'][0].hasOwnProperty('colors'))
        {
          const activeSpan = layersDiv.querySelector('div.'+ meshName +' > div.content > div.buttons > span.active');
          addColorInfos(this.c3d.props.modelName, activeSpan.style.backgroundColor);          
          continue;

        }

        // get size
        const printSize = layersData[i][1].printSize;
        if(printSize)
        {
          printWidth = new Size({size: printSize.width, DPI: 72}).pt;
          printHeight = new Size({size: printSize.height, DPI: 72}).pt;

          if(printWidth > limits.print || printHeight > limits.print)
          {
            const newPrintSize = calculateAspectRatioFit(printWidth, printHeight, limits.print, limits.print);
            printWidth = Math.floor(newPrintSize.width);
            printHeight = Math.floor(newPrintSize.height);
          }

        }
        else
        {
          printWidth = mmToPt(100);
          printHeight = mmToPt(54);
        }        


        // ADD NEW PAGE

        page = pdf.addPage([printWidth, printHeight]);

        const canvas = document.createElement('canvas');
        const dpi = layersData[i][1].printSize.dpi || 300;
        let canvasWidth = new Size({size: printWidth + 'pt', DPI: dpi}).px;
        let canvasHeight = new Size({size: printHeight + 'pt', DPI: dpi}).px;
        
        if(canvasWidth > limits.display || canvasHeight > limits.display)
        {
          const newCanvasSize = calculateAspectRatioFit(canvasWidth, canvasHeight, limits.display, limits.display);
          canvasWidth = newCanvasSize.width;
          canvasHeight = newCanvasSize.height;
        }

        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        const drawedCanvas = await this._getCanvas(canvas, meshName, this.c3d.lang['creating-pdf'], (i + 1) + ' - ' + layersData.length);
        const blob = await new Promise(resolve => drawedCanvas.toBlob(resolve, 'image/png', 0.92));
        const arrayBuffer = await blob.arrayBuffer();
        const embeddedImage = await pdf.embedPng(arrayBuffer);
        page.drawImage(embeddedImage, {x: 0, y: 0, width: printWidth, height: printHeight});
        drawedCanvas.width = 0;
        drawedCanvas.height = 0;

      }
      
      const date = new Date();
      const fileName = this.c3d.props.modelName + '_'+ (date.getMonth() + 1) + '.' + date.getDate();

      this.c3d.preloader.set(this.c3d.lang['downloading-pdf']);

      const pdfBytes = await pdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName + '.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();

      setTimeout(() =>
      {
        this.c3d.preloader.hide();
        this.c3d.showHideUI.enableContainer();
        this.c3d.render3d.renderAll(true);
        URL.revokeObjectURL(url);
      }, 1000);

    }



    async exportAsPNG() {
      this.c3d.showHideUI.disableContainer();
      this.c3d.preloader.show();
      this.c3d.preloader.set(this.c3d.lang['exporting-png']);

      const layersData = Object.entries(this.c3d.props.data);
      const layersDiv = document.querySelector(this.c3d.props.layers);

      async function* generatePngLayers() {
        for (let i = 0; i < layersData.length; i++) {
          const meshName = layersData[i][0];
          if (meshName === '*') continue;

          const layers = layersDiv.querySelectorAll(`[data-mesh='${meshName}'] > div.content > div.layers > div`);

          if (layers.length === 1 && layers[0].classList.contains('colorOnly')) continue;
          if (layersData[i][1].hasOwnProperty('materials') && layersData[i][1]['materials'][0].hasOwnProperty('colors')) continue;

          const layerInfo = layersData[i][1];
          const printSize = layerInfo.printSize || { width: 100, height: 100, dpi: 300 };
          const dpi = printSize.dpi || 300;
          
          const canvas = document.createElement('canvas');

          canvas.width = new Size({ size: printSize.width, DPI: dpi }).px;
          canvas.height = new Size({ size: printSize.height, DPI: dpi }).px;

          yield {
            index: i + 1,
            total: layersData.length,
            meshName: meshName,
            label: layerInfo.label || meshName,
            canvas: canvas
          };
        }
      }

      try {
        for await (const layer of generatePngLayers()) {
          this.c3d.preloader.set(this.c3d.lang['creating-png'] + '\n' + layer.label + '...');
          await new Promise(resolve => setTimeout(resolve, 50)); 

          const drawedCanvas = await this._getCanvas(
            layer.canvas, 
            layer.meshName, 
            this.c3d.lang['creating-png'], 
            layer.index + ' - ' + layer.total
          );

          await new Promise(resolve => setTimeout(resolve, 50));

          const blob = await new Promise((resolve, reject) => {
            drawedCanvas.toBlob((b) => {
              if (b) {
                resolve(b);
              } else {
                reject(new Error(`For '${layer.meshName}' can't create PNG Blob! (Memory may be insufficient)`));
              }
            }, 'image/png', 1.0);
          });

          const a = document.createElement('a');
          const blobUrl = URL.createObjectURL(blob);
          a.href = blobUrl;
          a.download = layer.meshName + '.png';
          
          document.body.appendChild(a);
          a.click();
          a.remove();

          await new Promise(resolve => setTimeout(resolve, 500));
          URL.revokeObjectURL(blobUrl);
        }
      } catch (error) {
        alert("Export PNG Error:", error);
        console.error("Export PNG Error:", error);
      } finally {
        this.c3d.showHideUI.enableContainer();
        setTimeout(() => {
          this.c3d.preloader.hide();
          this.c3d.render3d.renderAll(true);
        }, 1000);
      }
    }


    async _getCanvas(canvas, meshName, str, count)
    {
      const yieldToMainThread = () => new Promise(resolve => setTimeout(resolve, 0));
      const layersDiv = document.querySelector(this.c3d.props.layers);
      const layers = layersDiv.querySelectorAll('[data-mesh=\'' + meshName + '\'] > div.content > div.layers > div');

      if(!layers.length)
      {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 1;
        tempCanvas.height = 1;
        return tempCanvas;
      }

      // write layers
      for (let j = layers.length - 1; j >= 0; j--)
      {
        const layer = layers[j].self;

        if(!layer.visible) continue;

        await yieldToMainThread();
        
        this.c3d.preloader.set(
          '<span style="font-size:1.5rem;">' + str + '</span><br>' + 
          'Drawing Layers to Canvas...<br>' + 
          'Page: ' + count + ' ( ' + meshName + ' )<br>' + 
          '<span style="font-size:2rem;">' + Math.floor((layers.length - j) / layers.length * 100) + '%</span>'
        );
          
        // draw image to canvas
        drawLayerToCTX(this.c3d, canvas, layer, true);

      }

      return canvas;

    }

}
