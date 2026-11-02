
import {Customizer3D} from 'customizer3D_dir/Customizer3D.js?c3d=0.6.2';
import {isMobile} from 'customizer3D_dir/utils/isMobile.js?c3d=0.6.2';
import {ExtractImages} from 'customizer3D_dir/layers/utils/ExtractImages.js?c3d=0.6.2';

window.C3D = new Customizer3D();


const activeModule = 'Flyer';
await C3D.initialize(
    C3D_MODELS_DIR + activeModule + '/' + activeModule + '.glb',
    C3D_MODELS_DIR + activeModule + '/' + activeModule + '.js'
);


const customizer = document.querySelector('section.customizer');
const examples = document.querySelector('section.examples');

examples.style.zIndex = window.C3D.zIndex.index;
examples.addEventListener('click', () => {
    examples.style.left = -(examples.offsetWidth + 100) + 'px';
})

const samplesButton = customizer.querySelector('div.samplesButton');
samplesButton.style.zIndex = window.C3D.zIndex.index;
samplesButton.addEventListener('click', () => {
    examples.style.left = '0px';
});


const dropAreaButton = examples.querySelector('div.files-drop-area > label > span');
dropAreaButton.innerHTML = C3D.lang['open-files-selector'];

const dropArea = examples.querySelector('div.files-drop-area');

const dropAreaH1 = examples.querySelector('div.files-drop-area > h1');
dropAreaH1.innerHTML = C3D.lang['files-selector-title'];
if(isMobile()) {
    dropAreaH1.innerText = C3D.lang['files-selector-title2'];
}


const C3D_DIR = C3D_SERVER + 'examples/C3D/';
examples.querySelectorAll('img[data-c3d]').forEach(img => {
    img.addEventListener('click', async () => {
        setTimeout(async () =>
        {
            await C3D.file.open(
                C3D_DIR + img.dataset.c3d
            );
        }, 750);
    });
});


const preventDefaults =  (e) =>  {
    e.preventDefault();
    e.stopPropagation();
};

const highlight = (e)  => {
    dropArea.classList.add('highlight')
};
const unhighlight = (e)  => {
    dropArea.classList.remove('highlight')
};

const extractFiles = new ExtractImages({c3d: C3D});
const handleDrop = async (e)  =>
{
    const files = e.target?.files ? e.target.files : e.dataTransfer.files;
    
    const _end = () => examples.click();
    
    let filesArray = [];
    for(let i = 0; i < files.length; i++)
    {
        const file = files[i];
        filesArray = filesArray.concat(await extractFiles.extract(file));
    }

    if(filesArray.length == 0)
    {
        alert("No valid file found!\nPlease choose a valid File type!");
        return;
    }

    if(filesArray.length == 1)
    {
        _end();

        setTimeout(async () =>
        {
            const blob = filesArray[0].blob;
            const fileType = filesArray[0].detectedFileType;
            
            switch (fileType)
            {
                case 'application/x-customizer3d':

                    await C3D.file.open(blob);

                break;

                case 'model/gltf-binary':
                case 'model/fbx':
                case 'model/obj':
                case 'model/stl':

                    // await C3D.file.new3D(blob);
                    alert('new 3D');

                break;

                case 'image/svg+xml':

                    const svg = await C3D.file._Open.loadImageFromBlob(blob, fileType);

                    await C3D.file._New._createNewFile(svg.naturalWidth, svg.naturalHeight, 'px', 300);
                    
                    const svgLayers = document.querySelector(C3D.props.layers + ' > div.content > div.layer > div.content > div.layers');
                    
                    const svgLayer = await C3D.layers.addThreeDLogo(svgLayers, {
                        image: svg,
                        detectedFileType: fileType
                    });

                    C3D.render3d.renderAll(true);
                    
                break;
            
                default:

                    const img = await C3D.file._Open.loadImageFromBlob(blob, fileType);

                    await C3D.file._New._createNewFile(img.naturalWidth, img.naturalHeight, 'px', 300);
                    
                    const layers = document.querySelector(C3D.props.layers + ' > div.content > div.layer > div.content > div.layers');
                    
                    const layer = await C3D.layers.addImage(layers, {
                        image: img,
                        detectedFileType: fileType,
                        changeable: true
                    });

                    C3D.render3d.renderAll(true);
                    
                break;
            }
        }, 750);
        return;
    }
    
    // Add Images to Layers

    setTimeout(async () =>
    {
        let docCreated = false;

        for(let i = 0; i < filesArray.length; i++)
        {
            const blob = filesArray[i].blob;
            const fileType = filesArray[i].detectedFileType;

            if(fileType == 'application/x-customizer3d' || 
                fileType == 'model/gltf-binary' || 
                fileType == 'model/fbx' || 
                fileType == 'model/obj' || 
                fileType == 'model/stl' 
            ) {
                continue;
            }

            
            const img = await C3D.file._Open.loadImageFromBlob(blob, fileType);

            if(!docCreated)
            {
                await C3D.file._New._createNewFile(img.naturalWidth, img.naturalHeight, 'px', 300);
                docCreated = true;
            }

            const layers = document.querySelector(C3D.props.layers + ' > div.content > div.layer > div.content > div.layers');
            
            const layer = await C3D.layers.addImage(layers, {
                image: img,
                detectedFileType: fileType,
                changeable: true
            });
        }

        C3D.render3d.renderAll(true);
        C3D._setNavActive('area', true, false);
    }, 750);
    
};

const cancelUpload = (e)  => {
    examples.style.left = '0px';
};


;['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false);
    document.body.addEventListener(eventName, preventDefaults, false);
})

;['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, highlight, false);
})

;['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, unhighlight, false);
})

dropArea.addEventListener('drop', handleDrop, false);
dropArea.querySelector('input[type="file"]').addEventListener('change', handleDrop);
dropArea.querySelector('input[type="file"]').addEventListener('cancel', cancelUpload);
