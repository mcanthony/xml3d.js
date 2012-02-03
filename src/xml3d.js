/*************************************************************************/
/*                                                                       */
/*  xml3d.js                                                             */
/*  Declarative 3D in HTML                                               */
/*                                                                       */
/*  Copyright (C) 2010                                                   */
/*  DFKI - German Research Center for Artificial Intelligence            */
/*                                                                       */
/*  This file is part of xml3d.js                                        */
/*                                                                       */
/*  xml3d.js is free software; you can redistribute it and/or modify     */
/*  under the terms of the GNU General Public License as                 */
/*  published by the Free Software Foundation; either version 2 of       */
/*  the License, or (at your option) any later version.                  */
/*                                                                       */
/*  xml3d.js is distributed in the hope that it will be useful, but      */
/*  WITHOUT ANY WARRANTY; without even the implied warranty of           */
/*  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.                 */
/*  See the GNU General Public License                                   */
/*  (http://www.fsf.org/licensing/licenses/gpl.html) for more details.   */
/*                                                                       */
/*************************************************************************/

/** @namespace **/

/**  @namespace **/
var xml3d = xml3d || {};

xml3d.xml3dNS = 'http://www.xml3d.org/2009/xml3d';
xml3d.xhtmlNS = 'http://www.w3.org/1999/xhtml';
xml3d.webglNS = 'http://www.xml3d.org/2009/xml3d/webgl';
xml3d._xml3d = document.createElementNS(xml3d.xml3dNS, "xml3d");
xml3d._native = !!xml3d._xml3d.style; 
xml3d._rendererFound = false;

xml3d.extend = function (a, b) {
    for ( var prop in b ) {
        if ( b[prop] === undefined ) {
            delete a[prop];
        } else if ( prop !== "constructor" || a !== window ) {
            a[prop] = b[prop];
        }
    }
    return a;
};

xml3d.createClass = function(ctor, parent, methods) {
    methods = methods || {};
    if (parent) {
        var F = function() {};
        F.prototype = parent.prototype;
        ctor.prototype = new F();
        ctor.prototype.constructor = ctor;
        //ctor.superClass = parent;
    }
    for (var m in methods) {
        ctor.prototype[m] = methods[m];
    }
    return ctor;
};
(function() {
	var onload = function() {
		
		
		
		// Find all the XML3D tags in the document
		var xml3ds = document.getElementsByTagNameNS(xml3d.xml3dNS, 'xml3d');
		xml3ds = Array.map(xml3ds, function(n) { return n; });
		
		xml3d.debug.activate();
		
		if(xml3d.debug)
			xml3d.debug.logInfo("Found " + xml3ds.length + " xml3d nodes...");
		
		if (xml3ds.length) {
			xml3d._xml3d = xml3ds[0];
			if (xml3d._native) {
				if(xml3d.debug)
					xml3d.debug.logInfo("Using native implementation.");
				xml3d._rendererFound = true;
				return;
			}
		}
		
		if (!xml3d.webgl) {
			if(xml3d.debug)
				xml3d.debug.logInfo("No WebGL renderer included.");
			return;
		}
		
		if (!xml3d.webgl.supported()) 
		{
			if(xml3d.debug)
			{
				xml3d.debug.logWarning("Could not initialise WebGL, sorry :-(");
			}
			
			for(var i = 0; i < xml3ds.length; i++) 
			{
				// Place xml3dElement inside an invisble div
				var hideDiv      = document.createElementNS(xml3d.xhtmlNS, 'div');
				var xml3dElement = xml3ds[i];
				
				xml3dElement.parentNode.insertBefore(hideDiv, xml3dElement);
				hideDiv.appendChild(xml3dElement);
				hideDiv.style.display = "none";
	
				var infoDiv = document.createElementNS(xml3d.xhtmlNS, 'div');
				infoDiv.setAttribute("class", xml3dElement.getAttribute("class"));
				infoDiv.setAttribute("style", xml3dElement.getAttribute("style"));
				infoDiv.style.border = "2px solid red";
				infoDiv.style.color  = "red";
				infoDiv.style.padding = "10px";
				infoDiv.style.backgroundColor = "rgba(255, 0, 0, 0.3)";
				
				
				var width = xml3dElement.getAttribute("width");
				if( width !== null) 
				{
					infoDiv.style.width = width;
				} 
				
				var height = xml3dElement.getAttribute("height");
				if( height !== null) 
				{
					infoDiv.style.height = height;
				} 
	
				var hElement = document.createElement("h3");
				var hTxt     = document.createTextNode("Your browser doesn't appear to support XML3D.");
				hElement.appendChild (hTxt);
				
				var pElement = document.createElement("p");
				pElement.appendChild(document.createTextNode("Please visit "));
				var link = document.createElement("a");
				link.setAttribute("href", "http://www.xml3d.org");
				link.appendChild(document.createTextNode("http://www.xml3d.org"));
				pElement.appendChild(link);
				pElement.appendChild(document.createTextNode(" to get information about browsers supporting XML3D."));
				infoDiv.appendChild (hElement);
				infoDiv.appendChild (pElement);
				
				hideDiv.parentNode.insertBefore(infoDiv, hideDiv);
			}
			
			return;
		}
		
        xml3d.configure(xml3ds);
        try {
            xml3d.webgl.configure(xml3ds);
        } catch (e) {
            xml3d.debug.logError(e);
        }
		
		var ready = (function(eventType) {
			var evt = null;
			if (document.createEvent) {
				evt = document.createEvent("Events");
				evt.initEvent(eventType, true, true);
				document.dispatchEvent(evt);
			} else if (document.createEventObject) {
				evt = document.createEventObject();
				document.fireEvent('on' + eventType, evt);
			}
		})('load');
	};
	var onunload = function() {
		if (xml3d.document)
			xml3d.document.onunload();
	};
	window.addEventListener('load', onload, false);
	window.addEventListener('unload', onunload, false);
	window.addEventListener('reload', onunload, false);

})();

//Some helper function. We don't have global constructors for 
//all implementations
createXML3DVec3 = function() {
	if (xml3d._xml3d === undefined) {
		return new XML3DVec3(); 
	}
	return xml3d._xml3d.createXML3DVec3();
};

createXML3DRotation = function() {
	if (xml3d._xml3d === undefined) {
		return new XML3DRotation(); 
	}
	return xml3d._xml3d.createXML3DRotation();
};

xml3d.copyRotation = function(to, from) {
    to.setAxisAngle(from.axis, from.angle);
}

xml3d.copyVector = function(to, from) {
    to.x = from.x;
    to.y = from.y;
    to.z = from.z;
}
