import {GUI} from 'three_dir/libs/lil-gui.module.min.js';
import * as THREE from 'three';

export class MaterialBrowser
{
  constructor(c3d)
  {
    this.c3d = c3d;
    
    this._opendFolder = null;
    
    this.root = 'js/customizer3D/three/material/assets/';
    this._defaultMatcap = this.root + 'matcaps/gold/27.webp';
    this.layer = null;
    this.backToGUI = null;
    this.callback = null;
    this.gui = null;
    this.materialList = null;

  }


  async show(layer, backToGUI, callback)
  {  
    this.layer = layer;
    this.backToGUI = backToGUI;
    this.callback = callback;

    this.gui = new GUI({title: 'Material Browser', width: 190});
    this.gui.domElement.style.zIndex = this.c3d.zIndex.index;

    await this._createMaterialList();

  }

  hide()
  {
    if(this.gui) this.gui.destroy();
    if(this.backToGUI) this.backToGUI.domElement.style.display = 'flex';
  }

  async _createMaterialList()
  {
    const base64Data = this.root + 'envmaps/01.jpg';
    const textureCube = await new THREE.CubeTextureLoader().loadAsync([
        base64Data, base64Data,
        base64Data, base64Data,
        base64Data, base64Data
    ]);


    const mo = this.layer.options.materialOptions;

    this.materialList =
    {
        MeshStandardMaterial:
        {
          label: 'Standard Material',
          options:
          {
            emissive: mo.emissive || '#000000',
            roughness: {min:0.0, max: 1.0, value: mo.roughness || 0.5, step: 0.01},
            metalness: {min:0.0, max: 1.0, value: mo.metalness || 1.0, step: 0.01}
          }
        },

        MeshPhysicalMaterial:
        {
          label: 'MeshPhysicalMaterial',
          options:
          {
            metalness: {min:0.0, max: 1.0, value: mo.metalness || 0.3, step: 0.01},
            roughness: {min:0.0, max: 1.0, value: mo.roughness || 0.1, step: 0.01},
            transmission: {min:0.0, max: 1.0, value: mo.transmission || 0.0, step: 0.01},
            ior: {min:0.0, max: 10.0, value: mo.ior || 1.45, step: 0.01},
            thickness: {min:0.0, max: 5.0, value: mo.thickness || 0.7, step: 0.01},
            clearcoat: {min:0.0, max: 1.0, value: mo.clearcoat || 0.0, step: 0.01},
            clearcoatRoughness: {min:0.0, max: 1.0, value: mo.clearcoatRoughness || 0.0, step: 0.01},
            reflectivity: {min:0.0, max: 3.0, value: mo.reflectivity || 1.0, step: 0.01},
            specularIntensity: {min:0.0, max: 10.0, value: mo.specularIntensity || 4.0, step: 0.01},
            specularColor: '#ffffff',
            envMapIntensity: {min:0.0, max: 5.0, value: mo.envMapIntensity || 0.8, step: 0.01},
            anisotropy: {min:0.0, max: 1.0, value: mo.anisotropy || 0.0, step: 0.01},
            dispersion: {min:0.0, max: 1.0, value: mo.dispersion || 0.0, step: 0.01},
            iridescence: {min:0.0, max: 1.0, value: mo.iridescence || 0.0, step: 0.01},
            iridescenceIOR: {min:0.0, max: 2.33, value: mo.iridescenceIOR || 1.3, step: 0.01}
          }
        },

        MeshMatcapMaterial:
        {
          label: 'Matcap Material',
          options:
          {
          }
        }
    };

    this.gui.add({backToSettings: () => this.hide()}, 'backToSettings').name('Back to Settings').domElement.classList.add('btn-back');

    if(this.layer.options.materialOptions.color) 
    {
      const colorFolder = this.gui.addFolder('Color')
        .addColor(this.layer.options.materialOptions, 'color')
        .onChange((v) => {
          this.layer.options.materialOptions.color = v;
          this.callback();
        });
      colorFolder.domElement.querySelector('input[type=text]').remove()
      colorFolder.domElement.querySelector('div.name').remove();
      colorFolder.domElement.querySelector('div.display').style.height = '30px';
    }

    const materials = Object.keys(this.materialList);

    for (let z = 0; z < materials.length; z++)
    {
      const name = materials[z];
      const material = this.materialList[name];
      const folder = this.gui.addFolder(material.label);
      const optionsList = Object.keys(material.options);

      folder.$title.addEventListener('click', async () =>
      {
        if(this._opendFolder && folder !== this._opendFolder) this._opendFolder.close();
        this._opendFolder = folder;
        
        let mo = this.layer.options.materialOptions;
        this.layer.options.material = name;
        mo = Object.assign(mo, material.options);
        mo.side = THREE.DoubleSide;
        
        if(name == 'MeshStandardMaterial') // !!!
        {
          delete mo.matcap;
          delete mo.transmission;
          delete mo.ior;
          delete mo.thickness;
          delete mo.clearcoat;
          delete mo.clearcoatRoughness;
          delete mo.reflectivity;
          delete mo.specularIntensity;
          delete mo.specularColor;
          delete mo.envMap;
          delete mo.envMapIntensity;
          delete mo.anisotropy;
          delete mo.dispersion;
          delete mo.iridescence;
          delete mo.iridescenceIOR;

          if(typeof mo.roughness == 'object') mo.roughness = material.options.roughness.value;
          if(typeof mo.metalness == 'object') mo.metalness = material.options.metalness.value;
          const activeMatcapDiv = this.gui.domElement.querySelector('div.matcapActive');
          if(activeMatcapDiv) activeMatcapDiv.classList.remove('matcapActive');
        }
        else if(name == 'MeshPhysicalMaterial')
        {
          delete mo.emissive;
          delete mo.matcap;
          mo.envMap = textureCube;

          if(typeof mo.transmission == 'object') mo.transmission = material.options.transmission.value;
          if(typeof mo.roughness == 'object') mo.roughness = material.options.roughness.value;
          if(typeof mo.metalness == 'object') mo.metalness = material.options.metalness.value;
          if(typeof mo.ior == 'object') mo.ior = material.options.ior.value;
          if(typeof mo.thickness == 'object') mo.thickness = material.options.thickness.value;
          if(typeof mo.clearcoat == 'object') mo.clearcoat = material.options.clearcoat.value;
          if(typeof mo.clearcoatRoughness == 'object') mo.clearcoatRoughness = material.options.clearcoatRoughness.value;
          if(typeof mo.reflectivity == 'object') mo.reflectivity = material.options.reflectivity.value;
          if(typeof mo.specularIntensity == 'object') mo.specularIntensity = material.options.specularIntensity.value;
          if(typeof mo.specularColor == 'object') mo.specularColor = material.options.specularColor.value;
          if(typeof mo.envMapIntensity == 'object') mo.envMapIntensity = material.options.envMapIntensity.value;
          if(typeof mo.anisotropy == 'object') mo.anisotropy = material.options.anisotropy.value;
          if(typeof mo.dispersion == 'object') mo.dispersion = material.options.dispersion.value;
          if(typeof mo.iridescence == 'object') mo.iridescence = material.options.iridescence.value;
          if(typeof mo.iridescenceIOR == 'object') mo.iridescenceIOR = material.options.iridescenceIOR.value;
        }
        else
        {
          delete mo.metalness;
          delete mo.roughness;
          delete mo.emissive;
          delete mo.transmission;
          delete mo.ior;
          delete mo.thickness;
          delete mo.clearcoat;
          delete mo.clearcoatRoughness;
          delete mo.reflectivity;
          delete mo.specularIntensity;
          delete mo.specularColor;
          delete mo.envMap;
          delete mo.envMapIntensity;
          delete mo.anisotropy;
          delete mo.dispersion;
          delete mo.iridescence;
          delete mo.iridescenceIOR;

          // if(!mo.matcap && !this.layer.__matcap) mo.matcap = this._defaultMatcap;
        }

        this.callback();

        if(folder.__inited) return;

        for (let x = 0; x < optionsList.length; x++)
        {
          const optionName = optionsList[x];
          const value = material.options[optionName];
          const label = optionsList[x].substring(0,1).toUpperCase() + optionsList[x].substring(1);

          switch (typeof value)
          {
            case 'string':

              if(value.startsWith('#'))
              {
                folder.addColor(this.layer.options.materialOptions, optionName)
                  .name(label)
                  .onChange((value) => {
                    this.callback();
                  })
                  .$text.remove();
              }
              else
              {
                folder.add(this.layer.options.materialOptions, optionName)
                  .name(label)
                  .onChange((value) => {
                    this.callback();
                  });
              }

            break;

            case 'object':

              folder.add(this.layer.options.materialOptions, optionName)
              .name(label)
              .min(value.min)
              .max(value.max)
              .step(value.step)
              .onChange((value) => {
                this.callback();
              })

            break;
          
            default:
              folder.add(this.layer.options.materialOptions, optionName)
                .name(label)
                .onChange((value) => {
                  this.callback();
                })
            break;
          }
        }


        if(name == 'MeshMatcapMaterial')
        {
          const response = await fetch(this.root + 'matcaps/index.json');
          const json = await response.json();
          const folders = Object.keys(json);

          for (let i = 0; i < folders.length; i++)
          {
            const matcapFolderName = folders[i];
            const images = json[matcapFolderName];
            const guiFolder = folder.addFolder(matcapFolderName.substring(0,1).toUpperCase() + matcapFolderName.substring(1));
            guiFolder.$title.style.pointerEvents = 'none';
            
            for (let j = 0; j < images.length; j++)
            {
              const image = images[j];
              const imageName = 'matcaps/' + matcapFolderName + '/' + image;   
              const thumbnailURL = this.root + imageName + '_thumb.webp';
              const matcapURL = this.root + imageName + '.webp';
              const isActive = this.layer.options.materialOptions.matcap == matcapURL;

              const matcapDiv = document.createElement('div');
              matcapDiv.classList.add('matcap');
              if(isActive) matcapDiv.classList.add('matcapActive');
              matcapDiv.innerHTML = `<img src="${thumbnailURL}" alt="${matcapFolderName + image}">`;

              guiFolder.$children.appendChild(matcapDiv);

              matcapDiv.addEventListener('click', () =>
              {
                const preMatcapActive = folder.domElement.querySelector('div.matcapActive');
                if(preMatcapActive) preMatcapActive.classList.remove('matcapActive');
                matcapDiv.classList.add('matcapActive');
                this.layer.options.materialOptions.matcap = matcapURL;
                this.callback();
              });

            }
          }
        }

        folder.__inited = true;

      });
      

      folder.close();
      
      if(this.layer.options.material == name) folder.$title.click();

    }

  }

}