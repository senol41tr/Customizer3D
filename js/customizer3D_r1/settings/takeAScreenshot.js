export const takeAScreenshot = async (c3d, container) =>
{
    const div = document.createElement('div');
    div.classList.add('takeAScreenshot');
    div.style.paddingTop = '1rem';
    div.innerHTML = `<a href="javascript:void(0);" title="">${c3d.lang['take-a-screenshot']}</a>`;
    
    div.querySelector('a').addEventListener('click', async () =>
    {
        // disable UI during processing
        const container = document.querySelector(c3d.props.container);
        container.style.pointerEvents = 'none';
        container.style.opacity = 0.5;

        c3d.preloader.show();
        c3d.preloader.set(c3d.lang['take-a-screenshot']);
        
        c3d.three.render();

        const canvasBlob = await new Promise(resolve => c3d.three.renderer.domElement.toBlob(resolve, 'image/png', 1.0));
        const blob = new Blob( [canvasBlob], {type:'image/png'});

        const a = document.createElement('a');
        const blobUrl = URL.createObjectURL(blob);
        a.href = blobUrl;
        a.download = c3d.props.modelName + '_Screenshot.png';
        a.click();
        a.remove();
        setTimeout(() =>
        {

            URL.revokeObjectURL(blobUrl);
            
            container.style.pointerEvents = 'all';
            container.style.opacity = 1;
            c3d.preloader.hide();

        }, 200);

    });

    container.appendChild(div);
    
}
