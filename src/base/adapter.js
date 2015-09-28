var registerFactory = require("./resourcemanager.js").registerFactory;
var Resource = require("./resourcemanager.js").Resource;
var Events = require("../interface/notification.js");
var config = require("../interface/elements.js").config;

/**
 * A normal adapter that doesn't need to be connected to a DOM node
 * @constructor
 * @param {XML3D.base.AdapterFactory} factory - the factory this adapter was created from
 */
var Adapter = function(factory) {
    this.factory = factory;
};

/**
 * Connect an adapterHandle to a certain key.
 * This will enable the ConnectedAdapterNotifcations for notifyChanged.
 * @param {string} key - the key that will also be provided in connectAdapterChanged callback
 * @param {XML3D.base.AdapterHandle} adapterHandle handle of adapter to be added
 */
Adapter.prototype.connectAdapterHandle = function(key, adapterHandle) {
    if (!this.connectedAdapterHandles) {
        this.connectedAdapterHandles = {};
        this._bindedAdapterHandleCallback = adapterHandleCallback.bind(this);
    }

    this.disconnectAdapterHandle(key);

    if (adapterHandle) {
        this.connectedAdapterHandles[key] = adapterHandle;
        this.connectedAdapterHandles[key].addListener(this._bindedAdapterHandleCallback);
    }
    else
        delete this.connectedAdapterHandles[key];

};

/**
 * Disconnects the adapter handle from the given key.
 * @param {string} key - the key that was provided when this adapter handle was connected
 */
Adapter.prototype.disconnectAdapterHandle = function(key) {
    if (this.connectedAdapterHandles && this.connectedAdapterHandles[key]) {
        this.connectedAdapterHandles[key].removeListener(this._bindedAdapterHandleCallback);
        delete this.connectedAdapterHandles[key];
    }
};

/**
 * Disconnects all adapter handles.
 */
Adapter.prototype.clearAdapterHandles = function() {
    for (var i in this.connectedAdapterHandles) {
        this.connectedAdapterHandles[i].removeListener(this._bindedAdapterHandleCallback);
    }

    this.connectedAdapterHandles = null;
};

/**
 * Get the connected AdapterHandle of a certain key.
 * This will only return AdapterHandles previously added via connectAdapterHandle
 * @param {string} key
 * @return {?AdapterHandle} the adapter of that key, or null if not available
 */
Adapter.prototype.getConnectedAdapterHandle = function(key) {
    return this.connectedAdapterHandles && this.connectedAdapterHandles[key];
};

/**
 * Get the connected adapter of a certain key.
 * This will only return adapters of AdapterHandles previously added via connectAdapter
 * @param {string} key
 * @return {?XML3D.base.Adapter} the adapter of that key, or null if not available
 */
Adapter.prototype.getConnectedAdapter = function(key) {
    var handle = this.getConnectedAdapterHandle(key);
    return handle && handle.getAdapter();
};

/**
 * This function is called, when the adapater is detached from the node.
 * At this point, the adapater should disconnect from any other adapter and prepare to be properly garbage collected
 */
Adapter.prototype.onDispose = function() {
};


/**
 * Internal function that converts an AdapterHandleNotification to a ConnectedAdapterNotification
 * @private
 * @param {Events.AdapterHandleNotification} evt
 */
function adapterHandleCallback(evt) {
    for (var key in this.connectedAdapterHandles) {
        if (this.connectedAdapterHandles[key] == evt.adapterHandle) {
            var subEvent = new Events.ConnectedAdapterNotification(evt, key);
            this.notifyChanged(subEvent);
        }
    }
}


/**
 * An Adapter connected to a DOMNode (possibly of an external document)
 * @constructor
 * @param {AdapterFactory} factory the AdapterFactory this adapter was created from
 * @param {Object} node - DOM node of this Adapter
 */
var NodeAdapter = function(factory, node) {
    Adapter.call(this, factory);
    this.node = node;
};
XML3D.createClass(NodeAdapter, Adapter);

/**
 * called by the factory after adding the adapter to the node
 */
NodeAdapter.prototype.init = function() {
};

/**
 * Notifiction due to a change in DOM, related adapters and so on.
 * @param {Events.Notification} e
 */
NodeAdapter.prototype.notifyChanged = function(e) {

};

/**
 * @param {string|XML3D.URI} uri Uri to referred adapterHandle
 * @param {Object=} aspectType Optional: the type of adapter (use same adapter type by default)
 * @param {number=} canvasId Optional: the canvas id of the adapter (use canvas id of this adapter by default)
 * @returns an AdapterHandle to the referred Adapter of the same aspect and canvasId
 */
NodeAdapter.prototype.getAdapterHandle = function(uri, aspectType, canvasId) {
    canvasId = canvasId === undefined ? this.factory.canvasId : canvasId;
    return Resource.getAdapterHandle(this.node.ownerDocument._documentURL || this.node.ownerDocument.URL,
        uri, aspectType || this.factory.aspect, canvasId, this.node.nodeName);
};
/**
 * notifies all adapter that refer to this adapter through AdapterHandles.
 * @param {number?} type The type of change
 */
NodeAdapter.prototype.notifyOppositeAdapters = function(type) {
    type = type || Events.ADAPTER_HANDLE_CHANGED;
    return Resource.notifyNodeAdapterChange(this.node,
        this.factory.aspect, this.factory.canvasId, type);
};

/**
 * Depth-first traversal over element hierarchy
 * @param {function(NodeAdapter)} callback
 */
NodeAdapter.prototype.traverse = function(callback) {
    callback(this);
	var children = this.children(this.node);
    for (var i = 0; i < children.length; i++) {
		var child = children[i];
        var adapter = this.factory.getAdapter(child);
        adapter && adapter.traverse(callback);
    }
};

/**
 * The (relevant) children to a DOMNode
 * @param {Object} node - DOM node of this Adapter
 */
NodeAdapter.prototype.children = function (node) {
	if (node.shadowRoot)
		node = node.shadowRoot;
	var children = [];
	var child = node.firstElementChild;
	while (child) {
		if (child instanceof HTMLContentElement) {
            var nodes = child.getDistributedNodes();
            for (var i = 0; i < nodes.length; i++)
                children.push(nodes[i]);
		} else {
			children.push(child);
		}
		child = child.nextElementSibling;
	}
	return children;
};


/**
 * @interface
 */
var IFactory = function() {
};

/** @type {string} */
IFactory.prototype.aspect;


/**
 * An adapter factory is responsible for creating adapter from a certain data source.
 * Note that any AdapterFactory is registered with Resource
 * @constructor
 * @implements {IFactory}
 * @param {Object} aspect The aspect this factory serves (e.g. XML3D.data or XML3D.webgl)
 * @param {string|Array.<string>} mimetypes The mimetype this factory is compatible to
 * @param {number} canvasId The id of the corresponding canvas handler. 0, if not dependent on any GLCanvasHandler
 */
var AdapterFactory = function(aspect, mimetypes, canvasId) {
    this.aspect = aspect;
    this.canvasId = canvasId || 0;
    this.mimetypes = typeof mimetypes == "string" ? [ mimetypes] : mimetypes;

    registerFactory(this);
};

 /** Implemented by subclass
 * Create adapter from an object (node in case of an xml, and object in case of json)
 * @param {object} obj
 * @returns {?Adapter} created adapter or null if no adapter can be created
 */
AdapterFactory.prototype.createAdapter = function(obj) {
    return null;
};

/**
 * Checks if the adapter factory supports specified mimetype. Can be overridden by subclass.
 * @param {String} mimetype
 * @return {Boolean} true if the adapter factory supports specified mimetype
 */
AdapterFactory.prototype.supportsMimetype = function(mimetype) {
    return this.mimetypes.indexOf(mimetype) != -1;
};

/**
 * A NodeAdaperFactory is a AdapterFactory, that works specifically for DOM nodes / elements.
 * @constructor
 * @param {Object} aspect The aspect this factory serves (e.g. XML3D.data or XML3D.webgl)
 * @param {number} canvasId The id of the corresponding canvas handler. 0, if not dependent on any GLCanvasHandler
 */
var NodeAdapterFactory = function(aspect, canvasId) {
    AdapterFactory.call(this, aspect, ["text/xml", "application/xml"], canvasId);
};
XML3D.createClass(NodeAdapterFactory, AdapterFactory);

/**
 * This function first checks, if an adapter has been already created for the corresponding node
 * If yes, this adapter is returned, otherwise, a new adapter is created and returned.
 * @param {Object} node
 * @returns {Adapter} The adapter of the node
 */
NodeAdapterFactory.prototype.getAdapter = function(node) {
    if(node && node._configured === undefined)
        config.element(node);
    if (!node || node._configured === undefined)
        return null;

    var elemHandler = node._configured;
    var key = this.aspect + "_" + this.canvasId;
    var adapter = elemHandler.adapters[key];
    if (adapter !== undefined)
        return adapter;

    // No adapter found, try to create one
    adapter = this.createAdapter(node);
    if (adapter) {
        elemHandler.adapters[key] = adapter;
        adapter.init();
    }
    return adapter;
};

XML3D.resource.AdapterFactory = AdapterFactory;

module.exports = {
NodeAdapter : NodeAdapter,
AdapterFactory : AdapterFactory,
NodeAdapterFactory : NodeAdapterFactory
};
