var GroupRenderAdapter = require("./group.js");
var Events = require("../../../interface/notification.js");
var mat4 = require("gl-matrix").mat4;

var ComponentRenderAdapter = function (factory, node) {
    GroupRenderAdapter.call(this, factory, node, true, true);
    this.createRenderNode();
};

XML3D.createClass(ComponentRenderAdapter, GroupRenderAdapter, {

    /**
     * @param {Element} element
     */
    initChildElements: function (element) {
        var children = this.children(element);
		for (var i = 0; i < children.length; i++) {
			var child = children[i];
            this.initElement(child);
            // child = child.nextElementSibling;
        }
    }
	
});

module.exports = ComponentRenderAdapter;
