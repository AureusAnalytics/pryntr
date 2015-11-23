/** @preserve
 * pryntr - Download SVG documents in PDF, JPG or SVG.
 * Version 0.0
 *
 * Copyright (c) 2015 AureusAnalytics, https://github.com/AureusAnalytics
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


var getPDFFromSVGs = function(jsonString, conf) {
                var processing = true;
                var photos = JSON.parse(jsonString);
                var config = JSON.parse(conf);
                var defaultConfig = {downloadType: "PDF", oneOnAPage: false, vertical:"north", fontsize: 13, xpad: 10, ypad: 10, titleTop: true, fonttype:"", font:"times", favicon:""}
                var pids = []
                photos.forEach(function(photo){
                    pids.push(photo["parentId"]);
                });
                var doc = new jsPDF();
                //var imgDict = {};
                var gloCount = photos.length;
                pageHeight = doc.internal.pageSize.height;
                pageWidth = doc.internal.pageSize.width;

                // console.log("Page width is " + pageWidth + ", and page height is " + pageHeight);

                // Load config
                var favicon = config.favicon;
                var fontsize = !isNaN(parseInt(config.fontsize))?parseInt(config.fontsize):(defaultConfig.fontsize);
                var fonttype = config.fonttype == "bold" || config.fonttype == "italic" || config.fonttype == "bolditalic"?config.fonttype:defaultConfig.fonttype;
                var font = config.font == "times" || config.font == "courier" || config.font == "helvetica"?config.font:defaultConfig.font;
                var xpad = !isNaN(parseInt(config.xpad))?parseInt(config.xpad):(defaultConfig.xpad);
                var ypad = !isNaN(parseInt(config.ypad))?parseInt(config.ypad):(defaultConfig.ypad);
                var oneOnAPage = config.oneOnAPage == "true"?true:(config.oneOnAPage == "false"?false:defaultConfig.oneOnAPage);
                var vertical = (config.vertical == "north" || config.vertical == "south" || config.vertical == "east" || config.vertical == "west")?config.vertical:defaultConfig.vertical;
                var titleTop = config.titleTop == "true"?true:(config.titleTop == "false"?false:defaultConfig.titleTop);
                var downloadType = config.downloadType == "PDF"?"PDF":(config.downloadType == "SVG"?"SVG":(config.downloadType == "JPG" || config.downloadType == "JPEG"?"JPG":defaultConfig.downloadType));
                //console.log("The download type is " + downloadType + " fontsize is " + fontsize + " xpad is " + xpad);
                var y = 0;
                doc.setFontSize(fontsize);
                doc.setFontType(config.fonttype);
                doc.setFont(config.font);
                // End of Load config

                function getVectorString(parentIds) {
                  var results = {}
                  parentIds.forEach(function(parentId){
                    results[parentId] = "";
                  })
                  var doctype = '<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">';

                  window.URL = (window.URL || window.webkitURL);

                  var body = document.body;

                  var prefix = {
                    xmlns: "http://www.w3.org/2000/xmlns/",
                    xlink: "http://www.w3.org/1999/xlink",
                    svg: "http://www.w3.org/2000/svg"
                  }

                  return initialize();

                  function initialize() {
                    var documents = [window.document],
                        SVGSources = [];
                        iframes = document.querySelectorAll("iframe"),
                        objects = document.querySelectorAll("object");

                    [].forEach.call(iframes, function(el) {
                      try {
                        if (el.contentDocument) {
                          documents.push(el.contentDocument);
                        }
                      } catch(err) {
                        console.log(err)
                      }
                    });

                    [].forEach.call(objects, function(el) {
                      try {
                        if (el.contentDocument) {
                          documents.push(el.contentDocument);
                        }
                      } catch(err) {
                        console.log(err)
                      }
                    });

                    documents.forEach(function(doc) {
                      var styles = getStyles(doc);
                      var newSources = getSources(doc, styles);
                      // because of prototype on NYT pages
                      for (var i = 0; i < newSources.length; i++) {
                        SVGSources.push(newSources[i]);
                      };
                    })
                    //console.log("The dtype is " + downloadType);
                    if (downloadType == "SVG"){
                        //console.log("Downloading in SVG type");
                        downloadAll(SVGSources, "SVG");
                        return null;
                    }
                    else if (downloadType == "JPG"){
                        //console.log("Downloading in JPG type")
                        downloadAll(SVGSources, "JPG");
                        return null;
                    }
                    else{
                        return SVGSources;
                    }
                    // if (SVGSources.length > 1) {
                    //   createPopover(SVGSources);
                    // } else if (SVGSources.length > 0) {
                    //   download(SVGSources[0]);
                    // } else {
                    //   alert("Couldn’t find any SVG nodes.");
                    // }
                  }

                  function getSources(doc, styles) {
                    var svgInfo = [];
                        //svgs = doc.querySelectorAll("svg");
                    // var svgs = [];
                    // parentIds.forEach(function(parentId){
                    //   svgs.push(doc.querySelector("#" + parentId + "svg"));
                    // });


                    styles = (styles === undefined) ? "" : styles;

                    [].forEach.call(parentIds, function (parentId) {
                      svg = document.querySelector("#" + parentId + " svg")
                      //console.log("Got svg as " + svg)
                      svg.setAttribute("version", "1.1");
                      svg.setAttribute("background", "")
                      var defsEl = document.createElement("defs");
                      svg.insertBefore(defsEl, svg.firstChild); //TODO   .insert("defs", ":first-child")
                      // defsEl.setAttribute("class", "svg-crowbar");

                      var styleEl = document.createElement("style")
                      defsEl.appendChild(styleEl);
                      styleEl.setAttribute("type", "text/css");


                      // removing attributes so they aren't doubled up
                      svg.removeAttribute("xmlns");
                      svg.removeAttribute("xlink");

                      // These are needed for the svg
                      if (!svg.hasAttributeNS(prefix.xmlns, "xmlns")) {
                        svg.setAttributeNS(prefix.xmlns, "xmlns", prefix.svg);
                      }

                      if (!svg.hasAttributeNS(prefix.xmlns, "xmlns:xlink")) {
                        svg.setAttributeNS(prefix.xmlns, "xmlns:xlink", prefix.xlink);
                      }

                      var source = (new XMLSerializer()).serializeToString(svg).replace('</style>', '<![CDATA[' + styles + ']]></style>');
                      // console.log("source is \n" + source)
                      var rect = svg.getBoundingClientRect();
                      svgInfo.push({
                        top: rect.top,
                        left: rect.left,
                        width: rect.width,
                        height: rect.height,
                        class: svg.getAttribute("class"),
                        id: svg.getAttribute("id"),
                        childElementCount: svg.childElementCount,
                        source: [doctype + source],
                        pid: parentId
                      });
                    });
                    return svgInfo;
                  }

                  function download(source, type) {
                    var filename = "untitled";
                    var a = document.createElement("a");
                    if (source.id) {
                      filename = source.id;
                    } else if (source.class) {
                      filename = source.class;
                    } else if (source.pid) {
                      filename = source.pid;
                    }else if (window.document.title) {
                      filename = window.document.title.replace(/[^a-z0-9]/gi, '-').toLowerCase();
                    }
                    if (type == "SVG"){
                        var url = window.URL.createObjectURL(new Blob(source.source, { "type" : "text\/xml" }));
                        a.setAttribute("download", filename + ".svg");
                    }
                    else if (type == "JPG"){
                        a.setAttribute("download", filename + ".jpg");
                        //console.log("The filename is " + filename + ".jpg");
                        var img = new Image, data, ret={data: null, pending: true};
                        img.onError = function() {
                                        throw new Error('Cannot load image: "'+url+'"');
                        }
                        htmlX = source.source;
                        var imgsrcX = 'data:image/svg+xml;base64,' + btoa(htmlX);
                        var imgX = '<img src="' + imgsrcX + '">';
                        img.src = imgsrcX;
                        var canvas = document.createElement('canvas');
                        document.body.appendChild(canvas);
                        canvas.width = source.width;
                        canvas.height = source.height;
                        var ctx = canvas.getContext('2d');
                        ctx.rect(0,0,canvas.width,canvas.height);
                        ctx.fillStyle="white";
                        ctx.fill();
                        ctx.drawImage(img, 0, 0);
                    //    var url = window.URL.createObjectURL(new Blob(canvas.toDataURL('image/jpeg').slice('data:image/jpeg;base64,'.length), {"type" : "image\/jpeg"}));
                        // Grab the image as a jpeg encoded in base64, but only the data
                    //    data = canvas.toDataURL('image/jpeg').slice('data:image/jpeg;base64,'.length);
                        var url = canvas.toDataURL('image/jpeg');//.slice('data:image/jpeg;base64,'.length);
                        //console.log("converted to jpeg")
                        // Convert the data to binary form
                    //    data = atob(data);
                        document.body.removeChild(canvas);
                    }


                    // TO append
                    body.appendChild(a);
                    a.setAttribute("class", "svg-extractor");

                    //a.setAttribute("download", filename + ".svg");
                    a.setAttribute("href", url);
                    a.style["display"] = "none";
                    a.click();

                    setTimeout(function() {
                      window.URL.revokeObjectURL(url);
                    }, 10);
                  }


                                      // DOWNLOAD ALL BEGINNING
                    // FOR DOWNLOADING ALL THE SVG's AND JPG's IN A ZIP FORMAT
                function downloadAll(sources, type) {
                    var filename = type + "images";
                    var a = document.createElement("a");
                    if (window.document.title) {
                      filename = window.document.title.replace(/[^a-z0-9]/gi, '-').toLowerCase() + filename;
                    }
                    a.setAttribute("download", filename + ".zip");
                    var zip = new JSZip();
                    if (type == "SVG"){
                        for (var i = 0 ; i < sources.length ; i++){
                            //console.log("The source is " + sources[i].source)
                            zip.file("image" + i.toString() + ".svg", sources[i].source.toString());
                        }
                        content = zip.generate();
                        var url = "data:application/zip;base64," + content;//window.URL.createObjectURL(new Blob(source.source, { "type" : "text\/xml" }));
                    }
                    else if (type == "JPG"){
                        for (var i = 0 ; i < sources.length ; i++){
                            var img = new Image, data, ret={data: null, pending: true};
                            img.onError = function() {
                                            throw new Error('Cannot load image: "'+url+'"');
                            }
                            htmlX = sources[i].source;
                            var imgsrcX = 'data:image/svg+xml;base64,' + btoa(htmlX);
                            var imgX = '<img src="' + imgsrcX + '">';
                            img.src = imgsrcX;
                            var canvas = document.createElement('canvas');
                            document.body.appendChild(canvas);
                            canvas.width = sources[i].width;
                            canvas.height = sources[i].height;
                            var ctx = canvas.getContext('2d');
                            ctx.rect(0,0,canvas.width,canvas.height);
                            ctx.fillStyle="white";
                            ctx.fill();
                            ctx.drawImage(img, 0, 0);
                        //    var url = window.URL.createObjectURL(new Blob(canvas.toDataURL('image/jpeg').slice('data:image/jpeg;base64,'.length), {"type" : "image\/jpeg"}));
                            // Grab the image as a jpeg encoded in base64, but only the data
                        //    data = canvas.toDataURL('image/jpeg').slice('data:image/jpeg;base64,'.length);
                            //var url = canvas.toDataURL('image/jpeg');//.slice('data:image/jpeg;base64,'.length);
                            zip.file("image" + i.toString() + ".jpg", canvas.toDataURL('image/jpeg').slice('data:image/jpeg;base64,'.length).toString(), {base64:true});
                            //console.log("converted to jpeg")
                            // Convert the data to binary form
                        //    data = atob(data);
                            document.body.removeChild(canvas);
                        }
                        content = zip.generate();
                        var url = "data:application/zip;base64," + content;
                        var blob = zip.generate({type:"blob"});
                        saveAs(blob, "JPGimages.zip");
                    }
                    // SAVE FROM OBJECT URL
                    // body.appendChild(a);
                    // a.setAttribute("class", "svg-extractor");

                    // //a.setAttribute("download", filename + ".svg");
                    // a.setAttribute("href", url);
                    // a.style["display"] = "none";
                    // a.click();

                    // setTimeout(function() {
                    //   window.URL.revokeObjectURL(url);
                    // }, 10);

                    // END OF SAVE FROM OBJECT URL

                    // SAVE AS BLOB

                    // END OF SAVE AS BLOB


                }
                    // END OF DOWNLOAD ALL



                  function getStyles(doc) {
                    var styles = "",
                        styleSheets = doc.styleSheets;

                    if (styleSheets) {
                      for (var i = 0; i < styleSheets.length; i++) {
                        processStyleSheet(styleSheets[i]);
                      }
                    }

                    function processStyleSheet(ss) {
                      if (ss.cssRules) {
                        for (var i = 0; i < ss.cssRules.length; i++) {
                          var rule = ss.cssRules[i];
                          if (rule.type === 3) {
                            // Import Rule
                            processStyleSheet(rule.styleSheet);
                          } else {
                            // hack for illustrator crashing on descendent selectors
                            if (rule.selectorText) {
                              // Add the if condition for retaining the illustrator hack
                              //if (rule.selectorText.indexOf(">") === -1) {
                                styles += "\n" + rule.cssText;
                              //}
                            }
                          }
                        }
                      }
                    }
                    return styles;
                  }

                }
                //console.log("Getting vector strings");
                svgInfo = getVectorString(pids);
                //console.log("The vector string is " + svgInfo);
                if (svgInfo == null){
                    return;
                }
                for(var i = 0; i < photos.length; i++){
                    for(var j = 0; j < svgInfo.length; j++){
                        if (svgInfo[j].pid == photos[i].parentId){
                            photos[i]["svgInfo"] = svgInfo[j]
                        }
                    }
                }
                for(var i = 0; i < photos.length; i++){
                        //console.log("In photo  "+ i);
                        photo = photos[i];
                        var img = new Image, data, ret={data: null, pending: true};
                        img.onError = function() {
                                        throw new Error('Cannot load image: "'+url+'"');
                        }
                        counter = 0;
                        //console.log("parent id is " + photo.parentId);

                        // var htmlX = d3.select("#" + photo.parentId + " > svg")
                        //                           .attr("version", 1.1)
                        //                          .attr("xmlns", "http://www.w3.org/2000/svg")
                        //                           .node().parentNode.innerHTML;

                        htmlX = photo.svgInfo.source;
                        //console.log("The htmlX is " + htmlX);
                        var imgsrcX = 'data:image/svg+xml;base64,' + btoa(htmlX);
                        var imgX = '<img src="' + imgsrcX + '">';
                        // d3.select("#svgdata"+photo.parentId).html(img);
                        img.src = imgsrcX;
                        //imgDict[photo.parentId] = img;
                        photo['img'] = img;
                        //console.log("imgsrcX is " + img.src);
                        //console.log("Image width pre is " + img.width);
                        //console.log("Image height pre is " + img.height);
                        img.onload = function(parentId) {
                                        gloCount = gloCount - 1;
                                        if (gloCount != 0){
                                            return;
                                        }
                                        else{
                                            for(k = 0; k < photos.length; k++){
                                                function decorate(favicon, width1, width2){
                                                    favdata = favicon.slice('data:image/jpeg;base64,'.length);
                                                    favdim = 3;
                                                    favdata = atob(favdata);
                                                    doc.setLineWidth(width1);
                                                    doc.setDrawColor(255,165,0);
                                                    doc.line(0, 0, pageWidth -favdim, 0);
                                                    doc.line(0, 0, 0, pageHeight);
                                                    doc.line(pageWidth, favdim, pageWidth, pageHeight);
                                                    doc.line(0, pageHeight , pageWidth, pageHeight);
                                                    // doc.setLineWidth(width2);
                                                    // doc.setDrawColor(0,0,255);
                                                    // offset = width1/1.1;
                                                    // doc.line(offset, offset, pageWidth -favdim, offset);
                                                    // doc.line(offset, offset, offset, pageHeight-offset);
                                                    // doc.line(pageWidth - offset, favdim, pageWidth - offset, pageHeight - offset);
                                                    // doc.line(offset, pageHeight - offset , pageWidth - offset, pageHeight- offset);
                                                    // xx = pageWidth - favdim;
                                                    // console.log("xx is " + xx);
                                                    doc.addImage({imageData:favdata, format:'JPEG', x:xx ,y:0, w:favdim, h:favdim});
                                                }
                                                if (k == 0 && favicon != ""){
                                                    decorate(favicon, 1, 0.2);
                                                }
                                                var canvas = document.createElement('canvas');
                                                //console.log("canvas created")
                                                document.body.appendChild(canvas);

                                                // canvas.width = photos[k]['img'].width ;//+ photos[k].svgInfo.left;
                                                // canvas.height = photos[k]['img'].height;// + photos[k].svgInfo.top;
                                                if (vertical == "north" || vertical == "south"){
                                                    canvas.width = photos[k].svgInfo.width;
                                                    canvas.height = photos[k].svgInfo.height;
                                                }
                                                else if (vertical == "east" || vertical == "west"){
                                                    canvas.width = photos[k].svgInfo.height;
                                                    canvas.height = photos[k].svgInfo.width;
                                                }


                                                //console.log("Canvas width is " + canvas.width)
                                                //console.log("Canvas height is " + canvas.height)
                                                var ctx = canvas.getContext('2d');


                                                ctx.rect(0,0,canvas.width,canvas.height);
                                                ctx.fillStyle = "white";
                                                ctx.fill();
                                                if (vertical == "east" || vertical == "west" || vertical == "south"){
                                                    angle = {"east": Math.PI*0.5, "south": Math.PI*1, "west": Math.PI*1.5};
                                                    cw = canvas.width * 0.5;
                                                    ch = canvas.height * 0.5;
                                                    ctx.translate(cw, ch);
                                                    ctx.rotate(angle[vertical]);
                                                    if (vertical != "south"){
                                                        ctx.drawImage(photos[k]['img'], -canvas.height/2, -canvas.width/2);
                                                    }
                                                    else{
                                                        ctx.drawImage(photos[k]['img'], -canvas.width/2, -canvas.height/2);
                                                    }
                                                    //ctx.setTransform(1, 0, 0, 1, 0, 0);
                                                }
                                                else{
                                                    ctx.drawImage(photos[k]['img'], 0, 0);
                                                }

                                                // ctx.drawImage(photos[k]['img'], 0, 0);
                                                //console.log("Drawn image on ctx")
                                                // Grab the image as a jpeg encoded in base64, but only the data
                                                data = canvas.toDataURL('image/jpeg').slice('data:image/jpeg;base64,'.length);
                                                //console.log("converted to jpeg")
                                                // Convert the data to binary form
                                                data = atob(data);
                                                document.body.removeChild(canvas);
                                                counter = counter + 1;

                                                ret['data'] = data;
                                                ret['pending'] = false;
                                                //var doc = new jsPDF();

                                                // w = photos[k]['img'].width;// + photos[k].svgInfo.left;
                                                // h = photos[k]['img'].height;// + photos[k].svgInfo.top;
                                                if (vertical == "north" || vertical == "south"){
                                                    w = photos[k].svgInfo.width;
                                                    h = photos[k].svgInfo.height;
                                                }
                                                else{
                                                    w = photos[k].svgInfo.height;
                                                    h = photos[k].svgInfo.width;
                                                }

                                                // console.log("Image width is " + w);
                                                // console.log("Image height is " + h);

                                                counter = counter + 1;
                                                s = 1;
                                                if (oneOnAPage == false || oneOnAPage == true){
                                                    if ((w > (pageWidth - xpad*3)) || (h > (pageHeight - 3*ypad - fontsize))){
                                                        //console.log("Its greater than bounds");
                                                        sx = (pageWidth - xpad*3) / w;
                                                        sy = (pageHeight - 3*ypad - fontsize) / h;
                                                        s = Math.min(sx, sy);///2;
                                                        //console.log("Scaling factor is " + s);
                                                    }
                                                    if (oneOnAPage == true){
                                                        if (k > 0){
                                                            doc.addPage();
                                                            if (favicon != ""){
                                                                decorate(favicon, 1, 0.2);
                                                            }
                                                        }
                                                        y = (pageHeight/2) - (s*h/2) - 3*ypad;
                                                    }
                                                    if ((fontsize + 3*ypad + s*h + y) > pageHeight && oneOnAPage == false) {
                                                        doc.addPage();
                                                        if (favicon != ""){
                                                            decorate(favicon, 1, 0.2);
                                                        }
                                                        y = 0;
                                                    }
                                                    y = y + ypad;
                                                    if ((titleTop == true && vertical == "north")|| (titleTop == false && vertical=="south")){
                                                        if (titleTop == true){
                                                            console.log("Y is " + y);
                                                            doc.text(xpad, y + ypad, photos[k].text);
                                                            y = y + fontsize + ypad;
                                                        }
                                                        else{
                                                            doc.text(photos[k].text, pageWidth - xpad, y + ypad, 180);
                                                            y = y + fontsize + ypad;
                                                        }
                                                    }
                                                    if (vertical == "north" || vertical == "south"){
                                                        x = (pageWidth/2) - (s*w/2);
                                                    }
                                                    if (vertical == "east" || vertical == "west"){
                                                        if (vertical == "east"){
                                                            if (titleTop == true){
                                                                x = (pageWidth/2) - (s*w/2) - xpad;
                                                                doc.text(photos[k].text, pageWidth - xpad, y + ypad, 270)
                                                            }
                                                            else{
                                                                x = (pageWidth/2) - (s*w/2) + xpad;
                                                                doc.text(photos[k].text, xpad, y + ypad, 270);
                                                            }
                                                        }
                                                        if (vertical == "west"){
                                                            if (titleTop == false){
                                                                x = (pageWidth/2) - (s*w/2) - xpad;
                                                                doc.text(photos[k].text, pageWidth - xpad, y + (s*h), 90);
                                                            }
                                                            else{
                                                                x = (pageWidth/2) - (s*w/2) + xpad;
                                                                doc.text(photos[k].text, xpad, y + (s*h), 90);
                                                            }
                                                        }
                                                    }
                                                    // console.log("The scaling factor is " + s + " and the new width is " + w*s)
                                                    if (oneOnAPage == false){
                                                        doc.addImage({imageData:data, format:'JPEG', x:x, y:y, w:(w*s), h:(h*s)})
                                                        y = y + ypad + (s*h);
                                                    }
                                                    else{
                                                        y = (pageHeight/2) - (s*h/2);
                                                        doc.addImage({imageData:data, format:'JPEG', x:x, y:y, w:(w*s), h:(h*s)});
                                                        y = (pageHeight/2) + (s*h/2) + ypad;
                                                    }
                                                    //imageData, format, x, y, w, h, alias, compression, rotation
                                                    if ( (titleTop == false && vertical == "north") || (titleTop == true && vertical == "south") || vertical == "west"){
                                                        if (vertical == "north"){
                                                            doc.text(xpad, y + ypad, photos[k].text);
                                                            y = y + fontsize + ypad;
                                                        }
                                                        else if (vertical == "south"){
                                                            doc.text(photos[k].text, pageWidth - xpad, y + ypad, 180);
                                                            y = y + fontsize + ypad;
                                                        }
                                                    }
                                                }
                                                else{
                                                    //console.log("Inside oneonaPage");
                                                    if ((w > (pageWidth - xpad*3)) || (h > (pageHeight - 3*ypad - fontsize))){
                                                        //console.log("Its greater than bounds");
                                                        if(k > 0){
                                                            doc.addPage();
                                                            if (favicon != ""){
                                                                decorate(favicon, 1, 0.2);
                                                            }
                                                            y = 0;
                                                        }
                                                        sx = (pageWidth - xpad*3) / w;
                                                        sy = (pageHeight - 3*ypad - fontsize) / h;
                                                        s = Math.min(sx, sy);///2;
                                                        x = (pageWidth/2) - (s*w/2);
                                                        y = (pageHeight/2) - (s*h/2);
                                                        doc.text(xpad, y - ypad, photos[k].text);
                                                        doc.addImage({imageData:data, format:'JPEG', x:x, y:y, w:(w*s), h:(h*s)});
                                                    }
                                                }

                                                }
                                    }
                                        //document.location.href(document.location + "/PDF/#" + "");
                                        //doc.output('save', 'filename.pdf'); //Try to save PDF as a file (not works on ie before 10, and some mobile devices)
                                        //doc.output('datauristring');        //returns the data uri string
                                        //doc.output('datauri');              //opens the data uri in current window

                                        doc.output('dataurlnewwindow');     //opens the data uri in new window

                                        processing = false;
                                        return ret;
                                    }
                    }
                }

                //doc.output('datauri');
                //return ret;
                /*
                doc.addImage({
                        imageData : imgData,
                        angle     : -20,
                        x         : 10,
                        y         : 78,
                        w         : 45,
                        h         : 58
                })

                pdf.text("rotated and centered around", 140, 300, 45, 'center')

                */
