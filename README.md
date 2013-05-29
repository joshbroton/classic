classic.js
==========

Lightweight, fast media query polyfill
-------------------------------------

I wanted to find an alternative way to polyfill media query support in older versions of IE. This creates a new stylesheet by pre-pending an extra class onto each CSS selector inside of a media query and using the window resize event to add/remove those classes from &lt;html&gt;.

This is pre-pre-pre-alpha. This definitely isn't ready for production environments yet, but I am excited about the potential. It seems slightly slower to load but faster to switch breakpoints than respond.js (in my very limited testing).

I would appreciate you testing it with your css and reporting any issues.

Working:
--------
* Core functionality
* Works with media queries with either min-width or max-width values, but not both (yet)
* IE8 -- I have not tested in 7 or 6, but plan to eventually

Not Working:
------------
* (min-width:) and (max-width:) in the same media query
* em to px conversion. Right now, it multiplies em by 16 to get pixel value
* selectivizr exposes css files so the js can get at them without another http request. I haven't added that functionality yet.
* The entire script is in an exposed namespace. Will be fixing.
* 3rd party font providers, such as typekit, return a domain access error because of the cross-domain ajax request. Don't use them.

To use:
-------
1. Reference in your &lt;head&gt; after all the stylesheets. *This should work if you put it at the end of the &lt;body&gt;, but like all polyfills that you reference after the content, you'll see a more pronounced flash of un-styled content.
2. Enjoy!
