//classic.js v0.01a -- uses classes to apply css from media queries in older browsers
//By Josh Broton -- @joshbroton




//Use timeout to improve performance of resize in IE
var resizeTimeout;

if (window.attachEvent) {
    window.attachEvent('onresize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout('onResize()', 100);
    });
} else if (window.addEventListener) {
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout('onResize()', 100);
    });
}

function onResize() {
    var windowWidth = 0;

    //since IE uses a different method of measuring the doc width, test and use the appropriate one here
    if (document.body && document.body.offsetWidth) {
        windowWidth = document.body.offsetWidth;
    }
    if (document.compatMode=='CSS1Compat' &&
        document.documentElement &&
        document.documentElement.offsetWidth ) {
        windowWidth = document.documentElement.offsetWidth;
    }
    if (window.innerWidth && window.innerHeight) {
        windowWidth = window.innerWidth;
    }
    classic.breakpointLogic(windowWidth);
}

/*(function() {
    'use strict';*/

    //expose namespace
    var classic = {
        // variables
        doc: window.document,
        docElem: null,
        mediaqueries: [],
        head: null,
        html: null,
        cssLinks: [],
        cssHrefs: [],
        styleblocks: [],
        htmlClasses: [],
        htmlClassRegex: '',
        newCss: '',
        newJs: '<script>',

        //functions
        initVars: function () {
            //Assign values to variables in classic
            classic.docElem = classic.doc.documentElement;
            classic.head = classic.doc.getElementsByTagName('head')[0] || classic.docElem;
            classic.cssLinks = classic.head.getElementsByTagName('link');
            classic.html = classic.doc.getElementsByTagName('html')[0];
            classic.htmlClasses = classic.html.className.split(' ');
            classic.htmlClassRegex = '( \\.';

            //build the regex that will be used later to remove a space between
            //the new classes and the classes on the <head> from Modernizr
            for(var i = 0; i < classic.htmlClasses.length; i++) {
                if (classic.htmlClasses[i] !== '') {
                    classic.htmlClassRegex += classic.htmlClasses[i] + '| \\.';
                }
            }

            //remove the last set of 'or' characters from the regex
            classic.htmlClassRegex = classic.htmlClassRegex.substring(0, classic.htmlClassRegex.length - 4) + ')';

            //create regex object
            classic.htmlClassRegex = new RegExp(classic.htmlClassRegex, 'gi');

            //get hrefs from stylesheet links
            for(var i = 0; i < classic.cssLinks.length; i++ ) {
                var stylesheet = classic.cssLinks[i];

                //if stylesheet, put in cssHrefs[]
                var href = stylesheet.href;
                if (!!href && stylesheet.rel && stylesheet.rel.toLowerCase() === 'stylesheet') {
                    classic.cssHrefs.push(href);
                }
            }

            //start getCSS at position 0
            classic.getCSS(0);
        },

        getCSS: function(pos) {
            var thisHref = '';
            var foundBlocks = [];
            var hrefLength = classic.cssHrefs.length;

            //request stylesheets via ajax
            if (pos < hrefLength) {
                thisHref = classic.cssHrefs[pos];

                classic.ajax(thisHref, function(styles) {

                    //save media queries to foundBlocks
                    foundBlocks.push(styles.match(  /@media[^\{]+\{([^\{\}]*\{[^\}\{]*\})+/gi ));
                    for(var i = 0; i < foundBlocks[0].length; i++) {
                        classic.styleblocks.push(foundBlocks[0][i]);
                    }

                    //recursive call
                    classic.getCSS(pos + 1);

                    if(hrefLength === pos + 1) {
                        classic.parseStyles();
                    }
                });

            } else {
                return;
            }
        },

        parseStyles: function() {
            //Parse each block of CSS and create the objects we'll use to create the new rules
            var thisBlock = '';
            var iQuery, iMin, iMax, iCss, iClass;
            for(var i = 0; i < classic.styleblocks.length; i++) {
                thisBlock = classic.styleblocks[i];

                iMin = -1;
                iMax = -1;
                iQuery = classic.gen.query(thisBlock);
                iMin = classic.gen.min(iQuery);
                iMax = classic.gen.max(iQuery);
                iCss = classic.gen.css(thisBlock);
                iClass = classic.gen.newClass(iMin, iMax);

                classic.mediaqueries[i] = {
                    query: iQuery,
                    min: iMin,
                    max: iMax,
                    css: iCss,
                    newclass: iClass
                };
            }

            //Create all the new CSS
            for(var i = 0; i < classic.mediaqueries.length; i++) {
                classic.createNewCss(classic.mediaqueries[i]);
            }

            //write to head
            var styleNode = document.createElement('style');
            styleNode.setAttribute('type', 'text/css');
            if(styleNode.styleSheet) {
                //IE specific method
                styleNode.styleSheet.cssText = classic.newCss;
            } else {
                //Modern browsers (not that you'll use it for those, but in case it's accidentally referenced
                styleNode.appendChild(document.createTextNode(classic.newCss));
            }

            //write new css to the <head>
            classic.head.appendChild(styleNode);

            //Run one time
            onResize();
        },

        gen: {
            //functions used to generate different elements of a mediaquery object
            query: function(block) {
                //pull the media query out of the css block
                var str = block.match(/(?:min-width\:|max-width\:).+\)/ig)[0];
                str = str.substring(0, str.length - 1);

                return str;
            },

            min: function(block) {
                //TODO: Include em support
                //find value of min
                if (block.indexOf('min') > -1) {
                    if (block.indexOf('em') > -1) {
                        block = block.replace(/min-width\:\s*/ig, '').replace(/em/ig, '');
                        block = classic.calculateEms(block);
                    } else {
                        block = block.replace(/min-width\:\s*/ig, '').replace(/px/ig, '') * 1;
                    }
                } else {
                    block = null;
                }

                return block;
            },

            max: function(block) {
                //TODO: Include em support
                //find value of max
                if (block.indexOf('max') > -1) {
                    if (block.indexOf('em') > -1) {
                        block = block.replace(/max-width\:\s*/ig, '').replace(/em/ig, '');
                        block = classic.calculateEms(block);
                    } else {
                        block = block.replace(/max-width\:\s*/ig, '').replace(/px/ig, '') * 1;
                    }
                } else {
                    block = null;
                }

                return block;
            },

            css: function(block) {
                //Remove media query and closing bracket from the CSS block.
                //Remove linebreaks
                var pos = block.indexOf('{');
                block = block.substring(pos + 1, block.length);
                block = block.replace(/(\r\n|\n|\r)/gm,'').replace(/\s{2,}/g, ' ');

                //remove space if first char
                if (block.indexOf(' ') === 0) {
                    block = block.substring(1);
                }

                return block;
            },

            newClass: function(min, max) {
                //Create the classname that will be used for this mediaquery
                var classname;
                if (min != null) {
                    classname = 'minwidth' + min;
                } else if (max != null) {
                    classname = 'maxwidth' + max;
                }

                return classname;
            }
        },

        breakpointLogic: function(ww) {
            var thisMq;
            for(var i = 0; i < classic.mediaqueries.length; i++) {
                thisMq = classic.mediaqueries[i];
                if (thisMq.min != null) {
                    if (ww >= thisMq.min) {
                        classic.addClassToHtml(thisMq.newclass);
                    } else {
                        classic.removeClassFromHtml(thisMq.newclass);
                    }
                } else if (thisMq.max != null) {
                    if (ww <= thisMq.max) {
                        classic.addClassToHtml(thisMq.newclass);
                    } else {
                        classic.removeClassFromHtml(thisMq.newclass);
                    }
                }
            }
        },

        createNewCss: function(mq) {

            var dotclass = '.' + mq.newclass;
            var newCSS = dotclass + ' ' + mq.css;
            var last = newCSS.lastIndexOf('}');

            // replace all } with '} .newCSSClass' unless last
            var replacing = newCSS.substring(0, last).replace(/}/g, '} ' + dotclass + ' ');

            newCSS = replacing + newCSS.substring(last);

            //replace multiple selectors with new classes
            var tempArray = newCSS.split('}');
            newCSS = '';
            for (var i = 0; i < tempArray.length - 1; i++) {
                newCSS += tempArray[i].replace(/,(?=.*{)/g, (',' + ' ' + dotclass + ' ')) + '} ';
            }

            newCSS = newCSS.replace(classic.htmlClassRegex, removeLeadingSpace);

            classic.newCss += newCSS + ' ';

            function removeLeadingSpace(matching) {
                return matching.substring(1);
            }
        },

        addClassToHtml: function(newclass) {
            if (classic.html.className.indexOf(newclass) < 0) {
                classic.html.className += ' ' + newclass;
            }
        },

        removeClassFromHtml: function(oldclass) {
            if (classic.html.className.indexOf(oldclass) >= 0) {
                classic.html.className = classic.html.className.replace(new RegExp('(\\s|^)' + oldclass + '(\\s|$)','g'), '');
            }
        },

        calculateEms: function(ems) {
            return ems * 16;
        },

        fire: function() {
            classic.initVars();
        },

        //brilliantly simple ajax functions stolen from respond.js
        ajax: function( url, callback ) {
            var req = classic.xmlHttp();
            if (!req){
                return;
            }
            req.open( "GET", url, true );
            req.onreadystatechange = function () {
                if ( req.readyState !== 4 || req.status !== 200 && req.status !== 304 ){
                    return;
                }
                callback( req.responseText );
            };
            if ( req.readyState === 4 ){
                return;
            }
            req.send( null );
        },

        //define ajax obj
        xmlHttp: (function() {
            var xmlhttpmethod = false;
            try {
                xmlhttpmethod = new window.XMLHttpRequest();
            }
            catch( e ){
                xmlhttpmethod = new window.ActiveXObject( "Microsoft.XMLHTTP" );
            }
            return function(){
                return xmlhttpmethod;
            };
        })()
    };

    //Run classic.js and call the resize once.
    classic.fire();
/*})();*/

//TODO: parsedSheets{} = ??? To store parsed sheets / should be able to reference by 'href' and find if parsed (see respond.js)