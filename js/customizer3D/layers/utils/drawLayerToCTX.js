import {calculateAspectRatioFit} from 'customizer3D_dir/utils/calculateAspectRatioFit.js?c3d=0.5.6';
import {degToRad} from 'customizer3D_dir/utils/degToRad.js?c3d=0.5.6';

export const drawLayerToCTX = (c3d, canvas, layer, isExport) =>
{  
  const ctx = canvas.getContext('2d', {willReadFrequently: true});

  switch (layer.type)
  {
      case 'solid':

          ctx.save();
          ctx.fillStyle = layer.color;
          if(layer.type == 'solid') ctx.globalAlpha = layer.opacity / 100;
          ctx.globalCompositeOperation = layer.blendMode;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.restore();

      break;

      case 'text':

          if(layer.text == '') return;

          const canvasText = c3d.textLayer.htmlEl.querySelector('canvas.preview');
          const xText = layer.textPosition.x * canvas.width / canvasText.width;
          const yText = layer.textPosition.y * canvas.height / canvasText.height;

          if(isExport) layer.updateCanvas(isExport);
          
          ctx.save();
          ctx.globalCompositeOperation = layer.blendMode;
          ctx.globalAlpha = layer.opacity / 100;
          ctx.translate(xText, yText);
          ctx.drawImage(layer.canvas, 0, 0, canvas.width, canvas.height);
          ctx.restore();

      break;

      case 'image':
      case 'threeDText':

          if(!layer.image) break;

          // recreate canvas image
          if(isExport || (layer.updateCanvas && c3d.render3d._preDPI != c3d.settings.getRenderDPI()))
          {
            layer.updateCanvas(isExport);

            if(layer.type == 'threeDText')
            {
                const l = c3d.threeDTextLayer;
                l.layer = layer;
                l._create();
                l.bakeImageToLayer(isExport);
            }
          }

          const fx = Object.keys(layer.effects).length > 0;
          const source = fx ? layer.effectsCanvas : layer.image;
          const textureDims = calculateAspectRatioFit(
              source[fx || layer.type != 'image' ? 'width' : 'naturalWidth'], 
              source[fx || layer.type != 'image' ? 'height' : 'naturalHeight'], 
              canvas.width,
              canvas.height
          );
          const canvasPreviewImage = c3d[layer.type + 'Layer'].htmlEl.querySelector('canvas.preview');
          const multiplyer = Math.max(1, layer.zoom / 100);
          const xImage = canvas.width / canvasPreviewImage.width * (layer.imagePosition.x * multiplyer);
          const yImage = canvas.height / canvasPreviewImage.height * (layer.imagePosition.y * multiplyer);
          ctx.save();
          ctx.globalCompositeOperation = layer.blendMode;
          ctx.globalAlpha = layer.opacity / 100;
          ctx.translate(canvas.width / 2 + xImage, canvas.height / 2 + yImage);
          ctx.rotate(degToRad(layer.rotation));
          ctx.scale(layer.zoom / 100, layer.zoom / 100);
          ctx.drawImage(
              layer.canvas, 
              -textureDims.width / 2, 
              -textureDims.height / 2, 
              textureDims.width, 
              textureDims.height
          );
          ctx.restore();

      break;

      case 'shape':

          ctx.save();
          ctx.globalCompositeOperation = layer.blendMode;
          ctx.globalAlpha = layer.opacity / 100;
          ctx.drawImage(layer.canvas, 0, 0, canvas.width, canvas.height);
          ctx.restore();

      break;

      default: 

          console.warn('Undefined layer type! ' + layer);

      break;

  }
}