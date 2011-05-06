/**
 * Copyright (c) 2008-2011 The Open Planning Project
 * 
 * Published under the BSD license.
 * See https://github.com/opengeo/gxp/raw/master/license.txt for the full text
 * of the license.
 */

/** api: (define)
 *  module = app.plugins
 *  class = WMSGetFeatureInfo
 */

Ext.namespace("app.plugins");

/** api: constructor
 *  .. class:: WMSGetFeatureInfo(config)
 *
 *    This plugins provides an action which, when active, will issue a
 *    GetFeatureInfo request to the WMS of all layers on the map. The output
 *    will be displayed in a popup.
 */   
app.plugins.WMSGetFeatureInfo = Ext.extend(gxp.plugins.Tool, {
    
    /** api: ptype = app_wmsgetfeatureinfo */
    ptype: "app_wmsgetfeatureinfo",
    
    /** api: config[outputTarget]
     *  ``String`` Popups created by this tool are added to the map by default.
     */
    outputTarget: "map",

    /** api: config[vendorParams]
     *  ``Object``
     *  Optional object with properties to be serialized as vendor specific
     *  parameters in the requests (e.g. {buffer: 10}).
     */
     
    /** api: method[addActions]
     */
    addActions: function() {
        var actions = app.plugins.WMSGetFeatureInfo.superclass.addActions.call(this, []);

        var info = {controls: []};
        var updateInfo = function() {
            var queryableLayers = this.target.mapPanel.layers.queryBy(function(x){
                return x.get("queryable");
            });

            var map = this.target.mapPanel.map;
            var control;
            for (var i = 0, len = info.controls.length; i < len; i++){
                control = info.controls[i];
                control.deactivate();  // TODO: remove when http://trac.openlayers.org/ticket/2130 is closed
                control.destroy();
            }

            info.controls = [];
            queryableLayers.each(function(x){
                var control = new OpenLayers.Control.WMSGetFeatureInfo({
                    autoActivate: true,
                    hover: true,
                    infoFormat: 'application/vnd.ogc.gml',
                    maxFeatures: 1,
                    url: x.getLayer().url,
                    queryVisible: true,
                    layers: [x.getLayer()],
                    vendorParams: this.vendorParams,
                    eventListeners: {
                        getfeatureinfo: function(evt) {
                            var tpl = new Ext.Template('<h3>{NAME}</h3>{AVAIL_MSG}');
                            this.displayPopup(evt, tpl.applyTemplate(evt.features[0].attributes));
                        },
                        scope: this
                    }
                });
                map.addControl(control);
                info.controls.push(control);
            }, this);

        };
        
        this.target.mapPanel.layers.on("update", updateInfo, this);
        this.target.mapPanel.layers.on("add", updateInfo, this);
        this.target.mapPanel.layers.on("remove", updateInfo, this);
        
        return actions;
    },

    /** private: method[displayPopup]
     * :arg evt: the event object from a 
     *     :class:`OpenLayers.Control.GetFeatureInfo` control
     * :arg text: ``String`` Body text.
     */
    displayPopup: function(evt, text) {
        if (this.popup) {
            this.popup.close();
        }

        this.popup = this.addOutput({
            xtype: "gx_popup",
            plain: true,
            closable: false,
            unpinnable: false,
            html: text,
            location: evt.xy,
            map: this.target.mapPanel,
            width: 200,
            height: 100
        });
    }
    
});

Ext.preg(app.plugins.WMSGetFeatureInfo.prototype.ptype, app.plugins.WMSGetFeatureInfo);
