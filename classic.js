//classic.js v0.01a -- uses classes to apply css from media queries in older browsers
var resizeTimeout;

if (window.attachEvent) {
    window.attachEvent('onresize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout('doResizeCode()', 100);
    });
} else if (window.addEventListener) {
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout('doResizeCode()', 100);
    });
}

function doResizeCode() {
    var windowWidth = 0;
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
    console.log(windowWidth);


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
            classic.docElem = classic.doc.documentElement;
            classic.head = classic.doc.getElementsByTagName('head')[0] || classic.docElem;
            classic.cssLinks = classic.head.getElementsByTagName('link');
            classic.html = classic.doc.getElementsByTagName('html')[0];
            classic.htmlClasses = classic.html.className.split(' ');
            classic.htmlClassRegex = '( \\.';

            for(var i = 0; i < classic.htmlClasses.length; i++) {
                classic.htmlClassRegex += classic.htmlClasses[i] + '| \\.';
            }

            classic.htmlClassRegex = classic.htmlClassRegex.substring(0, classic.htmlClassRegex.length - 4) + ')';

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
                    foundBlocks.push(styles.match(  /@media[^\{]+\{([^\{\}]*\{[^\}\{]*\})+/gi ));
                    for(var i = 0; i < foundBlocks[0].length; i++) {
                        classic.styleblocks.push(foundBlocks[0][i]);
                    }
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

            //classic.mq.queries.push(styles.match(/min-width\:\s*.+\)$/ig));
            //console.log(styles.match(/(?:min-width\:|max-width\:).+\)/ig));
            var thisBlock = '';
            var iQuery, iMin, iMax, iCss, iClass;
            for(var i = 0; i < classic.styleblocks.length; i++) {
                thisBlock = classic.styleblocks[i];
                //console.log(thisBlock);
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
            /*console.log(classic.mq.styleblocks);
            console.log(classic.mq.queries);*/

            for(var i = 0; i < classic.mediaqueries.length; i++) {
                classic.createNewCss(classic.mediaqueries[i]);
            }

            //write to head
            document.getElementsByTagName('head')[0].innerHTML += ('<style type="text/css">' + classic.newCss + '</style>')
        },

        gen: {
            query: function(block) {
                var str = block.match(/(?:min-width\:|max-width\:).+\)/ig)[0];
                str = str.substring(0, str.length - 1);

                return str;
            },

            min: function(block) {
                //TODO: Include em support
                if (block.indexOf('min') > -1) {
                    block = block.replace(/min-width\:\s*/ig, '').replace(/px/ig, '');
                } else {
                    block = null;
                }

                return block;
            },

            max: function(block) {
                //TODO: Include em support
                if (block.indexOf('max') > -1) {
                    block = block.replace(/max-width\:\s*/ig, '').replace(/px/ig, '');
                } else {
                    block = null;
                }

                return block;
            },

            css: function(block) {
                var pos = block.indexOf('{');
                block = block.substring(pos + 1, block.length);
                block = block.replace(/(\r\n|\n|\r)/gm,'').replace(/\s{2,}/g, ' ');

                if (block.indexOf(' ') === 0) {
                    block = block.substring(1);
                }

                return block;
            },

            newClass: function(min, max) {
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

            // replace all } with '} .newCSSClass' unless in
            var replacing = newCSS.substring(0, last).replace(/}/g, '} ' + dotclass);

            newCSS = replacing + newCSS.substring(last);
            newCSS = newCSS.replace(classic.htmlClassRegex, removeLeadingSpace);

            classic.newCss += newCSS + ' ';

            function removeLeadingSpace(matching) {
                return matching.substring(1);
            }

        },

        addClassToHtml: function(newclass) {
            console.log ('new class = ' + newclass);
            if (classic.html.className.indexOf(newclass) < 0) {
                classic.html.className += ' ' + newclass;
            }
        },

        removeClassFromHtml: function(oldclass) {
            console.log ('remove class = ' + oldclass);
            if (classic.html.className.indexOf(oldclass) >= 0) {
                classic.html.className = classic.html.className.replace(new RegExp('(\\s|^)' + oldclass + '(\\s|$)','g'), '');
            }
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

    classic.fire();

/*})();*/

//TODO: parsedSheets{} = ??? To store parsed sheets / should be able to reference by 'href' and find if parsed (see respond.js)