
// gemini.google.com

import * as THREE from 'three';
import {getMaxLayers} from 'customizer3D_dir/settings/GPUInfo.js?c3d=104';

const MAX_GRADIENT_COLORS = 5;
const PARAMS_PER_LAYER = 5;

export const getMainUniforms = (c3d) =>
{
    const MAX_LAYERS = getMaxLayers(c3d); 

    const dataTexture = new THREE.DataTexture(
        new Float32Array(MAX_LAYERS * PARAMS_PER_LAYER * 4), 
        PARAMS_PER_LAYER, 
        MAX_LAYERS, 
        THREE.RGBAFormat, 
        THREE.FloatType
    );
    dataTexture.needsUpdate = true;

    return {
        tBase: { value: null },
        uLayerTextures: { value: null },
        uData: { value: dataTexture },
        uActiveLayerCount: { value: 0 },
        uRenderOrder: { value: new Uint8Array(MAX_LAYERS).fill(MAX_LAYERS - 1) },
        uAspect: { value: 1.0 }
    };
};

export const getMainVertexShader = (c3d) =>
{
    return `
        precision highp float;
        precision highp int;

        in vec3 position;
        in vec2 uv;
        in vec3 normal;

        out vec2 vUv;

        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
        uniform mat3 normalMatrix;

        void main() {
            vUv = uv;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * mvPosition;
        }
    `;
}


export const getMainFragmentShader = (c3d) =>
{
    const MAX_LAYERS = getMaxLayers(c3d);

    return `
        precision highp float;
        precision highp int;
        precision highp sampler2DArray;

        in vec2 vUv;
        out vec4 outColor;

        uniform float uAspect;
        uniform sampler2D tBase;
        uniform sampler2DArray uLayerTextures;
        uniform sampler2D uData;
        uniform int uActiveLayerCount;
        uniform int uRenderOrder[${MAX_LAYERS}];

        vec4 getParam(float layerIdx, float pixelIdx)
        {
            vec2 uv = vec2(pixelIdx / ${PARAMS_PER_LAYER}.0, (layerIdx + 0.5) / ${MAX_LAYERS}.0);
            return texture(uData, uv);
        }

        vec3 getChromaticArray(sampler2DArray tex, vec3 uvLayer, vec2 shift) {
            float r = texture(tex, vec3(uvLayer.xy + shift, uvLayer.z)).r;
            float g = texture(tex, uvLayer).g;
            float b = texture(tex, vec3(uvLayer.xy - shift, uvLayer.z)).b;
            return vec3(r, g, b);
        }

        float staticNoise(vec2 uv)
        {
            return fract(sin(dot(uv.xy, vec2(12.9898, 78.233))) * 43758.5453123);
        }

        vec3 applyHue(vec3 col, float hue)
        {
            const vec3 k = vec3(0.57735, 0.57735, 0.57735);
            float cosAngle = cos(hue);
            return col * cosAngle + cross(k, col) * sin(hue) + k * dot(k, col) * (1.0 - cosAngle);
        }

        vec3 applySaturation(vec3 col, float sat)
        {
            float luma = dot(col, vec3(0.2126, 0.7152, 0.0722));
            return mix(vec3(luma), col, sat);
        }



        float overlay(float b, float c) { return (b < 0.5) ? (2.0 * b * c) : (1.0 - 2.0 * (1.0 - b) * (1.0 - c)); }
        float softLight(float b, float c) { return (1.0 - 2.0 * c) * b * b + 2.0 * c * b; }
        float colorDodge(float b, float c) { return (c == 1.0) ? 1.0 : min(1.0, b / (1.0 - c)); }
        float colorBurn(float b, float c) { return (c == 0.0) ? 0.0 : max(0.0, 1.0 - (1.0 - b) / c); }

        vec3 rgb2hsl(vec3 c) {
            float minC = min(min(c.r, c.g), c.b);
            float maxC = max(max(c.r, c.g), c.b);
            float delta = maxC - minC;
            vec3 hsl = vec3(0.0, 0.0, (maxC + minC) * 0.5);
            if (delta != 0.0) {
                hsl.y = (hsl.z < 0.5) ? delta / (maxC + minC) : delta / (2.0 - maxC - minC);
                if (c.r == maxC) hsl.x = (c.g - c.b) / delta + (c.g < c.b ? 6.0 : 0.0);
                else if (c.g == maxC) hsl.x = (c.b - c.r) / delta + 2.0;
                else hsl.x = (c.r - c.g) / delta + 4.0;
                hsl.x /= 6.0;
            }
            return hsl;
        }

        float getLum(vec3 c) {
            return dot(c, vec3(0.3, 0.59, 0.11));
        }

        vec3 clipColor(vec3 c) {
            float l = getLum(c);
            float n = min(min(c.r, c.g), c.b);
            float x = max(max(c.r, c.g), c.b);
            if (n < 0.0) c = l + (((c - l) * l) / (l - n));
            if (x > 1.0) c = l + (((c - l) * (1.0 - l)) / (x - l));
            return c;
        }

        vec3 setLum(vec3 c, float l) {
            float d = l - getLum(c);
            return clipColor(c + d);
        }

        float getSat(vec3 c) {
            return max(max(c.r, c.g), c.b) - min(min(c.r, c.g), c.b);
        }

        vec3 setSat(vec3 c, float s) {
            float minVal = min(min(c.r, c.g), c.b);
            float maxVal = max(max(c.r, c.g), c.b);
            float midVal;
            
            if (c.r != minVal && c.r != maxVal) midVal = c.r;
            else if (c.g != minVal && c.g != maxVal) midVal = c.g;
            else midVal = c.b;

            if (maxVal > minVal) {
                vec3 res;
                float midOut = ((midVal - minVal) * s) / (maxVal - minVal);
                
                if (c.r == maxVal) res.r = s;
                else if (c.r == minVal) res.r = 0.0;
                else res.r = midOut;
                
                if (c.g == maxVal) res.g = s;
                else if (c.g == minVal) res.g = 0.0;
                else res.g = midOut;
                
                if (c.b == maxVal) res.b = s;
                else if (c.b == minVal) res.b = 0.0;
                else res.b = midOut;
                
                return res;
            }
            return vec3(0.0);
        }

        vec3 applyBlend(int mode, vec3 B, vec3 C)
        {
            switch(mode)
            {
                case 1: return B * C;
                case 2: return 1.0 - ((1.0 - B) * (1.0 - C));
                case 3: return vec3(overlay(B.r, C.r), overlay(B.g, C.g), overlay(B.b, C.b));
                case 4: return min(B, C);
                case 5: return max(B, C);
                case 6: return vec3(colorDodge(B.r, C.r), colorDodge(B.g, C.g), colorDodge(B.b, C.b));
                case 7: return vec3(colorBurn(B.r, C.r), colorBurn(B.g, C.g), colorBurn(B.b, C.b));
                case 8: return vec3(overlay(C.r, B.r), overlay(C.g, B.g), overlay(C.b, B.b));
                case 9: return vec3(softLight(B.r, C.r), softLight(B.g, C.g), softLight(B.b, C.b));
                case 10: return abs(B - C);
                case 11: return B + C - 2.0 * B * C;
                case 12: return setLum(setSat(C, getSat(B)), getLum(B));
                case 13: return setLum(setSat(B, getSat(C)), getLum(B));
                case 14: return setLum(C, getLum(B));
                case 15: return setLum(B, getLum(C));
                default: return C;
            }
        }

        void main()
        {
            vec4 base = texture(tBase, vUv);
            vec4 finalColor = base;
            float aspect = uAspect;

            for(int i = ${MAX_LAYERS} - 1; i >= 0 ; i--)
            {
                if (i >= uActiveLayerCount) continue;

                int id = uRenderOrder[i];
                float fIdx = float(id);

                vec4 p0 = getParam(fIdx, 0.5); // zoom, rot, offsetx, offsety
                vec4 p1 = getParam(fIdx, 1.5); // br, cont, hue, sat
                vec4 p2 = getParam(fIdx, 2.5); // sepia, invert, grain, vignet
                vec4 p3 = getParam(fIdx, 3.5); // tint.r, tint.g, tint.b, tint_amount
                vec4 p4 = getParam(fIdx, 4.5); // chromatic.x, chromatic.y, blendmode, alpha

                vec2 uv = vUv - 0.5;
                uv.x *= aspect; 
                uv *= (1.0 / p0.r);
                
                float s = sin(p0.g);
                float c = cos(p0.g);
                uv = mat2(c, -s, s, c) * uv;
                
                uv -= p0.ba;
                uv.x /= aspect;
                uv += 0.5;

                if(uv.x >= 0.0 && uv.x <= 1.0 && uv.y >= 0.0 && uv.y <= 1.0)
                {
                    vec4 texSample = texture(uLayerTextures, vec3(uv, id));
                    vec2 shift = p4.rg * 0.1; 
                    vec3 layerRGB;
                    
                    // Chromatic Aber.
                    if(abs(shift.x) + abs(shift.y) > 0.0001) {
                        layerRGB = getChromaticArray(uLayerTextures, vec3(uv, fIdx), shift);
                    } else {
                        layerRGB = texSample.rgb;
                    }

                    // Opacity
                    float layerAlpha = texSample.a * p4.a;
                    if(layerAlpha < 0.001) continue;

                    // Grain
                    float grain = staticNoise(uv);
                    layerRGB += (grain - 0.5) * p2.b;

                    // Brightness
                    layerRGB *= p1.r;

                    // Contrast
                    layerRGB = (layerRGB - 0.5) * p1.g + 0.5;

                    // HUE Rotation
                    layerRGB = applyHue(layerRGB, p1.b);

                    // Saturation
                    layerRGB = applySaturation(layerRGB, p1.a);

                    // Invert
                    layerRGB = mix(layerRGB, vec3(1.0) - layerRGB, p2.g);

                    // Sepia
                    vec3 sepia = vec3(
                        dot(layerRGB, vec3(0.393, 0.769, 0.189)),
                        dot(layerRGB, vec3(0.349, 0.686, 0.168)),
                        dot(layerRGB, vec3(0.272, 0.534, 0.131))
                    );
                    layerRGB = mix(layerRGB, sepia, p2.r);

                    // Vignette
                    float dist = distance(uv, vec2(0.5)); 
                    float vMask = smoothstep(0.1, 0.5, dist); 
                    if (p2.a < 0.0) {
                        layerRGB *= (1.0 - vMask * abs(p2.a));
                    } else {
                        layerRGB += (vMask * p2.a);
                    }

                    // Tint
                    layerRGB = mix(layerRGB, p3.rgb, p3.a);

                    // Blend Mode
                    vec3 blended = applyBlend(int(p4.b), finalColor.rgb, layerRGB);

                    // Final
                    finalColor.rgb = mix(finalColor.rgb, blended, layerAlpha);
                    finalColor.a = max(finalColor.a, layerAlpha);
                }
            }
            
            outColor = finalColor;
        }
    `;
};






/*
export const getMainFragmentShader = (c3d) =>
{
    const MAX_LAYERS = getMaxLayers(c3d);

    return `
        precision highp float;
        precision highp int;
        precision highp sampler2DArray;

        in vec2 vUv;
        out vec4 outColor;

        uniform sampler2D tBase;
        uniform float uAspect;
        uniform int uActiveLayerCount;
        uniform sampler2DArray uLayerTextures;
        uniform int uBlendModes[${MAX_LAYERS}];
        uniform float uAlphas[${MAX_LAYERS}];
        uniform int uRenderOrder[${MAX_LAYERS}];
        uniform float uZoom[${MAX_LAYERS}];
        uniform float uRotation[${MAX_LAYERS}];
        uniform vec2 uOffset[${MAX_LAYERS}];

        uniform float uBrightness[${MAX_LAYERS}];
        uniform float uContrast[${MAX_LAYERS}];
        uniform float uHue[${MAX_LAYERS}];
        uniform float uSaturation[${MAX_LAYERS}];
        uniform float uSepia[${MAX_LAYERS}];
        uniform vec2 uChromaticAmount[${MAX_LAYERS}];
        uniform float uInvert[${MAX_LAYERS}];
        uniform float uVignette[${MAX_LAYERS}];
        uniform float uGrainAmount[${MAX_LAYERS}];
        uniform vec3 uTint[${MAX_LAYERS}];
        uniform float uTintAmount[${MAX_LAYERS}];


        vec2 rotateUV(vec2 uv, float rotation, float aspect) {
            float s = sin(rotation);
            float c = cos(rotation);
            uv.x *= aspect;
            mat2 rotMat = mat2(c, -s, s, c);
            uv = rotMat * uv;
            uv.x /= aspect;
            return uv;
        }

        //vec3 toSRGB(vec3 col) {return pow(col, vec3(1.0 / 2.2)); }

        vec3 applyHue(vec3 col, float hue) {
            const vec3 k = vec3(0.57735, 0.57735, 0.57735);
            float cosAngle = cos(hue);
            return col * cosAngle + cross(k, col) * sin(hue) + k * dot(k, col) * (1.0 - cosAngle);
        }

        vec3 applySaturation(vec3 col, float sat) {
            float luma = dot(col, vec3(0.2126, 0.7152, 0.0722));
            return mix(vec3(luma), col, sat);
        }

        vec3 getChromaticArray(sampler2DArray tex, vec3 uvLayer, vec2 shift) {
            float r = texture(tex, vec3(uvLayer.xy + shift, uvLayer.z)).r;
            float g = texture(tex, uvLayer).g;
            float b = texture(tex, vec3(uvLayer.xy - shift, uvLayer.z)).b;
            return vec3(r, g, b);
        }

        float staticNoise(vec2 uv) {
            return fract(sin(dot(uv.xy, vec2(12.9898, 78.233))) * 43758.5453123);
        }


        float overlay(float b, float c) { return (b < 0.5) ? (2.0 * b * c) : (1.0 - 2.0 * (1.0 - b) * (1.0 - c)); }
        float softLight(float b, float c) { return (1.0 - 2.0 * c) * b * b + 2.0 * c * b; }
        float colorDodge(float b, float c) { return (c == 1.0) ? 1.0 : min(1.0, b / (1.0 - c)); }
        float colorBurn(float b, float c) { return (c == 0.0) ? 0.0 : max(0.0, 1.0 - (1.0 - b) / c); }

        vec3 rgb2hsl(vec3 c) {
            float minC = min(min(c.r, c.g), c.b);
            float maxC = max(max(c.r, c.g), c.b);
            float delta = maxC - minC;
            vec3 hsl = vec3(0.0, 0.0, (maxC + minC) * 0.5);
            if (delta != 0.0) {
                hsl.y = (hsl.z < 0.5) ? delta / (maxC + minC) : delta / (2.0 - maxC - minC);
                if (c.r == maxC) hsl.x = (c.g - c.b) / delta + (c.g < c.b ? 6.0 : 0.0);
                else if (c.g == maxC) hsl.x = (c.b - c.r) / delta + 2.0;
                else hsl.x = (c.r - c.g) / delta + 4.0;
                hsl.x /= 6.0;
            }
            return hsl;
        }

        float getLum(vec3 c) {
            return dot(c, vec3(0.3, 0.59, 0.11));
        }

        vec3 clipColor(vec3 c) {
            float l = getLum(c);
            float n = min(min(c.r, c.g), c.b);
            float x = max(max(c.r, c.g), c.b);
            if (n < 0.0) c = l + (((c - l) * l) / (l - n));
            if (x > 1.0) c = l + (((c - l) * (1.0 - l)) / (x - l));
            return c;
        }

        vec3 setLum(vec3 c, float l) {
            float d = l - getLum(c);
            return clipColor(c + d);
        }

        float getSat(vec3 c) {
            return max(max(c.r, c.g), c.b) - min(min(c.r, c.g), c.b);
        }

        vec3 setSat(vec3 c, float s) {
            float minVal = min(min(c.r, c.g), c.b);
            float maxVal = max(max(c.r, c.g), c.b);
            float midVal;
            
            if (c.r != minVal && c.r != maxVal) midVal = c.r;
            else if (c.g != minVal && c.g != maxVal) midVal = c.g;
            else midVal = c.b;

            if (maxVal > minVal) {
                vec3 res;
                float midOut = ((midVal - minVal) * s) / (maxVal - minVal);
                
                if (c.r == maxVal) res.r = s;
                else if (c.r == minVal) res.r = 0.0;
                else res.r = midOut;
                
                if (c.g == maxVal) res.g = s;
                else if (c.g == minVal) res.g = 0.0;
                else res.g = midOut;
                
                if (c.b == maxVal) res.b = s;
                else if (c.b == minVal) res.b = 0.0;
                else res.b = midOut;
                
                return res;
            }
            return vec3(0.0);
        }

        vec3 applyBlend(int mode, vec3 B, vec3 C)
        {
            switch(mode)
            {
                case 1: return B * C;
                case 2: return 1.0 - ((1.0 - B) * (1.0 - C));
                case 3: return vec3(overlay(B.r, C.r), overlay(B.g, C.g), overlay(B.b, C.b));
                case 4: return min(B, C);
                case 5: return max(B, C);
                case 6: return vec3(colorDodge(B.r, C.r), colorDodge(B.g, C.g), colorDodge(B.b, C.b));
                case 7: return vec3(colorBurn(B.r, C.r), colorBurn(B.g, C.g), colorBurn(B.b, C.b));
                case 8: return vec3(overlay(C.r, B.r), overlay(C.g, B.g), overlay(C.b, B.b));
                case 9: return vec3(softLight(B.r, C.r), softLight(B.g, C.g), softLight(B.b, C.b));
                case 10: return abs(B - C);
                case 11: return B + C - 2.0 * B * C;
                case 12: return setLum(setSat(C, getSat(B)), getLum(B));
                case 13: return setLum(setSat(B, getSat(C)), getLum(B));
                case 14: return setLum(C, getLum(B));
                case 15: return setLum(B, getLum(C));
                default: return C;
            }
        }


        void main()
        {
            vec4 base = texture(tBase, vUv);
            vec4 finalColor = base;
            float aspect = uAspect;

            for(int i = ${MAX_LAYERS}; i >= 0 ; i--)
            {
                if(i >= uActiveLayerCount) continue;

                int actualIdx = uRenderOrder[i]; 

                vec2 uv = vUv - 0.5;
                uv.x *= aspect; 
                uv *= (1.0 / uZoom[actualIdx]);
                
                float s = sin(uRotation[actualIdx]);
                float c = cos(uRotation[actualIdx]);
                uv = mat2(c, -s, s, c) * uv;
                
                uv -= uOffset[actualIdx];
                uv.x /= aspect;
                uv += 0.5;
                vec2 lUv = uv;

                if(lUv.x >= 0.0 && lUv.x <= 1.0 && lUv.y >= 0.0 && lUv.y <= 1.0)
                {
                    
                    vec4 texSample = texture(uLayerTextures, vec3(lUv, float(actualIdx)));
                    vec2 shift = uChromaticAmount[actualIdx] * 0.01; 
                    vec3 layerRGB;
                    if(abs(shift.x) + abs(shift.y) > 0.0001) {
                        layerRGB = getChromaticArray(uLayerTextures, vec3(lUv, float(actualIdx)), shift);
                    } else {
                        layerRGB = texSample.rgb;
                    }
                    float layerAlpha = texSample.a * uAlphas[actualIdx];
                    if(layerAlpha < 0.001) continue; 
                    float grain = staticNoise(lUv); 
                    layerRGB += (grain - 0.5) * uGrainAmount[actualIdx];
                    layerRGB *= uBrightness[actualIdx];
                    layerRGB = (layerRGB - 0.5) * uContrast[actualIdx] + 0.5;
                    layerRGB = applyHue(layerRGB, uHue[actualIdx]);
                    layerRGB = applySaturation(layerRGB, uSaturation[actualIdx]);
                    layerRGB = mix(layerRGB, vec3(1.0) - layerRGB, uInvert[actualIdx]);

                    vec3 sepia = vec3(
                        dot(layerRGB, vec3(0.393, 0.769, 0.189)),
                        dot(layerRGB, vec3(0.349, 0.686, 0.168)),
                        dot(layerRGB, vec3(0.272, 0.534, 0.131))
                    );
                    layerRGB = mix(layerRGB, sepia, uSepia[actualIdx]);

                    float dist = distance(lUv, vec2(0.5)); 
                    float vMask = smoothstep(0.1, 0.8, dist); 
                    if (uVignette[actualIdx] < 0.0) {
                        layerRGB *= (1.0 - vMask * abs(uVignette[actualIdx]));
                    } else {
                        layerRGB += (vMask * uVignette[actualIdx]);
                    }
                    layerRGB = mix(layerRGB, uTint[actualIdx], uTintAmount[actualIdx]);
                    vec3 blended = applyBlend(uBlendModes[actualIdx], finalColor.rgb, layerRGB);
                    finalColor.rgb = mix(finalColor.rgb, blended, layerAlpha);
                    finalColor.a = max(finalColor.a, layerAlpha);
                }

            }

            outColor = finalColor;
        }
    `;
}
*/



export const uniforms2 =
{
    tDiffuse: {value: null},
    uBrightness: {label: 'Brightness', value: 1.0, min: 0.1, max: 10.0, step: 0.05},
    uContrast: {label: 'Contrast', value: 1.0, min: 1.0, max: 10.0, step: 0.1},
    uHue: {label: 'HUE', value: 0.0, min: 0.0, max: Math.PI * 2, step: 0.01},
    uSaturation: {label: 'Saturation', value: 1.0, min: 0.0, max: 10.0, step: 0.1},
    uSepia: {label: 'Sepia', value: 0.0, min: 0.0, max: 2.0, step: 0.01},
    uChromaticAmount: {label: 'Chromatic Aberration', value: new THREE.Vector2(0.0, 0.0), min: 0.0, max: 20.0, step: 0.05},
    uInvert: {label: 'Invert', value: 0.0, min: 0.0, max: 1.0, step: 1},
    uVignette: {label: 'Vignette', value: 0.0, min: -1.0, max: 1.0, step: 0.01}, // -1.0 (Black) to 1.0 (White)
    uGrainAmount: {label: 'Noise', value: 0.0, min: 0.0, max: 1.0, step: 0.005},
    uTint: {value: new THREE.Color(0x0) },
    uTintAmount: {value: 0.0},
    uOpacity: {value: 0.0},
    uOffset: {value: new THREE.Vector2(0.0, 0.0)},
    uZoom: {value: 1.0},
    uRotation: {value: 0.0},
    uAspect: {value: 1.0},

    uIsGradient: {value: false},
    uGradientColors: { value: Array.from({ length: MAX_GRADIENT_COLORS }, () => new THREE.Color(0x0)) },
    uGradientCount: { value: 0 },
    uGradientIsRadial: { value: false },
    uGradientAngle: { value: 0.0 },
    uGradientScale: { value: 0.0 }
};

export const vertexShader2 = `
    varying vec2 vUv;
    void main() {
        vUv = uv; // Map the texture coordinates (0.0 to 1.0)
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

export const fragmentShader2 = `

    precision highp float;

    uniform sampler2D tDiffuse;

    uniform float uOpacity;
    uniform vec2 uOffset;
    uniform float uZoom;
    uniform float uRotation;
    uniform float uAspect;

    uniform float uBrightness;
    uniform float uContrast;
    uniform float uHue;
    uniform float uSaturation;
    uniform float uSepia;
    uniform vec2 uChromaticAmount;
    uniform float uInvert;
    uniform float uVignette;
    uniform float uGrainAmount;
    uniform vec3 uTint;
    uniform float uTintAmount;

    uniform bool uIsGradient;
    uniform vec3 uGradientColors[${MAX_GRADIENT_COLORS}];
    uniform int uGradientCount;
    uniform bool uGradientIsRadial;
    uniform float uGradientAngle;
    uniform float uGradientScale;

    varying vec2 vUv;

    // Helper function to rotate a 2D point
    vec2 rotateUV(vec2 uv, float angle, float aspect) {
        float s = sin(angle);
        float c = cos(angle);
        
        // 1. Stretch the UV to be "square" in math-space
        uv.x *= aspect;
        
        // 2. Rotate
        mat2 r = mat2(c, -s, s, c);
        uv = r * uv;
        
        // 3. Compress it back to the original rectangle shape
        uv.x /= aspect;
        
        return uv;
    }

    // --- COLOR HELPERS ---
    // vec3 toSRGB(vec3 col) {return pow(col, vec3(1.0 / 2.2)); }

    vec3 applyHue(vec3 col, float hue) {
        const vec3 k = vec3(0.57735, 0.57735, 0.57735);
        float cosAngle = cos(hue);
        return col * cosAngle + cross(k, col) * sin(hue) + k * dot(k, col) * (1.0 - cosAngle);
    }

    vec3 applySaturation(vec3 col, float sat) {
        float luma = dot(col, vec3(0.2126, 0.7152, 0.0722));
        return mix(vec3(luma), col, sat);
    }

    // --- SAMPLING EFFECTS ---
    vec3 getChromatic2D(sampler2D tex, vec2 uv, vec2 shift) {
        // We sample the Red channel with a positive shift
        float r = texture2D(tex, uv + shift).r;
        
        // We sample the Green channel at the original position
        float g = texture2D(tex, uv).g;
        
        // We sample the Blue channel with a negative shift
        float b = texture2D(tex, uv - shift).b;
        
        return vec3(r, g, b);
    }

    float staticNoise(vec2 uv) {
        return fract(sin(dot(uv.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }


    vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
    float snoise(vec2 v){
        const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy) );
        vec2 x0 = v -   i + dot(i, C.xx);
        vec2 i1; i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod(i, 289.0);
        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m ; m = m*m ;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
    }

    vec3 getGradient(float t) {
        float stepSize = 1.0 / float(uGradientCount - 1);
        int index = int(t / stepSize);
        float segmentProgress = (t - float(index) * stepSize) / stepSize;
        index = clamp(index, 0, uGradientCount - 2);
        return mix(
            uGradientColors[index], 
            uGradientColors[index + 1], 
            clamp(segmentProgress, 0.0, 1.0)
        );
    }

    
    void main() {

        // 1. COORDINATE TRANSFORMATION (The "Paper" movement)
        vec2 uv = vUv - 0.5;

        uv *= (1.0 / uZoom);
        uv = rotateUV(uv, uRotation, uAspect);
        uv -= uOffset;
        uv += 0.5;

        vec3 color;
        float originalAlpha;

        if(uIsGradient)
        {
            float gradT;
            if(uGradientIsRadial) {
                gradT = distance(uv, vec2(0.5));
            } else {
                float rad = radians(uGradientAngle);
                vec2 dir = vec2(cos(rad), sin(rad));
                vec2 centeredUv = uv - 0.5;
                float dotVal = dot(centeredUv, dir);
                float norm = abs(dir.x) + abs(dir.y);
                gradT = (dotVal / norm) + 0.5;
                gradT = clamp(gradT, 0.0, 1.0);
            }
            float noise = snoise(uv * uGradientScale);
            
            float noiseT = noise * 0.5 + 0.5;
            float t = mix(gradT, noiseT, 0.3); 
            color = getGradient(t);
            originalAlpha = uOpacity;
        }
        else
        {
            vec4 tex = texture2D(tDiffuse, uv);
            // color = tex.rgb;
            originalAlpha = tex.a * uOpacity;

            vec2 shift = uChromaticAmount * 0.02; 
            color = getChromatic2D(tDiffuse, uv, shift);
        }

        if(uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
           discard;
        }

        float grain = staticNoise(vUv);
        float noiseValue = (grain - 0.5) * uGrainAmount;
        color += noiseValue;

        // 3. Apply Adjustments
        color *= uBrightness;
        color = (color - 0.5) * uContrast + 0.5;
        color = applyHue(color, uHue);
        color = applySaturation(color, uSaturation);
        color = mix(color, vec3(1.0) - color, uInvert);

        // Sepia...
        vec3 sepia = vec3(
            dot(color, vec3(0.393, 0.769, 0.189)),
            dot(color, vec3(0.349, 0.686, 0.168)),
            dot(color, vec3(0.272, 0.534, 0.131))
        );
        color = mix(color, sepia, uSepia);

        // 3. Bipolar Vignette (-1 to +1)
        float dist = distance(vUv, vec2(0.5));
        float vMask = smoothstep(0.1, 0.8, dist); 
        if (uVignette < 0.0) {
            color *= (1.0 - vMask * abs(uVignette));
        } else {
            color += (vMask * uVignette);
        }

        color = mix(color, uTint, uTintAmount);

        // 4. Final Output
        // We let Three.js handle the color space conversion
        gl_FragColor = vec4(color, originalAlpha);

    }
`;