/*
* pryntr.js
*
* SVGs from DOM to SVG, JPG, PNG downloads 
* TODO Add PDF conversion and download
*
* @version 0.0.2
* @date 22-3-2016
* @author raj bhadra
*
* @license
* Copyright (C) 2016 Aureus Analytics <raj@aureusanalytics.com>
*
* Permission is hereby granted, free of charge, to any person obtaining
* a copy of this software and associated documentation files (the
* "Software"), to deal in the Software without restriction, including
* without limitation the rights to use, copy, modify, merge, publish,
* distribute, sublicense, and/or sell copies of the Software, and to
* permit persons to whom the Software is furnished to do so, subject to
* the following conditions:
*
* The above copyright notice and this permission notice shall be
* included in all copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
* EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
* MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
* NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
* LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
* OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
* WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*
*/

window.pryntr = (function(){

	var consts = {
		defaultType: "svg",
		defaultSelector: "svg",
	};

	function Pryntr(){
		this.consts = consts;
	}

	/**
	* Print/Download the SVGs specified by the selectors
	* @param {String|Array.<String>} [selectors=["svg"]] The selectors for the elements to be printed
	* @param {String} [type="svg"] The type of download expected
	*/
	Pryntr.prototype.prynt = function(selectors, type){
		type = typeof type !== "string"? this.consts.defaultType: type;
		selectors = typeof selectors === "undefined"? [this.consts.defaultSelector]: selectors;
		selectors = typeof selectors === "string" || typeof selectors.length !== "number"? [selectors]: selectors;
		var sugarSerializer = this.SVGSerializer.getSugarSerializer();
		var cssWrangler = this.cssWrangler.getWrangler();
		var rasterizer = this.rasterize.getRasterizer();
		var downloader = this.downloader.getDownloader(rasterizer);
		var styles = cssWrangler.getStylesString();
		var sources = sugarSerializer.getSugaryInfos(selectors, styles);
		sources.length > 0? downloader.download(sources, type):undefined;
	};

	/**
	* Expose the available download types
	* @return {Array.<String>} The available download types
	*/
	Pryntr.prototype.canPrynt = function(){
		var downloader = this.downloader.getDownloader();
		return downloader.canDownload();
	};

	/**
	* Download sources directly
	* @param {String|Array.<String>} The sources to be downloaded
	* @param {String} type The mimeType of the source
	*/
	Pryntr.prototype.pryntSources = function(sources, type){
		sources = typeof sources === "string"? [sources]: sources;
		var downloader = this.downloader.getDownloader();
		downloader.sourceDownloader(sources, true, type);
	};

	/**
	* Module for downloading the SVG sources in SVG, PDF+Layout & JPG
	*/
	Pryntr.prototype.downloader = (function(){

		function Downloader(rasterizer){
			this.rasterizer = rasterizer;
		};

		/**
		* Expose the available download types
		* @return {Array.<String>} The available download types
		*/
		Downloader.prototype.canDownload = function(){
			return ["svg", "jpg", "png"];
		};

		/**
		* Download sources according to the downloadType specified
		* @param {Object|Array.<Object>} The sources to be downloaded
		* @param {String} downloadType The download type specified
		*/
		Downloader.prototype.download = function(sources, downloadType){
			downloadType = downloadType.toLowerCase();
			if (downloadType === "svg"){
				this.SVGDownloader(sources);
			}
			else if(downloadType === "jpg"){
				this.JPGDownloader(sources);
			}
			else if(downloadType === "png"){
				this.PNGDownloader(sources);
			}
			else if (downloadType === "pdf"){
				this.PDFDownloader(sources);
			}
			else{
				console.log("The download type " + downloadType + " is not supported");
			}
		};

		/**
		* Generate file name from source object
		* @param {Object} [source] The source object
		* @param {Number} [index] The source index
		* @param {String} [downloadType="zip"] The download type specified
		* @return {String} The filename for the zip or individual files inside zip or independent
		*/
		Downloader.prototype.getFileName = function(source, index, downloadType){
			var name = typeof index === "number"? ("Image_" + String(index)): "Downloads";
			var extension = typeof downloadType === "string"? downloadType.toLowerCase(): "zip";
			return name + "." + extension;
		};

		/**
		* Generate a new zipper
		* @return {Object} A zipper Object
		*/
		Downloader.prototype.zipper = function(){
			return new JSZip();
		};

		/**
		* Generate a new pdf Document
		* @return {Object} A pdf document
		*/
		Downloader.prototype.pdfDoc = function(){
			return new jsPDF();
		};

		/**
		* Add a new file to the zipper
		* @param {Object} zipper The zipper Object
		* @param {String} name The file name
		* @param {String} content The file contents
		* @param {Object} options The file options
		*/
		Downloader.prototype.addToZip = function(zipper, name, content, options){
			typeof options === "object"? zipper.file(name, content, options): zipper.file(name, content);
		};

		/**
		* Add sources to a zip object
		* @param {Object|Array.<Object>} sources The sources for zipping
		* @param {Object} zipper The zipper object in which the source/s are to be added
		* @param {String} downloadType The download type for the sources
		* @param {Object} options The options for adding the file to zipper
		*/
		Downloader.prototype.addSourcesToZip = function(sources, zipper, downloadType, options){
			if (typeof sources.length !== "number"){
				sources = [sources];
			}
			for (var i = 0; i < sources.length; i++){
				var source = sources[i];
				source = typeof source === "string"? source: source.source;
				if (typeof source === "string"){
					var name = this.getFileName(source, i, downloadType);
					this.addToZip(zipper, name, source, options);
				}
			}
		};

		/**
		* Get a zipper object to download in the browser
		* @param {Object} zipper The zipper object
		*/
		Downloader.prototype.getZip = function(zipper){
			var name = this.getFileName();
			var blob = zipper.generate({type: "blob"});
			saveAs(blob, name);
		};

		/**
		* Transform the sources to suit the target MIME
		* @param {Object|Array.<Object>} The SVG sources to download
		* @param {String} sourceMIME The MIME type for the source
		* @param {String} targetMIME The MIME type expected for the target
		* @return {Array.<Object>} The SVG sources in the target format
		*/
		Downloader.prototype.transformSources = function(sources, sourceMIME, targetMIME){
			if (typeof sources.length !== "number"){
				sources = [sources];
			}
			if (sourceMIME !== targetMIME){
				for (var i = 0; i < sources.length; i++){
					var source = sources[i];
					if (typeof source.source === "string"){
						source.source = this.rasterizer.transformSource(source.source, sourceMIME, targetMIME);
					}
				}
			}
		};

		Downloader.prototype.sourceDownloader = function(sources, toZip, format){
			if (typeof sources.length !== "number"){
				sources = [sources];
			}
			var zipper = this.zipper();
			this.addSourcesToZip(sources, zipper, format);
			this.getZip(zipper);
		};

		/**
		* Browser download of SVG/s source in SVG format
		* @param {Object|Array.<Object>} The SVG sources to download
		* @param {Boolean} [toZip=true] True if the contents are to be zipped
		*/
		Downloader.prototype.SVGDownloader = function(sources, toZip){
			if (typeof sources.length !== "number"){
				sources = [sources];
			}
			var zipper = this.zipper();
			this.addSourcesToZip(sources, zipper, "svg");
			this.getZip(zipper);
		};

		/**
		* Browser download of SVG/s source in JPG format
		* @param {Object|Array.<Object>} The SVG sources to download
		* @param {Boolean} [toZip=true] True if the contents are to be zipped
		*/
		Downloader.prototype.JPGDownloader = function(sources, toZip){
			if (typeof this.rasterizer !== "undefined"){
				if (typeof sources.length !== "number"){
					sources = [sources];
				}
				this.transformSources(sources, "image/svg+xml", "image/jpeg");
				var zipper = this.zipper();
				this.addSourcesToZip(sources, zipper, "jpg", {base64: true});
				this.getZip(zipper);
			}
		};

		/**
		* Browser download of SVG/s source in PNG format
		* @param {Object|Array.<Object>} The SVG sources to download
		* @param {Boolean} [toZip=true] True if the contents are to be zipped
		*/
		Downloader.prototype.PNGDownloader = function(sources, toZip){
			if (typeof this.rasterizer !== "undefined"){
				if (typeof sources.length !== "number"){
					sources = [sources];
				}
				this.transformSources(sources, "image/svg+xml", "image/png");
				var zipper = this.zipper();
				this.addSourcesToZip(sources, zipper, "png", {base64: true});
				this.getZip(zipper);
			}
		};

		/**
		* Browser download + layout of SVG/s source in PDF format
		* @param {Object|Array.<Object>} The SVG sources to download
		* @param {Boolean} [toZip=true] True if the contents are to be zipped
		*/
		Downloader.prototype.PDFDownloader = function(sources, toZip){
			console.log("I'm responsible for downloading PDF");
		};

		var downloader = {
			getDownloader: function(rasterizer){
				return new Downloader(rasterizer);
			}
		};

		return downloader;

	}());

	/**
	* Calculate the positioning of rects in pages
	*/
	Pryntr.prototype.layoutEngine = (function(){

		var consts = {};
		var conf = {};

		function LayoutEngine(){
			this.consts = consts;
			this.conf = conf;
		}

		var layoutEngine = {
			getLayer: function(){
				return new LayoutEngine(conf);
			}
		};

	});

	/**
	* Module for converting vector SVG into JPEG by rendering it onto a canvas and ripping it back
	*/
	Pryntr.prototype.rasterize = (function(){

		var consts = {
			svgMIME: "image/svg+xml",
		};

		function Rasterize(){
			this.consts = consts;
		};

		/**
		* Convert a vector source to another format
		* @param {String} source The source string
		* @param {String} sourceMIME The MIME type for the source
		* @param {String} targetMIME The MIME type for the target
		* @return {String} The b64 encoded transformed source(Not in URI scheme)
		*/
		Rasterize.prototype.transformSource = function(source, sourceMIME, targetMIME){
			var sourceScheme = this.mimeToScheme(sourceMIME);
			var targetScheme = this.mimeToScheme(targetMIME);
			var img = this.sourceToImage(source, sourceScheme);
			var canvas = this.imgToCanvas(img);
			var sourceURI = this.canvasToURI(canvas, targetMIME);
			var source = this.sliceURI(sourceURI, targetScheme);
			return source;
		};

		/**
		* Paint in image element on a canvas
		* @param {Object} img A HTML image object
		* @return {Object} A HTML canvas object with the image painted on it
		*/
		Rasterize.prototype.imgToCanvas = function(img){
			var canvas = document.createElement("canvas");
			canvas.width = img.width;
			canvas.height = img.height;
			var ctx = canvas.getContext("2d");
			ctx.rect(0, 0, canvas.width, canvas.height);
			ctx.fillStyle = "white";
			ctx.fill();
			ctx.drawImage(img, 0, 0);
			return canvas;
		};

		/**
		* Rip off the canvas content
		* @param {Object} canvas The canvas which has to be ripped
		* @param {String} type The type of ripping image/jpg, image/
		*/
		Rasterize.prototype.canvasToURI = function(canvas, type){
			return (canvas.toDataURL(type)).toString();
		};

		/**
		* Slice the Data URI scheme off
		* @param {String} uriString The jpegURI string
		* @param {String} mimeScheme The mime Scheme string
		* @return {String} The string without the URI scheme
		*/
		Rasterize.prototype.sliceURI = function(uriString, mimeScheme){
			return uriString.slice((mimeScheme).length);
		};

		/**
		* Convert String to base64, escape Unicode characters
		* Use 
		* @param {String} binaryString The binary string 16 bit DOM string
		* @return {String} The base64 ASCII conversion for the string 8 bit ASCII string
		*/
		Rasterize.prototype.toBase64 = function(binaryString){
			return btoa(unescape(encodeURIComponent(binaryString))); // Using the deprecated unescape method
			//return btoa(decodeURIComponent(encodeURIComponent(binaryString))); // Using decodeURIComponent method
/*			return btoa(encodeURIComponent(binaryString).replace(/%([0-9A-F]{2})/g, function(match, p1) { // Regex escaping
				return String.fromCharCode('0x' + p1);
			}));*/
		};

		/**
		* Convert mimeType to URI Scheme
		* @param {String} mimeType The mime
		* @return {String} The mimeType
		*/
		Rasterize.prototype.mimeToScheme = function(mimeType){
			return "data:" + mimeType + ";base64,";
		};

		/**
		* Convert binary string to a data URI format
		* @param {String} source The data binary string
		* @param {String} mimeScheme The mime scheme string
		* @param {String} The source binary to base64 ASCII in URI scheme
		*/
		Rasterize.prototype.stringToDataURI = function(source, mimeScheme){
			return mimeScheme + this.toBase64(source); 
		};

		/**
		* Add an image binary string to an img element as data URI
		* @param {String} source The image binary string
		* @param {String} mimeScheme The source mime uri scheme
		* @return {Object} The img element with src as image data URI
		*/
		Rasterize.prototype.sourceToImage = function(source, mimeScheme){
			return this.toImage(this.stringToDataURI(source, mimeScheme));
		}

		/**
		* Create an image element with the specified source
		* @param {String} imageSource The image source
		* @return {Object} The img element with src as the source
		*/
		Rasterize.prototype.toImage = function(imageSource){
			var img = new Image;
			img.src = imageSource;
			return img;
		};

		var raster = {
			getRasterizer: function(){
				return new Rasterize();
			}
		}

		return raster;


	}());

	/**
	* Module for sugary SVG serializing
	* @return {Object} An object which has functions for sugary serializing a SVG
	* TODO: fetch the css styling by getting appropriate styles from the browser and applying it inline
	*/
	Pryntr.prototype.SVGSerializer = (function(){
		var consts = {
			svgPrefix: {xmlns: "http://www.w3.org/2000/xmlns/", xlink: "http://www.w3.org/1999/xlink", svg: "http://www.w3.org/2000/svg"},
			svgDoctype: '<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">',
		};

		/**
		* Sugary serialize a SVG
		*/
		function SugarSerializer(){
			this.consts = consts;
		};

		/**
		* Check if the element is a string, if yes consider it as a selector and fetch it
		* @param {String|Object} element The element to be checked and/or fetched
		* @return {Object} The Node element
		*/
		SugarSerializer.prototype.fetchIfSelector = function(element){
			element = typeof element === "string"? this.getElement(element): element;
			return element;
		}

		/**
		* Check if the element has a property whose value matches the expected value
		* @param {String|Object} element The element to be checked
		* @param {String} property The property of the element to be checked
		* @param {String} expectedValue The expected value of the property
		* @return {Boolean} True if the property value matches the expected value
		*/
		SugarSerializer.prototype.checkElementProperty = function(element, property, expectedValue){
			var match = false;
			element = this.fetchIfSelector(element);
			if (typeof element === "object" && typeof element[property] !== "undefined"){
				match = element[property] === expectedValue;
			}
			return match;
		}

		/**
		* Check if a Node has the tag name svg
		* @param {String|Object} element The element on which SVG check is to be done
		* @return {Boolean} True if the element is found and it is an svg
		*/
		SugarSerializer.prototype.isSVG = function(element){
			element = this.fetchIfSelector(element);
			return this.checkElementProperty(element, "tagName", "svg");
		};

		/**
		* Add a child node to the parent if it dosen't exist
		* @param {String} parentSelector The selector for parent element
		* @param {String} relativeChildSelector The relative selector for the child element
		* @param {String} childType The element type of the child
		* @param {Boolean} [addFirst=false] if adding to the first position on the parent
		* @return {Object} The child element
		*/
		SugarSerializer.prototype.addChildIfNonExistent = function(parentSelector, relativeChildSelector, childType, addFirst){
			var child = undefined;
			addFirst = typeof addFirst === "boolean"? addFirst: false;
			var fullChildSelector = this.generateFullChildSelector(parentSelector, relativeChildSelector, true);
			if (this.elementExists(fullChildSelector) === false){
				var parent = this.fetchIfSelector(parentSelector);
				child = document.createElement(childType);
				// Add last or first based on addFirst
				addFirst === true? parent.insertBefore(child, parent.firstChild): parent.appendChild(child);
			}
			else{
				child = this.fetchIfSelector(fullChildSelector);
			}
			return child;
		};

		/**
		* Check if a parent has a child with relative selector
		* @param {String} parentSelector The selector of the parent element
		* @param {String} relativeChildSelector The relative selector of the child element
		* @return {Boolean} True if the parent has the child inside it
		*/
		SugarSerializer.prototype.childExists = function(parentSelector, relativeChildSelector){
			var fullChildSelector = this.generateFullChildSelector(parentSelector, relativeChildSelector, true);
			return this.elementExists(fullChildSelector);
		};

		/**
		* Add a child to the parent
		* @param {String|Object} parent The selector of the parent element
		* @param {String} childType The type of the child element to be appended
		* @param {Boolean} [addFirst=false] If adding to the first position on the parent
		*/
		SugarSerializer.prototype.addChild = function(parentSelector, childType, addFirst){
			var child = undefined;
			addFirst = typeof addFirst === "boolean"? addFirst: false;
			var parent = this.fetchIfSelector(parentSelector);
			if (this.elementExists(parent) === true){
				child = document.createElement(childType);
				// Add last or first based on addFirst
				addFirst === true? parent.insertBefore(child, parent.firstChild): parent.appendChild(child);
			}
			return child;
		};

		/**
		* Serialize an element to string
		* @param {String|Object} element The element to be serialized
		* @return {String} The serialized element
		*/
		SugarSerializer.prototype.serialize = function(element){
			var serial = undefined;
			var element = this.fetchIfSelector(element);
			if (this.elementExists(element)){
				serial = (new XMLSerializer()).serializeToString(element);
			}
			return serial;
		};

		/**
		* Check if an element exists in the DOM
		* @param {String|Object} element The element/selector
		* @return {Boolean} True if the element is an object or the selector points to a DOM element
		*/
		SugarSerializer.prototype.elementExists = function(element){
			var exists = false;
			element = this.fetchIfSelector(element);
			return typeof element === "object" && element !== null;
		}

		/**
		* Generate full child selector from parent selector and relative child selector
		* @param {String} parentSelector The selector for the parent element
		* @param {String} relativeChildSelector The relative child selector from the parent
		* @param {Boolean} [direct=true] Generate direct child selector
		* @return {String} The full child selector
		*/
		SugarSerializer.prototype.generateFullChildSelector = function(parentSelector, relativeChildSelector, direct){
			direct = typeof direct === "boolean"? direct: true;
			var connector = direct === true? " > ": " ";
			return parentSelector + connector + relativeChildSelector;
		}

		/**
		* Fetch an element from the DOM given a selector
		* @param {String} selector The selector of the element to be fetched
		* @return {Object} The Node
		*/
		SugarSerializer.prototype.getElement = function(selector){
			var ele = document.querySelector(selector);
			ele = ele === null? undefined: ele;
			return ele;
		};

		/**
		* Fetch elements matching the selectors
		* @param {Array.<String|Object>} selectors The array of selectors
		* @return {Array.<Object>} The array of elements corresponding to the selectors
		*/
		SugarSerializer.prototype.getElements = function(selectors){
			var elements = [];
			for (var i = 0; i < selectors.length; i++){
				elements.push(this.fetchIfSelector(selectors[i]));
			}
			return elements;
		}

		/**
		* Get the clone of a DOM element
		* @param {String|Object} element The selector/node of which a clone is desired
		* @param {Boolean} [deep=true] If true, fetch a deep clone of the element
		* @return {Object} The clone of the element
		*/
		SugarSerializer.prototype.getElementClone = function(element, deep){
			element = this.fetchIfSelector(element);
			deep = typeof deep === "boolean"? deep: true;
			var clone = (typeof element === "object" && typeof element.cloneNode === "function")? element.cloneNode(deep): undefined;
			return clone;
		};

		/**
		* Get the image sources and bounding box information
		* @param {String|Array.<String>|Array.<Object>} elements The elements whose info is sought
		* @param {String} styles The styles to be added to the source
		* @return {Array.<Object>} The info objects containing sources and box infos
		*/
		SugarSerializer.prototype.getSugaryInfos = function(elements, styles){
			var sources = [];
			elements = typeof elements === "string"? [elements]: elements;
			for (var i = 0; i < elements.length; i++){
				if (this.isSVG(elements[i]) === true){
					sources.push(this.getSugaryInfo(elements[i], styles));
				}
			}
			return sources;
		};

		/**
		* Get the image source and bounding box information
		* @param {String|Object} element The element whose info is sought
		* @param {String} styles The styles to be added to the source
		* @return {Object} The info object containing source and box info
		*/
		SugarSerializer.prototype.getSugaryInfo = function(element, styles){
			var info = this.getBounds(element);
			info["source"] = this.getSugarySource(element, styles);
			return info;
		};

		/**
		* Get the sugary and styled source of the svg
		* @param {String|Object} element The svg element
		* @param {String} [styles=""] The styles to be added to the svg
		* @return {String} The sugared and styled source
		*/
		SugarSerializer.prototype.getSugarySource = function(element, styles){
			var sugaryElement = this.getSugaryClone(element, styles);
			var source = this.serialize(sugaryElement);
			if (typeof source === "string"){
				source = this.consts.svgDoctype + source;
			}
			return source;
		};

		/**
		* Clone a svg and add sugar and style to it
		* @param {String|Object} element The svg element
		* @param {String} [styles=""] The styles to be added to the svg
		* @return {Object} The sugared and styled clone
		*/
		SugarSerializer.prototype.getSugaryClone = function(element, styles){
			var clone = undefined;
			element = this.fetchIfSelector(element);
			styles = typeof styles === "string"? styles: "";
			if (this.isSVG(element) === true){
				clone = this.getElementClone(element);
				// Add Sugar, Style and everything nice
				this.addSugarToSVG(clone);
				this.addStyleToSVG(clone, styles);
			}
			return clone;
		};

		/**
		* Pop the innerText of an element
		* @param {String|Object} element The element whose text is to be popped
		* @param {String} The popped text
		*/
		SugarSerializer.prototype.popText = function(element){
			element = this.fetchIfSelector(element);
			var text = "";
			if (this.elementExists(element) === true && typeof element.innerText === "string"){
				text = element.innerText;
				element.innerText = "";
			}
			return text;
		}

		/**
		* Append text to an element with prefix and suffix
		* @param {String|Object} element The element whose text is to be appended
		* @param {String} [textToAppend=""] The text append
		* @param {String} [prefix=""] The prefix to append
		* @param {String} [suffix=""] The suffix to append
		*/
		SugarSerializer.prototype.appendText = function(element, textToAppend, prefix, suffix){
			element = this.fetchIfSelector(element);
			if (this.elementExists(element) === true && typeof element.innerText === "string"){
				var currentText = element.innerText;
				prefix = typeof prefix === "string"? prefix: "";
				suffix = typeof suffix === "string"? suffix: "";
				textToAppend = typeof textToAppend === "string"? textToAppend: "";
				element.innerText = currentText + prefix + textToAppend + suffix;
			}
		};

		/**
		* Append CDATA text to an element with prefix and suffix
		* @param {String|Object} element The element on which the CDATA section is to be applied
		* @param {String} [textToAppend=""] The text append
		*/
		SugarSerializer.prototype.addCDATASection = function(element, textToAppend){
			element = this.fetchIfSelector(element);
			textToAppend = typeof textToAppend === "string"? textToAppend: "";
			if (this.elementExists(element) === true){
				var doc = new DOMParser().parseFromString("<svg></svg>", "image/svg+xml");
				var cdata = doc.createCDATASection(textToAppend);
				element.appendChild(cdata);
			}
		};

		/**
		* Get the bounds from the bounding client rect for an element
		* @param {String|Object} element The element whose bounds are to be found
		* @return {Object} The bounds of the element
		*/
		SugarSerializer.prototype.getBounds = function(element){
			element = this.fetchIfSelector(element);
			var bounds = {};
			if (this.elementExists(element)){
				var rect = element.getBoundingClientRect();
				bounds.top = rect.top;
				bounds.bottom = rect.bottom;
				bounds.left = rect.left;
				bounds.right = rect.right;
				bounds.height = rect.height;
				bounds.width = rect.width;
			};
			return bounds;
		};

		/**
		* Add styles information to svg in a CDATA section to avoid XML conversion issues
		* @param {Object} svg The svg to which styles are to be added
		* @param {String} [styles=""] The styles to be added
		* @return {Object} The style element inside the svg
		*/
		SugarSerializer.prototype.addStyleToSVG = function(svg, styles){
			styles = typeof styles === "string"? styles: "";
			var defs = this.getChildType(svg, "defs", true);
			var style = this.getChildType(defs, "style", false);
			var currentStyle = this.popText(style);
			this.addCDATASection(style, currentStyle + "\n" + styles);
			return style;
		}

		/**
		* Add some sugary properties to an svg element which
		* are apparenty needed, makes no assumptions on DOM presence
		* @param {Object} svg The svg element on which sugar is to be added
		* @return {Object} The svg object with sugar added
		*/
		SugarSerializer.prototype.addSugarToSVG = function(svg){
			svg = this.fetchIfSelector(svg);
			var svgExists = this.elementExists(svg);
			if (svgExists === false){
				return undefined;
			}
			svg.setAttribute("version", "1.1");
			svg.removeAttribute("xmlns");
			svg.removeAttribute("xlink");
			var xmlns = this.consts.svgPrefix.xmlns;
			var xlink = this.consts.svgPrefix.xlink;
			var svgns = this.consts.svgPrefix.svg;
			if (svg.hasAttributeNS(xmlns, "xmlns") === false) {
				svg.setAttributeNS(xmlns, "xmlns", svgns);
			}
			if (svg.hasAttributeNS(xmlns, "xmlns:xlink") === false) {
				svg.setAttributeNS(xmlns, "xmlns:xlink", xlink);
			}
			var defs = this.getChildType(svg, "defs", true);
			var style = this.getChildType(defs, "style", false);
			return svg;
		};

		/**
		* Get the child of a type from an element, if not present add
		* @param {String|Object} element The element to add the child to
		* @param {String} childType The type of the child element
		* @param {Boolean} addFirst True if addition as the first child
		* @return {Object}
		*/
		SugarSerializer.prototype.getChildType = function(element, childType, addFirst){
			addFirst = typeof addFirst === "boolean"? addFirst: false;
			element = this.fetchIfSelector(element);
			var child = undefined;
			if (this.elementExists(element) === true){
				child = element.querySelector(childType);
				if (this.elementExists(child) === false){
					this.addChild(element, childType, addFirst);
				}
			}
			return child;
		}

		var sugarSerializer = {
			getSugarSerializer: function(){
				return new SugarSerializer();
			}
		};

		return sugarSerializer;
	}());

	/**
	* Module for style sheet wrangling
	* @return {Object} An object which has functions for wrangling style sheets
	*/
	Pryntr.prototype.cssWrangler = (function(){

		/**
		* Class for fetching page CSS Information
		*/ 
		function CSSWrangler(){
		};

		/**
		* Get the style string of all documents
		* @return {String} The style string from all sheets of all documents
		*/
		CSSWrangler.prototype.getStylesString = function(){
			style = this.getSheetsString(this.getSheets(this.getDocs()));
			return style;
		};

		/**
		* Convert a list to an array
		* @param {Object} list The list
		* @return {Array.<Object>} The array from the list
		*/
		CSSWrangler.prototype.listToArray = function(list){
			return Array.prototype.slice.call(list);
		}

		/**
		* Get the auxiliary docs
		* @return {Array.<Object>} Array of aux doc nodes
		*/
		CSSWrangler.prototype.getAuxDocuments = function(){
			var iframes = this.listToArray(document.querySelectorAll("iframe"));
			var objects = this.listToArray(document.querySelectorAll("object"));
			var aux = iframes.concat(objects);
			return aux;
		};

		/**
		* Convert from Nodes to Docs
		* @param {Array.<Object>} docs The array of aux nodes
		* @return {Array.<Object>} The array of aux docs
		*/
		CSSWrangler.prototype.filterAuxDocuments = function(docs){
			var validDocs = [];
			for (var i = 0; i < docs.length; i++){
				if (typeof docs[i].contentDocument === "object"){
					validDocs.push(docs[i].contentDocument);
				}
			}
			return validDocs;
		};

		/**
		* Return the documents present currently in the window
		*  @return {Array.<Object>} The docs
		* TODO: Also get the iframes and objects and filter on .contentDocument
		*/
		CSSWrangler.prototype.getDocs = function(){
			var documents = [window.document];
			var aux = this.filterAuxDocuments(this.getAuxDocuments());
			return documents.concat(aux);
		}

		/**
		* Return the styleSheets of a document/documents
		* @param {Object} docs The docs from which the stylesheet is to be extracted
		* @return {Array.<Object>} The Array with CSSStyleSheets
		*/
		CSSWrangler.prototype.getSheets = function(docs){
			var sheets = [];
			docs = typeof docs.length !== "number"? [docs]: docs;
			for (var i = 0; i < docs.length; i++){
				var doc = docs[i];
				var docSheet = typeof doc.styleSheets !== "undefined"? doc.styleSheets: undefined;
				if (typeof docSheet === "object" && typeof docSheet.length === "number"){
					//docSheet = this.listToArray(docSheet);
					for (var j = 0; j < docSheet.length; j++){
						sheets.push(docSheet[j]);
					}
				}
			}
			return sheets;
		}

		/**
		* Get the string representation of a StyleSheet array
		* @param {Array.<Object>} styleSheets The CSSStyleSheet array
		* @return {String} The String with rules from the sheets
		*/
		CSSWrangler.prototype.getSheetsString = function(styleSheets){
			var styles = "";
			if (typeof styleSheets.length === "number"){
				for (var i = 0; i < styleSheets.length; i++){
					styles += this.getSheetString(styleSheets[i]);
				}
			}
			return styles;
		};

		/**
		* Get the rules of a css sheet into a string
		* @param {Object} sheet The css sheet
		* @param {String} [styles=""] The string of styles for recursion
		* @return {String} The string of styles
		*/
		CSSWrangler.prototype.getSheetString = function(sheet, styles){
			styles = typeof styles === "undefined"? "": styles;
			if (typeof sheet.cssRules === "object" && sheet.cssRules !== null){
				for (var i = 0; i < sheet.cssRules.length; i++){
					var rule = sheet.cssRules[i];
					if (rule.type === 3){
						styles = styles + this.getSheetString(rule.styleSheet, styles);
					}
					else if (typeof rule.selectorText !== "undefined"){
						styles = styles + "\n" + rule.cssText;
					}
				}
			}
			return styles;
		};

		var cssWrangler = {
			getWrangler: function(){
				return new CSSWrangler();
			}
		}

		return cssWrangler;

	}());

	var pryntr = {
		get: function(){
			return new Pryntr();
		}
	};

	return pryntr;
}());