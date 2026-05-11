import * as opentype from "base/opentype/opentype.esm.js";
import * as fflate from 'base/fflate@0.8.2/fflate.esm.js';
import * as BlendModes from 'customizer3D_dir/layers/BlendModes/BlendModes.js?c3d=102';
import {Size} from 'customizer3D_dir/utils/Size.js?c3d=102';
import {trimCanvas} from 'customizer3D_dir/utils/trimCanvas.js?c3d=102';
import {BlobtoUint8Array} from 'customizer3D_dir/utils/BlobtoUint8Array.js?c3d=102';
import {Base64ToUint8} from 'customizer3D_dir/utils/Base64ToUint8.js?c3d=102';
import {PDF, cmyk, ops} from 'base/libpdf@0.3.4/libpdf.min.esm.js';
// import {getPrintDims} from 'customizer3D_dir/utils/getPrintDims.js?c3d=102';
import {calculateAspectRatioFit} from 'customizer3D_dir/utils/calculateAspectRatioFit.js?c3d=102';

export class Export
{
    constructor(c3d)
    {
        this.c3d = c3d;
    }

    async exportAsPDF()
    {
      // disable UI during processing
      const container = document.querySelector(this.c3d.props.container);
      container.style.pointerEvents = 'none';
      container.style.opacity = 0.5;
      document.body.style.overflow = 'hidden';

      this.c3d.preloader.show();
      this.c3d.preloader.set(this.c3d.lang['creating-pdf']);

      const DPI = 300;
      const filesToZip = {};
      const fonts = {};
      const layersData = Object.entries(this.c3d.props.data);
      const layersDiv = document.querySelector(this.c3d.props.layers);
      const exportOptions = this.c3d.settings.getExportOptions();
      const ce = this.c3d.colorEngine;

      let page,
      response,
      uint8Array,
      image,
      width,
      height,
      font,
      x,
      y;


      // CREATE NEW PDF

      const pdf = PDF.create();


      // SET PDF PROPERTIES

      pdf.setTitle(this.c3d.props.modelName, { showInWindowTitleBar: true });
      pdf.setAuthor('Customizer3D (https://ssarigul.tr/Customizer3D)');
      pdf.setCreator('LibPDF (https://libpdf.dev)');
      pdf.setProducer("@libpdf/core");



      // TAKE SCREENSHOT OF MODEL VIEWS

      this.c3d.preloader.set(this.c3d.lang['being-exported'] + '<br>Taking Screenshots...');

      const preview = 
      {
        totalWidth: 0,
        totalHeight: 0,
        width: 0,
        height: 0,
        canvases: [],
        canvas: document.createElement('canvas'),
        ctx: null
      };

      for (let i = 0; i < layersData.length; i++)
      {
        const meshName = layersData[i][0];

        // rotate model
        this.c3d.setView(meshName, 'set');
        this.c3d.three.renderer.render(this.c3d.three.scene, this.c3d.three.camera);
        
        const canvas3D = trimCanvas(this.c3d.three.getCanvas());
        preview.canvases.push(canvas3D);

        preview.totalWidth += canvas3D.width;
        preview.totalHeight = Math.max(preview.totalHeight, canvas3D.height);

        // mesh with predefined color(s) or image(s)
        const mat = layersData[i][1]?.materials;
        if (mat && (mat.colors || mat.url || mat.colorOnly)) break;
      }

      // reset view
      const activeView = document.querySelector(this.c3d.props.layers + ' > div.content div.active');
      if(activeView) activeView.click();
      else this.c3d.setView('', 'set');

      preview.ctx = preview.canvas.getContext('2d');
      preview.canvas.width = preview.totalWidth;
      preview.canvas.height = preview.totalHeight;
      
      for (let i = 0; i < preview.canvases.length; i++)
      {
        const canvas = preview.canvases[i];
        preview.width = canvas.width / 1.5;
        preview.height = canvas.height / 1.5;
        preview.ctx.drawImage(canvas, preview.canvas.width / preview.canvases.length * i + 50, (preview.canvas.height - preview.height) / 2, preview.width, preview.height);
      }


      // ADD MODEL VIEWS TO PDF

      const defaultSizeInPx = 1240;
      const previewImgDims = calculateAspectRatioFit(preview.canvas.width, preview.canvas.height, defaultSizeInPx, defaultSizeInPx);
      width = new Size({size: previewImgDims.width + 'px', DPI}).pt;
      height = new Size({size: previewImgDims.height + 'px', DPI}).pt;

      page = pdf.addPage({width, height, orientation: height > width ? 'portrait' : 'landscape'});

      // ADD IMAGE
      response = await new Promise(resolve => preview.canvas.toBlob(resolve, 'image/png', 1.0));
      uint8Array = await BlobtoUint8Array(response);
      image = pdf.embedPng(uint8Array);
      
      page.drawImage(image, {x: 0, y: 0, width, height});


      // ADD DEFAULT FONT (which can support multi-language)

      const defaultFont = 'Signika-Regular';
      if(!fonts[defaultFont])
      {
        response = await fetch(C3D_SERVER + 'fonts/' + defaultFont + '.ttf');
        uint8Array = new Uint8Array(await response.arrayBuffer());
        font = fonts[defaultFont] = await pdf.embedFont(uint8Array);
      }

      // ADD LAYERS TO PDF

      for (let i = 0; i < layersData.length; i++)
      {

        const meshName = layersData[i][0];
        const layers = layersDiv.querySelectorAll('[data-mesh=\'' + meshName + '\'] > div.content > div.layers > div');
        const label = layersData[i][1].label || this.c3d.lang[meshName] || layersData[i][0];

        // get size
        const printSize = layersData[i][1].printSize;
        const material = layersData[i][1]?.materials?.[0];
        
        if(printSize)
        {
          width = new Size({size: printSize.width, DPI}).pt;
          height = new Size({size: printSize.height, DPI}).pt;
        }
        else if(material.colorOnly || material.colors)
        {
          width = new Size({size: '10cm', DPI}).pt;
          height = new Size({size: '10cm', DPI}).pt;
        }


        // ADD NEW PAGE

        page = pdf.addPage({width, height, orientation: height > width ? 'portrait' : 'landscape'});


        // WRITE LAYERS TO PDF

        for (let j = layers.length - 1; j >= 0; j--)
        {
          const layer = layers[j].self;

          if(!layer.visible) continue;

          this.c3d.preloader.set(
            this.c3d.lang['being-exported'] + '<br>' + 
            '<b>' + label + '... %' + Math.floor(((layers.length + layersData.length - j - i) / (layers.length + layersData.length) * 100)) + '</b><br>' + 
            (layer.fileName || '')
          );

          // SET BLEND MODE

          const gs = pdf.createExtGState({
            fillOpacity: layer.opacity ? layer.opacity / 100 : 1.0,
            strokeOpacity: layer.opacity ? layer.opacity / 100 : 1.0,
            blendMode: BlendModes.getName(layer.blendMode)
          });
          
          const gsName = page.registerExtGState(gs);
          page.drawOperators([
            ops.pushGraphicsState(),
            ops.setGraphicsState(gsName),
          ]);

          switch (layer.type)
          {
              case 'color':
              case 'colorOnly':
              case 'solid':
                
                ce.cmyk(layer.color);                
                
                page.drawRectangle({
                  x: 0,
                  y: 0,
                  width,
                  height,
                  color: cmyk(ce.color.C, ce.color.M, ce.color.Y, ce.color.K),
                  // opacity: layer.type == 'solid' ? layer.opacity / 100 : 1
                });

                if(layer.type == 'colorOnly' || layer.type == 'color')
                {
                  ce.hex(layer.color, false);
                  const hex = ce.color;

                  ce.rgb(layer.color, false);
                  const rgb = ce.color;

                  ce.cmyk(layer.color, false);
                  const cmykString = `${Math.round(ce.color.C * 100)}% ${Math.round(ce.color.M * 100)}% ${Math.round(ce.color.Y * 100)}% ${Math.round(ce.color.K * 100)}%`;

                  ce.invert(layer.color, true, false);
                  ce.cmyk(ce.color, false);
                  const textColor = ce.color;

                  const colorInfos = `${label}\nHEX: ${hex.toUpperCase()}\nRGB: ${rgb}\nCMYK: ${cmykString}`;
                  page.drawText(colorInfos,
                  {
                    font,
                    x: 10,
                    y: height - 20,
                    size: 10,
                    lineHeight: 13,
                    color: cmyk(textColor.C, textColor.M, textColor.Y, textColor.K)
                  });
                }
                
              break;
              
              case 'text':

                  if(layer.text == '') continue;


                  // 3D TEXT (EMBED AS PNG)

                  if(layer.is3D)
                  {
                    response = await this.c3d.render3d.getImage(layer, DPI);
                    uint8Array = await BlobtoUint8Array(response);
                    image = pdf.embedPng(uint8Array);

                    page.drawImage(image,{x:0, y:0, width, height});
                    continue;
                  }

                  // SOLID TEXT LAYER
                  
                  if(!fonts[layer.font])
                  {

                    const fontData = this.c3d.textLayer.getFontData(layer.font);
                    const rawBase64 = fontData.base64.split(',')[1];
                    uint8Array = Base64ToUint8(rawBase64);

                    // add to pdf
                    font = fonts[layer.font] = await pdf.embedFont(uint8Array);

                    // add to zip
                    if(exportOptions.addFonts) filesToZip['fonts/' + font.name + '.ttf'] = [uint8Array];

                  }
                  else
                  {
                    font = fonts[layer.font];
                  }


                  ///////////////////////////////////
                  // @TODO: REVISE THIS CODE BLOCK //
                  ///////////////////////////////////

                  const canvasWidthInPt = new Size({size: this.c3d.textLayer.canvas.width + 'px', DPI:96}).pt;
                  const pageWidthInPt = new Size({size: printSize.width, DPI:96}).pt;
                  const fontSizeInPt = layer.fontSize * 96 / 300 * pageWidthInPt / canvasWidthInPt * this.c3d.PIXEL_RATIO; // !!!

                  ce.cmyk(layer.color);

                  const unitsPerEm = font.fontProgram.unitsPerEm || 1000;
                  const ascentInPoints = font.fontProgram.ascent / unitsPerEm * 72 / 96; // !!!
                  const descentInPoints = Math.abs(font.fontProgram.descent) / unitsPerEm * 72 / 96; // !!!

                  const strWidth = font.widthOfTextAtSize(layer.text, fontSizeInPt);
                  const strHeight = font.heightAtSize(fontSizeInPt);

                  x = ((layer.textPosition.x + 0.5) * width) - (strWidth / 2);
                  y = ((layer.textPosition.y + 0.5) * height) - (strHeight * (ascentInPoints + descentInPoints) / 2);

                  if(exportOptions.convertToOutline)
                  {
                    response = await fetch(this.c3d.textLayer.getFontData(layer.font).base64);
                    const opentypeFont = opentype.parse(await response.arrayBuffer());
                    const path = opentypeFont.getPath(layer.text, 0, 0, fontSizeInPt);
                    const svgPathData = path.toPathData(2);

                    // const bbox = path.getBoundingBox();
                    // const strWidth = opentypeFont.getAdvanceWidth(layer.text, fontSizeInPt);
                    // const strHeight = bbox.y2 - bbox.y1;

                    page.drawSvgPath(svgPathData,
                    {
                      x,
                      y,
                      color: cmyk(ce.color.C, ce.color.M, ce.color.Y, ce.color.K)
                      // opacity: layer.opacity / 100
                    });
                  }
                  else
                  {
                    page.drawText(layer.text,
                    {
                      font,
                      x,
                      y,
                      size: fontSizeInPt,
                      color: cmyk(ce.color.C, ce.color.M, ce.color.Y, ce.color.K)
                      // rotate: {angle: -layer.rotation, origin: 'center'}
                    });
                  }

              break;
              
              default:
              case 'image':
                
                if(!layer.image) continue;

                const texture = layersDiv.querySelector('[data-mesh=\'' + meshName + '\'] > div.content > div.buttons > img.active');

                if(texture)
                {
                  response = await fetch(texture.src);
                  uint8Array = await response.bytes();
                  image = pdf.embedImage(uint8Array);

                  const textureWidthInPt = new Size({size: texture.naturalWidth + 'px', DPI}).pt;
                  const textureHeightInPt = new Size({size: texture.naturalHeight + 'px', DPI}).pt;
                  const previewImgDims = calculateAspectRatioFit(textureWidthInPt, textureHeightInPt, width, height);
                  
                  page.drawImage(image,{x: (width - previewImgDims.width) / 2, y: 0, width: previewImgDims.width, height: previewImgDims.height});
                }
                else
                {
                  response = await this.c3d.render3d.getImage(layer, DPI);
                  uint8Array = await BlobtoUint8Array(response);
                  image = pdf.embedPng(uint8Array);

                  page.drawImage(image,{x: 0, y: 0, width, height});
                }

              break;

          }

          // END OF BLEND MODE

          page.drawOperators([
            ops.popGraphicsState(),
          ]);

        }

      }



      

      // SELECT DOWNLOAD OPTION

      let blob;
      uint8Array = await pdf.save();
      const date = new Date();
      let fileName = this.c3d.props.modelName + '_'+ (date.getMonth() + 1) + '.' + date.getDate();

      if(exportOptions.addFonts)
      {
        // ADD README.TXT

        filesToZip[this.c3d.lang['readme'] + '.txt'] = [fflate.strToU8(this.c3d.lang['readme_txt'])];
        
        // ADD PDF TO ZIP
        
        filesToZip[this.c3d.props.modelName + '.pdf'] = [uint8Array];

        // ZIP

        blob = new Blob([
          fflate.zipSync(filesToZip, {
              level:9, 
              mem:12
          })
        ], {type:'application/zip'});
        fileName += '.zip';

        this.c3d.preloader.set(this.c3d.lang['downloading-zip']);

      }
      else
      {
        // DIRECT PDF OUTPUT
        blob = new Blob([uint8Array], {type:'application/pdf'});
        fileName += '.pdf';
        this.c3d.preloader.set(this.c3d.lang['downloading-pdf']);
      }

      // DOWNLOAD

      const a = document.createElement('a');
      const blobUrl = URL.createObjectURL(blob);
      a.href = blobUrl;
      a.download = fileName;
      a.click();
      a.remove();

      // 
      setTimeout(() =>
      {
        this.c3d.preloader.hide();
        URL.revokeObjectURL(blobUrl);
      }, 1000);

      // Enable UI
      container.style.pointerEvents = 'all';
      container.style.opacity = 1;
      document.body.style.overflow = 'auto';
      this.c3d.three.render();

    }

}
