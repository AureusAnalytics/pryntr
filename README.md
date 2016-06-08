# pryntr.js

Convert and download DOM SVGs client side to SVGs, JPGs or PNGs

Usage
```javascript
var selectorArray = ["#mychart", "body svg"]; // The CSS selector/s for the SVG/s
var expectedType = "png"; // The expected download type(svg, jpg or png as of now)
var pryntObject = pryntr.get(); // Get a pryntr object
pryntObject.prynt(selectorArray, expectedType); // Serialize and download the SVGs
```

The prynt object consists of a CSS wrangler, a SVG serializer, a rasterizer and a downloader.

The CSS Wrangler can be used for getting styles from a document
```javascript
var cssWrangler = pryntObject.cssWrangler.getWrangler(); // Get the CSS wrangler object
var styles = cssWrangler.getStylesString(); // Get a newline separated string representation of cssText for all rules from all the style sheets in the document
```

The SVG serializer can be used for serializing a dynamically generated SVG from DOM.
```javascript
var serializer = pryntObject.SVGSerializer.getSugarSerializer();
var sources = serializer.getSugaryInfos(selectorArray, styles); // Get the serialized representation of the DOM SVGs with styles added in the defs section and some other sugary properties added. The sources array consists of an array of objects each of which has a property called source which holds the serialized representation. Additioal fields contain metadata about the dimensions of the image.
```


The rasterizer can be used for converting a serialized SVG representation to a raster image source.
```javascript
var pryntObject = pryntr.get();
var rasterizer = pryntObject.rasterize.getRasterizer(); // Get the rasterizer object
var transformedSources = rasterizer.transformSources(sources, sourceMIME, targetMIME); // Transforms the serialized source to other formats by drawing it out to a canvas and using toDataURL. The allowed target MIME types are "image/jpeg" and "image/png"
```

The downloader can be used to provide zipped downloads
```javascript
var pryntObject = pryntr.get();
var rasterizer = pryntObject.rasterize.getRasterizer();
var downloader = this.downloader.getDownloader(rasterizer);
downloader.sourceDownload(sources, true, format); // Download zipped base64 encoded sources with the target format
```

### Todos
- PDF download
- Conversion and/or inlining of CSS rules
- Unzipped download