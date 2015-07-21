var TransformableAdapter = require("./transformable.js");
var DOMTransformFetcher = require("../../../data/transform-fetcher.js");
var Events = require("../../../interface/notification.js");

var ViewRenderAdapter = function (factory, node) {
    TransformableAdapter.call(this, factory, node, false, false);
    this.perspectiveFetcher = new DOMTransformFetcher(this, "perspective", "perspective", true);
    this.createRenderNode();
};
XML3D.createClass(ViewRenderAdapter, TransformableAdapter);
var p = ViewRenderAdapter.prototype;

p.createRenderNode = function () {
    var parent = this.getParentRenderAdapter();
    var parentNode = parent.getRenderNode ? parent.getRenderNode() : this.factory.renderer.scene.createRootNode();

    this.renderNode = this.factory.renderer.scene.createRenderView({
        position: this.node.position._data,
        orientation: this.node.orientation.toMatrix()._data,
        fieldOfView: this.node.fieldOfView,
        parent: parentNode
    });
    this.perspectiveFetcher.update();
};

/* Interface method */
p.getViewMatrix = function () {
    var m = new window.XML3DMatrix();
    this.renderNode.getWorldToViewMatrix(m._data);
    return m;
};

/**
 * returns view2world matrix
 * @return {window.XML3DMatrix}
 */
p.getWorldMatrix = function () {
    var m = new window.XML3DMatrix();
    this.renderNode.getViewToWorldMatrix(m._data);
    return m;
};

p.notifyChanged = function (evt) {
    switch (evt.type) {
        case Events.THIS_REMOVED:
            this.dispose();
            break;
        case Events.VALUE_MODIFIED:
            var target = evt.mutation.attributeName;

            switch (target) {
                case "orientation":
                    this.renderNode.updateOrientation(this.node.orientation.toMatrix()._data);
                    break;
                case "position":
                    this.renderNode.updatePosition(this.node.position._data);
                    break;
                case "perspective":
                    this.perspectiveFetcher.update();
                    break;
                case "fieldofview":
                    this.renderNode.updateFieldOfView(this.node.fieldOfView);
                    break;
                default:
                    XML3D.debug.logWarning("Unhandled value changed event in view adapter for attribute:" + target);
            }
            break;
    }
    this.factory.getRenderer().requestRedraw("View changed");
};

p.onTransformChange = function (attrName, matrix) {
    TransformableAdapter.prototype.onTransformChange.call(this, attrName, matrix);
    if (attrName == "perspective") {
        this.renderNode.setProjectionOverride(matrix);
    }
}

p.dispose = function () {
    this.perspectiveFetcher.clear();
    this.getRenderNode().remove();
    this.clearAdapterHandles();
}

// Export
module.exports = ViewRenderAdapter;

