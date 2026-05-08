export const about = async (c3d, container) =>
{
    
    const content = document.createElement('div');
    const div = document.createElement('div');

    div.classList.add('about');
    div.innerHTML = `
        <button>About</button>
    `;

    div.querySelector('button').addEventListener('click', () =>
    {
        content.style.display = 'flex';
        content.style.zIndex = c3d.zIndex.index; // move to top
    });

    container.appendChild(div);


    content.classList.add('about');
    content.innerHTML = `
        <img src="${C3D_SERVER}svg/customizer_3D_logo.svg?c3d=101" alt="Customizer3D Logo" class="logo">

        <p class="title">Used Libraries</p>

        <div>
            <p>Three.js</p>
            <a href="https://threejs.org" target="_blank">#</a>
        </div>
        <div>
            <p>LibPDF</p>
            <a href="https://github.com/LibPDF-js/core" target="_blank">#</a>
        </div>
        <div>
            <p>PDF.js</p>
            <a href="https://mozilla.github.io/pdf.js?c3d=101" target="_blank">#</a>
        </div>
        <div>
            <p>jsColorEngine</p>
            <a href="https://github.com/glennwilton/jsColorEngine" target="_blank">#</a>
        </div>
        <div>
            <p>JS Color Picker</p>
            <a href="https://www.jscolorpicker.com?c3d=101" target="_blank">#</a>
        </div>
        <div>
            <p>opentype.js</p>
            <a href="https://opentype.js.org?c3d=101" target="_blank">#</a>
        </div>
        <div>
            <p>fflate</p>
            <a href="https://101arrowz.github.io/fflate" target="_blank">#</a>
        </div>
        <div>
            <p>GSAP 3</p>
            <a href="https://gsap.com" target="_blank">#</a>
        </div>
        <div>
            <p>PrismJS</p>
            <a href="https://prismjs.com" target="_blank">#</a>
        </div>
        <div class="thanks">
            <p>Also, many thanks to the people who shared your knowledge on <a href="https://stackoverflow.com" target="_blank">stackoverflow.com</a></p>
        </div>

        <p class="title">3D Model, Material Providers</p>

        <div>
            <p>cgtrader</p>
            <a href="https://www.cgtrader.com" target="_blank">#</a>
        </div>
        <div>
            <p>sketchfab</p>
            <a href="https://sketchfab.com" target="_blank">#</a>
        </div>
        <div>
            <p>ambientCG</p>
            <a href="https://ambientcg.com" target="_blank">#</a>
        </div>

        <p class="title">Icons</p>

        <div>
            <p>I am Vector</p>
            <a href="https://iamvector.com" target="_blank">#</a>
        </div>

        <p class="title">AI</p>

        <div>
            <p>gemini</p>
            <a href="https://gemini.google.com" target="_blank">#</a>
        </div>
    `;
    
    content.addEventListener('click', () => {
        content.style.display = 'none';
    });

    document.querySelector(c3d.props.container).appendChild(content);

}
