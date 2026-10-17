export class ExtractImages
{
    constructor(o)
    {
      this.c3d = o.c3d;
    }

    // https://stackoverflow.com/a/68952225
    async extract(file)
    {
        this.c3d.preloader.show();
        this.c3d.preloader.set(this.c3d.lang['getting-image-data']);

        const blobs = [];

        // check file type
        let header = '', type;
        const arrayBuffer = await file.arrayBuffer();
        const fileSignature = new Uint8Array(arrayBuffer).subarray(0, 4).forEach((v) => header+=v.toString(16)); // https://stackoverflow.com/a/29672957
        switch (header)
        {
            case '52494646': type = 'image/webp'; break;
            case '89504e47': type = 'image/png'; break;
            case '25504446': type = 'application/pdf'; break;
            case '3c3f786d': type = 'image/svg+xml'; break;
            case '676c5446': type = 'model/gltf-binary'; break;

            case 'ffd8ffe0':
            case 'ffd8ffe1':
            case 'ffd8ffe2':
            case 'ffd8ffe3':
            case 'ffd8ffe8':
                type = 'image/jpeg';
                break;
            default:
                type = file.type;
                // alert('File Type mismatch!!\nSupported file types are [.pdf, .png, .jpg, .svg, .jpeg, .jfif, .pjpeg, .pjp]');
                // this.c3d.preloader.hide();
                // return blobs;
            break;
        }
        
        if(type != 'application/pdf' || type === 'model/gltf-binary')
        {
            blobs.push({blob: file, detectedFileType: type});
            this.c3d.preloader.hide();
            return blobs;
        }
        // else: file type is PDF 

        // 
        this.c3d.preloader.set(this.c3d.lang['loading-pdf']);

        // Read PDF
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(C3D_SERVER + 'js/pdfjs-dist@3.4.120/pdf.worker.min.js', import.meta.url).toString(); // https://stackoverflow.com/a/77555910
        const loadingTask = pdfjsLib.getDocument(arrayBuffer);
        const pdf = await loadingTask.promise;
        
        // get PDF version
        const pdfVersion = parseFloat((await file.text()).slice(5, 8)); // e.g. 1.4
        if (pdfVersion < 1.4)
        {
            alert("Selected PDF version is smaller than 1.4\nDetected PDF version is: " + pdfVersion + ", File Name: " + file.name);
            this.c3d.preloader.hide();
            return blobs;
        }

        // Render PDF Image(s)
        const self = this;
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++)
        {

            this.c3d.preloader.set(this.c3d.lang['getting-images'] + ' ' + this.c3d.lang['page'] + ' ' + pageNum + ' - ' + pdf.numPages);

            const page = await pdf.getPage(pageNum);

            let imgIndex = 1;
            let opList = await page.getOperatorList();
            for (let k = 0; k < opList.fnArray.length; k++) {
                if (opList.fnArray[k] == pdfjsLib.OPS.paintJpegXObject || opList.fnArray[k] == pdfjsLib.OPS.paintImageXObject) {
                    function getImage() {
                        return new Promise(async function (res, rej) {
                            let img = null
                            try {
//-------either get data from page.objs.get
                                img = page.objs.get(opList.argsArray[k][0])

                            } catch (err) {
                                if (opList.argsArray[k][0].startsWith("g_")) {
//---------or get data from page.commonObjs.get
                                    img = page.commonObjs.get(opList.argsArray[k][0])
                                } else {
                                    console.warn("An error occurred while retrieving images!\nDetected PDF version is: " + pdfVersion + "\nFile Name: " + file.name + "\nPAGE: " + pageNum);
                                    // console.log(err);
                                    res()
                                }
                            }
                            try {
//------------------ directly creating image data from returned array does not print proper image also sometimes throw error.
                            // var idata = new ImageData(img.data, img.width);
                                  var canvas = document.createElement('canvas');
                                  canvas.width = img.width;
                                  canvas.height = img.height;
                                
                                var ctx = canvas.getContext('2d');
//------------------- below function will process data and print proper image on provided canvas context. kind parameter in returned data is used in this function to prcess the data
                                self._putBinaryImageData(ctx, img)
                                // ctx.putImageData(idata, 0, 0);

                                function getCanvasBlob(canvas) {
                                    return new Promise(function (resolve, reject) {
                                        canvas.toBlob(function (blob) {
                                            resolve(blob)
                                        }, 'image/png', 1.0);
                                    })
                                }
                                getCanvasBlob(canvas).then((blob) => {
                                    blobs.push({blob, detectedFileType: 'image/png'});
                                    //zip.folder('images').file(`page-${i}-image-${imgIndex}`, blob, { base64: false });
                                    imgIndex++;
                                    res()
                                }).catch((err) => {
                                    console.warn("An error occurred while getting blob data!\nDetected PDF version is: " + pdfVersion + "\nFile Name: " + file.name + "\nPAGE:" + pageNum);
                                    res()
                                })
                            } catch (err) {
                                console.warn("An error occurred while creating canvas image!\nDetected PDF version is: " + pdfVersion + "\nFile Name: " + file.name + "\nPAGE:" + pageNum);
                                res()
                            }
                        })
                    }
                    await getImage()
                }
            }

        }

        this.c3d.preloader.hide();

        loadingTask.destroy();

        return blobs;
        
    }




// Posted by Pranjal Koshti, modified by community. See post 'Timeline' for change history
// Retrieved 2025-11-06, License - CC BY-SA 4.0

 _putBinaryImageData(ctx, imgData, transferMaps = null) {
 
    const FULL_CHUNK_HEIGHT = 16;

    const ImageKind = {
        GRAYSCALE_1BPP: 1,
        RGB_24BPP: 2,
        RGBA_32BPP: 3
      };

    if (typeof ImageData !== "undefined" && imgData instanceof ImageData) {
      ctx.putImageData(imgData, 0, 0);
      return;
    }

    const height = imgData.height,
          width = imgData.width;
    const partialChunkHeight = height % FULL_CHUNK_HEIGHT;
    const fullChunks = (height - partialChunkHeight) / FULL_CHUNK_HEIGHT;
    const totalChunks = partialChunkHeight === 0 ? fullChunks : fullChunks + 1;
    const chunkImgData = ctx.createImageData(width, FULL_CHUNK_HEIGHT);
    let srcPos = 0,
        destPos;
    const src = imgData.data;
    const dest = chunkImgData.data;
    let i, j, thisChunkHeight, elemsInThisChunk;
    let transferMapRed, transferMapGreen, transferMapBlue, transferMapGray;

    if (transferMaps) {
      switch (transferMaps.length) {
        case 1:
          transferMapRed = transferMaps[0];
          transferMapGreen = transferMaps[0];
          transferMapBlue = transferMaps[0];
          transferMapGray = transferMaps[0];
          break;

        case 4:
          transferMapRed = transferMaps[0];
          transferMapGreen = transferMaps[1];
          transferMapBlue = transferMaps[2];
          transferMapGray = transferMaps[3];
          break;
      }
    }

    if (imgData.kind === ImageKind.GRAYSCALE_1BPP) {
        function shadow(obj, prop, value) {
            Object.defineProperty(obj, prop, {
              value: value,
              enumerable: true,
              configurable: true,
              writable: false
            });
            return value;
          }
          function isLittleEndian() {
            var buffer8 = new Uint8Array(4);
            buffer8[0] = 1;
            var view32 = new Uint32Array(buffer8.buffer, 0, 1);
            return view32[0] === 1;
          }
        var IsLittleEndianCached = {
        get value() {
            return (0, shadow)(IsLittleEndianCached, 'value', (0, isLittleEndian)());
        }
        
        };
      const srcLength = src.byteLength;
      const dest32 = new Uint32Array(dest.buffer, 0, dest.byteLength >> 2);
      const dest32DataLength = dest32.length;
      const fullSrcDiff = width + 7 >> 3;
      let white = 0xffffffff;
      let black = IsLittleEndianCached.value ? 0xff000000 : 0x000000ff;

      if (transferMapGray) {
        if (transferMapGray[0] === 0xff && transferMapGray[0xff] === 0) {
          [white, black] = [black, white];
        }
      }

      for (i = 0; i < totalChunks; i++) {
        thisChunkHeight = i < fullChunks ? FULL_CHUNK_HEIGHT : partialChunkHeight;
        destPos = 0;

        for (j = 0; j < thisChunkHeight; j++) {
          const srcDiff = srcLength - srcPos;
          let k = 0;
          const kEnd = srcDiff > fullSrcDiff ? width : srcDiff * 8 - 7;
          const kEndUnrolled = kEnd & ~7;
          let mask = 0;
          let srcByte = 0;

          for (; k < kEndUnrolled; k += 8) {
            srcByte = src[srcPos++];
            dest32[destPos++] = srcByte & 128 ? white : black;
            dest32[destPos++] = srcByte & 64 ? white : black;
            dest32[destPos++] = srcByte & 32 ? white : black;
            dest32[destPos++] = srcByte & 16 ? white : black;
            dest32[destPos++] = srcByte & 8 ? white : black;
            dest32[destPos++] = srcByte & 4 ? white : black;
            dest32[destPos++] = srcByte & 2 ? white : black;
            dest32[destPos++] = srcByte & 1 ? white : black;
          }

          for (; k < kEnd; k++) {
            if (mask === 0) {
              srcByte = src[srcPos++];
              mask = 128;
            }

            dest32[destPos++] = srcByte & mask ? white : black;
            mask >>= 1;
          }
        }

        while (destPos < dest32DataLength) {
          dest32[destPos++] = 0;
        }

        ctx.putImageData(chunkImgData, 0, i * FULL_CHUNK_HEIGHT);
      }
    } else if (imgData.kind === ImageKind.RGBA_32BPP) {
      const hasTransferMaps = !!(transferMapRed || transferMapGreen || transferMapBlue);
      j = 0;
      elemsInThisChunk = width * FULL_CHUNK_HEIGHT * 4;

      for (i = 0; i < fullChunks; i++) {
        dest.set(src.subarray(srcPos, srcPos + elemsInThisChunk));
        srcPos += elemsInThisChunk;

        if (hasTransferMaps) {
          for (let k = 0; k < elemsInThisChunk; k += 4) {
            if (transferMapRed) {
              dest[k + 0] = transferMapRed[dest[k + 0]];
            }

            if (transferMapGreen) {
              dest[k + 1] = transferMapGreen[dest[k + 1]];
            }

            if (transferMapBlue) {
              dest[k + 2] = transferMapBlue[dest[k + 2]];
            }
          }
        }

        ctx.putImageData(chunkImgData, 0, j);
        j += FULL_CHUNK_HEIGHT;
      }

      if (i < totalChunks) {
        elemsInThisChunk = width * partialChunkHeight * 4;
        dest.set(src.subarray(srcPos, srcPos + elemsInThisChunk));

        if (hasTransferMaps) {
          for (let k = 0; k < elemsInThisChunk; k += 4) {
            if (transferMapRed) {
              dest[k + 0] = transferMapRed[dest[k + 0]];
            }

            if (transferMapGreen) {
              dest[k + 1] = transferMapGreen[dest[k + 1]];
            }

            if (transferMapBlue) {
              dest[k + 2] = transferMapBlue[dest[k + 2]];
            }
          }
        }

        ctx.putImageData(chunkImgData, 0, j);
      }
    } else if (imgData.kind === ImageKind.RGB_24BPP) {
      const hasTransferMaps = !!(transferMapRed || transferMapGreen || transferMapBlue);
      thisChunkHeight = FULL_CHUNK_HEIGHT;
      elemsInThisChunk = width * thisChunkHeight;

      for (i = 0; i < totalChunks; i++) {
        if (i >= fullChunks) {
          thisChunkHeight = partialChunkHeight;
          elemsInThisChunk = width * thisChunkHeight;
        }

        destPos = 0;

        for (j = elemsInThisChunk; j--;) {
          dest[destPos++] = src[srcPos++];
          dest[destPos++] = src[srcPos++];
          dest[destPos++] = src[srcPos++];
          dest[destPos++] = 255;
        }

        if (hasTransferMaps) {
          for (let k = 0; k < destPos; k += 4) {
            if (transferMapRed) {
              dest[k + 0] = transferMapRed[dest[k + 0]];
            }

            if (transferMapGreen) {
              dest[k + 1] = transferMapGreen[dest[k + 1]];
            }

            if (transferMapBlue) {
              dest[k + 2] = transferMapBlue[dest[k + 2]];
            }
          }
        }

        ctx.putImageData(chunkImgData, 0, i * FULL_CHUNK_HEIGHT);
      }
    } else {
      throw new Error(`bad image kind: ${imgData.kind}`);
    }
  }

}
