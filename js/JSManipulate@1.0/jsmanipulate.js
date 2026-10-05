/* 
=========================================================================
   JSManipulate v1.0 (2011-08-01)

Javascript image filter & effect library

Developed by Joel Besada (http://www.joelb.me)
Demo page: http://www.joelb.me/jsmanipulate

MIT LICENSED (http://www.opensource.org/licenses/mit-license.php)
Copyright (c) 2011, Joel Besada
=========================================================================
*/


/**
 * Contains common filter functions.
 */
function FilterUtils(){
	this.HSVtoRGB = function (h, s, v){
		var r, g, b;
		var i = Math.floor(h * 6);
		var f = h * 6 - i;
		var p = v * (1 - s);
		var q = v * (1 - f * s);
		var t = v * (1 - (1 - f) * s);
		switch(i % 6){
			case 0: r = v; g = t; b = p; break;
			case 1: r = q; g = v; b = p; break;
			case 2: r = p; g = v; b = t; break;
			case 3: r = p; g = q; b = v; break;
			case 4: r = t; g = p; b = v; break;
			case 5: r = v; g = p; b = q; break;
			default: break;
		}
		return [r * 255, g * 255, b * 255];
	};
	this.RGBtoHSV = function (r, g, b){
		r = r/255; g = g/255; b = b/255;
		var max = Math.max(r, g, b);
		var min = Math.min(r, g, b);
		var h, s, v = max;
		var d = max - min;
		s = max === 0 ? 0 : d / max;
		if(max === min){
			h = 0;
		}else{
			switch(max){
				case r: h = (g - b) / d + (g < b ? 6 : 0); break;
				case g: h = (b - r) / d + 2; break;
				case b: h = (r - g) / d + 4; break;
				default: break;
			}
			h /= 6;
		}
		return [h, s, v];
	};
	this.getPixel = function (pixels,x,y,width,height){
		var pix = (y*width + x)*4;
		if (x < 0 || x >= width || y < 0 || y >= height) {
			return [pixels[((this.clampPixel(y, 0, height-1) * width) + this.clampPixel(x, 0, width-1))*4],
			pixels[((this.clampPixel(y, 0, height-1) * width) + this.clampPixel(x, 0, width-1))*4 + 1],
			pixels[((this.clampPixel(y, 0, height-1) * width) + this.clampPixel(x, 0, width-1))*4 + 2],
			pixels[((this.clampPixel(y, 0, height-1) * width) + this.clampPixel(x, 0, width-1))*4 + 3]];
		}
		return [pixels[pix],pixels[pix+1],pixels[pix+2],pixels[pix+3]];
	};
	var haveNextGaussian = false;
	var nextGaussian;
	this.gaussianRandom = function(){
		if(haveNextGaussian){
			haveNextGaussian = false;
			return nextGaussian;
		} else {
			var v1, v2, s;
			do {
				v1 = 2 * Math.random() - 1;
				v2 = 2 * Math.random() - 1;
				s = v1 * v1 + v2 * v2;
			} while (s >= 1 || s === 0);
			var mult = Math.sqrt(-2 * Math.log(s)/s);
			nextGaussian = v2 * mult;
			haveNextGaussian = true;
			return v1 * mult;
		}
	};
	this.clampPixel = function (x,a,b){
		return (x < a) ? a : (x > b) ? b : x;
	};
	this.triangle = function(x){
		var r = this.mod(x, 1);
		return 2*(r < 0.5 ? r : 1-r);
	};
	this.mod = function(a,b){
		var n = parseInt(a/b,10);
		a -= n*b;
		if(a < 0){
			return a + b;
		}
		return a;
	};
	this.mixColors = function(t, rgb1, rgb2){
		var r = this.linearInterpolate(t,rgb1[0],rgb2[0]);
		var g = this.linearInterpolate(t,rgb1[1],rgb2[1]);
		var b = this.linearInterpolate(t,rgb1[2],rgb2[2]);
		var a = this.linearInterpolate(t,rgb1[3],rgb2[3]);
		return [r,g,b,a];
	};

	this.linearInterpolate = function(t,a,b){
		return a + t * (b-a);
	};
	this.bilinearInterpolate = function (x,y,nw,ne,sw,se){
		var m0, m1;
		var r0 = nw[0]; var g0 = nw[1]; var b0 = nw[2]; var a0 = nw[3];
		var r1 = ne[0]; var g1 = ne[1]; var b1 = ne[2]; var a1 = ne[3];
		var r2 = sw[0]; var g2 = sw[1]; var b2 = sw[2]; var a2 = sw[3];
		var r3 = se[0]; var g3 = se[1]; var b3 = se[2]; var a3 = se[3];
		var cx = 1.0 - x; var cy = 1.0 - y;

		m0 = cx * a0 + x * a1;
		m1 = cx * a2 + x * a3;
		var a = cy * m0 + y * m1;

		m0 = cx * r0 + x * r1;
		m1 = cx * r2 + x * r3;
		var r = cy * m0 + y * m1;

		m0 = cx * g0 + x * g1;
		m1 = cx * g2 + x * g3;
		var g = cy * m0 + y * m1;

		m0 = cx * b0 + x * b1;
		m1 = cx * b2 + x * b3;
		var b =cy * m0 + y * m1;
		return [r,g,b,a];
	};
	this.tableFilter = function (inputData, table, width, height){
		for (var y = 0; y < height; y++) {
			for (var x = 0; x < width; x++) {
				var pixel = (y*width + x)*4;
				for(var i = 0; i < 3; i++){
					inputData[pixel+i] = table[inputData[pixel+i]];
				}
			}
		}
	};
	this.convolveFilter = function(inputData, matrix, width, height){
		var outputData = [];
		var rows, cols;
		rows = cols = Math.sqrt(matrix.length);
		var rows2 = parseInt(rows/2,10);
		var cols2 = parseInt(cols/2,10);
		var trace = true;
		for(var y = 0; y < height; y++){
			for (var x = 0; x < width; x++){
				var pixel = (y*width + x)*4;
				var r = 0, g = 0, b = 0;
				for(var row = -rows2; row <= rows2; row++){
					var iy = y+row;
					var ioffset;
					if (0 <= iy && iy < height) {
						ioffset = iy*width;
					} else {
						ioffset = y*width;
					}
					var moffset = cols*(row+rows2)+cols2;
					for (var col = -cols2; col <= cols2; col++) {
						var f = matrix[moffset+col];
						if (f !== 0) {
							var ix = x+col;
							if (!(0 <= ix && ix < width)) {
								ix = x;
							}
							var iPixel = (ioffset+ix)*4;
							r += f * inputData[iPixel];
							g += f * inputData[iPixel+1];
							b += f * inputData[iPixel+2];
						}
					}
				}
				outputData[pixel] = parseInt(r+0.5,10);
				outputData[pixel+1] = parseInt(g+0.5,10);
				outputData[pixel+2] = parseInt(b+0.5,10);
				outputData[pixel+3] = inputData[pixel+3];
			}
		}
		for(var k = 0; k < outputData.length; k++){
			inputData[k] = outputData[k];
		}
	};
	this.transformFilter = function(inputData, transformInverse, width, height){
		var out = [];
		var outputData = [];
		for(var j = 0; j < inputData.length; j++){
			outputData[j] = inputData[j];
		}
		for(var y = 0; y < height; y++){
			for (var x = 0; x < width; x++){
				var pixel = (y*width + x)*4;
				transformInverse.apply(this,[x,y,out]);
				var srcX = Math.floor(out[0]);
				var srcY = Math.floor(out[1]);
				var xWeight = out[0]-srcX;
				var yWeight = out[1]-srcY;
				var nw,ne,sw,se;
				if(srcX >= 0 && srcX < width-1 && srcY >= 0 && srcY < height-1){
					var i = (width*srcY + srcX)*4;
					nw = [inputData[i],inputData[i+1],inputData[i+2],inputData[i+3]];
					ne = [inputData[i+4],inputData[i+5],inputData[i+6],inputData[i+7]];
					sw = [inputData[i+width*4],inputData[i+width*4+1],inputData[i+width*4+2],inputData[i+width*4+3]];
					se = [inputData[i+(width + 1)*4],inputData[i+(width + 1)*4+1],inputData[i+(width + 1)*4+2],inputData[i+(width + 1)*4+3]];
				} else {
					nw = this.getPixel( inputData, srcX, srcY, width, height );
					ne = this.getPixel( inputData, srcX+1, srcY, width, height );
					sw = this.getPixel( inputData, srcX, srcY+1, width, height );
					se = this.getPixel( inputData, srcX+1, srcY+1, width, height );
				}
				var rgba = this.bilinearInterpolate(xWeight,yWeight,nw,ne,sw,se);
				outputData[pixel] = rgba[0];
				outputData[pixel + 1] = rgba[1];
				outputData[pixel + 2] = rgba[2];
				outputData[pixel + 3] = rgba[3];
			}
		}
		for(var k = 0; k < outputData.length; k++){
			inputData[k] = outputData[k];
		}
	};
}
/**
 * Sets the image to grayscale.
 */
function GrayscaleFilter(){
	this.name = "Grayscale";
	this.isDirAnimatable = true;
	this.defaultValues = {
	};
	this.valueRanges = {
	};
	this.filter = function(input,values){
		var width = input.width, height = input.height;
		var inputData = input.data;
		for (var y = 0; y < height; y++) {
			for (var x = 0; x < width; x++) {
				var pixel = (y*width + x)*4;
				var luma = inputData[pixel]*0.3 + inputData[pixel+1]*0.59 + inputData[pixel+2]*0.11;
				inputData[pixel] = inputData[pixel+1] = inputData[pixel+2] = luma;
			}   
		}
	};
}
/**
 * Adjusts the hue of the image by going over to HSV values.
 */
function HueFilter(){
	this.name = "HUE";
	this.defaultValues = {
		amount : 0.0
	};
	this.valueRanges = {
		amount : {min:0, max:360}
	};
	this.filter = function(input,values){
		var width = input.width, height = input.height;
	  	var data = input.data;
	  	if(values === undefined){ values = this.defaultValues; }
	  	var amount = (values.amount === undefined) ? this.defaultValues.amount : values.amount;
			const hueShift = (amount % 360 + 360) % 360;
			function hueToRgb(p, q, t)
			{
				if (t < 0) t += 1;
				if (t > 1) t -= 1;
				if (t < 1/6) return p + (q - p) * 6 * t;
				if (t < 1/2) return q;
				if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
				return p;
			}

			for (let i = 0; i < data.length; i += 4) {
				let r = data[i] / 255;
				let g = data[i + 1] / 255;
				let b = data[i + 2] / 255;

				let max = Math.max(r, g, b), min = Math.min(r, g, b);
				let h, s, l = (max + min) / 2;

				if (max === min) {
					h = s = 0;
				} else {
					let d = max - min;
					s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
					switch (max) {
						case r: h = (g - b) / d + (g < b ? 6 : 0); break;
						case g: h = (b - r) / d + 2; break;
						case b: h = (r - g) / d + 4; break;
					}
					h /= 6;
				}

				h = (h + hueShift / 360) % 1;

				let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
				let p = 2 * l - q;

				data[i]     = Math.round(hueToRgb(p, q, h + 1/3) * 255);
				data[i + 1] = Math.round(hueToRgb(p, q, h) * 255);
				data[i + 2] = Math.round(hueToRgb(p, q, h - 1/3) * 255);
			}

	}
}
/**
 * Inverts the colors of the image.
 */
function InvertFilter(){
	this.name = "Invert";
	this.isDirAnimatable = true;
	this.defaultValues = {
	};
	this.valueRanges = {
	};
	this.filter = function(input,values){
		var width = input.width, height = input.height;
		var inputData = input.data;
		for (var y = 0; y < height; y++) {
			for (var x = 0; x < width; x++) {
				var pixel = (y*width + x)*4;
				for(var i = 0; i < 3; i++){
					inputData[pixel+i] = 255 - inputData[pixel+i];
				}
			}   
		}
	};
}
/**
 * Creates random noise on the image, with or without color.
 */
function NoiseFilter(){
	this.name = "Noise";
	this.isDirAnimatable = true;
	this.defaultValues = {
		amount : 25,
		density : 1,
		monochrome : true
	};
	this.valueRanges = {
		amount : {min:0, max:100},
		density : {min:0, max:1.0},
		monochrome : {min:false, max:true}
	};
	this.filter = function(input,values){
		var width = input.width, height = input.height;
		var inputData = input.data;
		if(values === undefined){ values = this.defaultValues; }
		var amount = (values.amount === undefined) ? this.defaultValues.amount : values.amount;
		var density = (values.density === undefined) ? this.defaultValues.density : values.density;
		var monochrome = (values.monochrome === undefined) ? this.defaultValues.monochrome : values.monochrome;
		for (var y = 0; y < height; y++) {
			for (var x = 0; x < width; x++) {
				var pixel = (y*width + x)*4;
				if(Math.random() <= density){
					var n;
					if(monochrome){
						n = parseInt((2*Math.random()-1) * amount,10);
						inputData[pixel] += n;
						inputData[pixel+1] += n;
						inputData[pixel+2] += n;
					} else {
						for(var i = 0; i < 3; i++){
							n = parseInt((2*Math.random()-1) * amount,10);
							inputData[pixel+i] += n; 
						}
					}
				}
			}   
		}
	};
}
/**
 * Adjust the factor of each RGB color value in the image.
 */
function RGBAdjustFilter(){
	this.name = "RGB Adjust";
	this.isDirAnimatable = true;
	this.defaultValues = {
		red: 1.0,
		green: 1.0,
		blue: 1.0
	};
	this.valueRanges = {
		red: {min: 0.0, max: 2.0},
		green: {min: 0.0, max: 2.0},
		blue: {min: 0.0, max: 2.0}
	};
	this.filter = function(input,values){
		var width = input.width, height = input.height;
		var inputData = input.data;
		if(values === undefined){ values = this.defaultValues; }
		var red = (values.red === undefined) ? this.defaultValues.red : values.red;
		var green = (values.green === undefined) ? this.defaultValues.green : values.green;
		var blue = (values.blue === undefined) ? this.defaultValues.blue : values.blue;
		if(red < 0){ red = 0; }
		if(green < 0){ green = 0; }
		if(blue < 0){ blue = 0; }
		for (var y = 0; y < height; y++) {
			for (var x = 0; x < width; x++) {
				var pixel = (y*width + x)*4;
				inputData[pixel] *= red;
				inputData[pixel+1] *= green;
				inputData[pixel+2] *= blue;
			}   
		}
	};
}
/**
 * Adjusts the saturation value of the image. Values over 1 increase saturation while values below decrease saturation.
 * For a true grayscale effect, use the grayscale filter instead.
 */
function SaturationFilter(){
	this.name = "Saturation";
	this.defaultValues = {
		amount : 1.0
	};
	this.valueRanges = {
		amount : {min:1.0, max:10.0}
	};
	this.filter = function(input,values){
		var width = input.width, height = input.height;
	  	var data = input.data;
	  	if(values === undefined){ values = this.defaultValues; }
	  	var saturation = (values.amount === undefined) ? this.defaultValues.amount : values.amount;
			for (let i = 0; i < data.length; i += 4) {
					let r = data[i];
					let g = data[i + 1];
					let b = data[i + 2];
					// data[i + 3] alpha (saydamlık) değeridir, dokunmuyoruz.

					// Standart Luminance (Parlaklık) formülü ile gri tonu hesaplama
					let gray = 0.299 * r + 0.587 * g + 0.114 * b;

					// Doygunluğu ayarlama ve 0-255 aralığına sınırlandırma (clamp)
					data[i]     = Math.min(255, Math.max(0, gray + saturation * (r - gray)));
					data[i + 1] = Math.min(255, Math.max(0, gray + saturation * (g - gray)));
					data[i + 2] = Math.min(255, Math.max(0, gray + saturation * (b - gray)));
			}
	}
}

/**
 * Creates a sepia effect on the image i.e. gives the image a yellow-brownish tone.
 */
function SepiaFilter(){
	this.name = "Sepia";
	this.isDirAnimatable = true;
	this.defaultValues = {
		amount : 10
	};
	this.valueRanges = {
		amount : {min:0, max:30}
	};

	var filterUtils = new FilterUtils();
	this.filter = function(input,values){
		var width = input.width, height = input.height;
		var inputData = input.data;
		if(values === undefined){ values = this.defaultValues; }
		var amount = (values.amount === undefined) ? this.defaultValues.amount : values.amount;
		amount *= 255/100;
		for (var y = 0; y < height; y++) {
			for (var x = 0; x < width; x++) {
				var pixel = (y*width + x)*4;
				var luma = inputData[pixel]*0.3 + inputData[pixel+1]*0.59 + inputData[pixel+2]*0.11;
				var r,g,b;
				r = g = b = luma;
				r += 40;
				g += 20;
				b -= amount;
				
				inputData[pixel] = r;
				inputData[pixel+1] = g;
				inputData[pixel+2] = b;
			}   
		}
	};
}
/**
 * Produces a solarization effect on the image.  
 */
function SolarizeFilter(){
	this.name = "Solarize";
	this.isDirAnimatable = true;
	this.defaultValues = {
	};
	this.valueRanges = {
	};

	var filterUtils = new FilterUtils();
	this.filter = function(input,values){
		var width = input.width, height = input.height;
		var inputData = input.data;
		var table = [];
		for(var i = 0; i < 256; i++){
			var val = (i/255 > 0.5) ? 2*(i/255-0.5) : 2*(0.5-i/255);
			table[i] = parseInt(255 * val,10);
		}
		filterUtils.tableFilter(inputData, table, width, height);
	};
}
/**
 * Divides the colors into black and white following the treshold value. Brightnesses above the threshold
 * sets the color to white while values below the threshold sets the color to black.
 */
function ThresholdFilter(){
	this.name = "Black & White";
	this.isDirAnimatable = true;
	this.defaultValues = {
		threshold : 127
	};
	this.valueRanges = {
		threshold : {min:0, max:255}
	};
	this.filter = function(input,values){
		var width = input.width, height = input.height;
		var inputData = input.data;
		if(values === undefined){ values = this.defaultValues; }
		var threshold = (values.threshold === undefined) ? this.defaultValues.threshold : values.threshold;
		for (var y = 0; y < height; y++) {
			for (var x = 0; x < width; x++) {
				var pixel = (y*width + x)*4;
				var brightness = (inputData[pixel] + inputData[pixel+1] + inputData[pixel+2])/3;
				var colorVal = 0;
				if(brightness > threshold){
					colorVal = 255;
				}
				inputData[pixel] = inputData[pixel+1] = inputData[pixel+2] = colorVal;
			}   
		}
	};
}
/**
 * Divides the colors into black and white following the treshold value. Brightnesses above the threshold
 * sets the color to white while values below the threshold sets the color to black.
 */
function ChromaticAberrationFilter(){
	this.name = "Chromatic Aberration";
	this.isDirAnimatable = true;
	this.defaultValues = {
		shiftX : 10,
		shiftY : 10 
	};
	this.valueRanges = {
		shiftX : {min:0, max:100},
		shiftY : {min:0, max:100}
	};
	this.filter = function(input,values){	
		var width = input.width, height = input.height;
		var inputData = input.data;
		if(values === undefined){ values = this.defaultValues; }
		var shiftX = (values.shiftX === undefined) ? this.defaultValues.shiftX : Math.floor(values.shiftX);
		var shiftY = (values.shiftY === undefined) ? this.defaultValues.shiftY : Math.floor(values.shiftY);
		const sourceData = new Uint8ClampedArray(inputData);
    const totalPixels = width * height;
    for (let i = 0; i < totalPixels; i++) { // Gemini
        const currentIndex = i * 4;
        const x = i % width;
        const y = Math.floor(i / width);
        const targetX = Math.min(Math.max(Math.round(x + shiftX), 0), width - 1);
        const targetY = Math.min(Math.max(Math.round(y + shiftY), 0), height - 1);
        const targetIndex = (targetY * width + targetX) * 4;
        inputData[currentIndex]     = sourceData[targetIndex];     // R
        inputData[currentIndex + 1] = sourceData[currentIndex + 1]; // G
        inputData[currentIndex + 2] = sourceData[currentIndex + 2]; // B
    }
	};
}
/** 
 * Highlights the edges of the image.
 */
function EdgeFilter(){
	this.name = "Edge Detection";
	this.isDirAnimatable = true;
	this.defaultValues = {
	};
	this.valueRanges = {
	};
	var matrixH = [-1,-2,-1,
					0, 0, 0,
					1, 2, 1];
	var matrixV = [-1, 0, 1,
				   -2, 0, 2,
				   -1, 0, 1];
	this.filter = function(input,values){
		var width = input.width, height = input.height;
		var inputData = input.data;
		var outputData = [];
		for (var y = 0; y < height; y++) {
			for (var x = 0; x < width; x++) {
				var pixel = (y*width + x)*4;
				var rh = 0; gh = 0; bh = 0;
				var rv = 0; gv = 0; bv = 0;
				for(var row = -1; row <= 1; row++){
					var iy = y+row;
					var ioffset;
					if(iy >= 0 && iy < height){
						ioffset = iy*width*4;
					} else {
						ioffset = y*width*4;
					}
					var moffset = 3*(row+1)+1;
					for(var col = -1; col <= 1; col++){
						var ix = x+col;
						if(!(ix >= 0 && ix < width)){
							ix = x;
						}
						ix *= 4;
						var r = inputData[ioffset+ix];
						var g = inputData[ioffset+ix+1];
						var b = inputData[ioffset+ix+2];
						var h = matrixH[moffset+col];
						var v = matrixV[moffset+col];
						rh += parseInt(h*r,10);
						bh += parseInt(h*g,10);
						gh += parseInt(h*b,10);
						rv += parseInt(v*r,10);
						gv += parseInt(v*g,10);
						bv += parseInt(v*b,10);
					}
				}
				r = parseInt(Math.sqrt(rh*rh + rv*rv) / 1.8,10);
				g = parseInt(Math.sqrt(gh*gh + gv*gv) / 1.8,10);
				b = parseInt(Math.sqrt(bh*bh + bv*bv) / 1.8,10);

				outputData[pixel] = r;
				outputData[pixel+1] = g;
				outputData[pixel+2] = b;
				outputData[pixel+3] = inputData[pixel+3];
			}   
		}
		for(var k = 0; k < outputData.length; k++){
			inputData[k] = outputData[k];
		}
	};
}

/**
 * A collection of all the filters.
 */
var JSManipulate = {
	grayscale : new GrayscaleFilter(),
	hue : new HueFilter(),
	invert : new InvertFilter(),
	noise : new NoiseFilter(),
	rgbadjust : new RGBAdjustFilter(),
	saturation : new SaturationFilter(),
	sepia : new SepiaFilter(),
	solarize : new SolarizeFilter(),
	threshold : new ThresholdFilter(),
	chromaticAberration: new ChromaticAberrationFilter(),
	edge : new EdgeFilter()
};