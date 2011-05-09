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

    constructor: function(config) {
        app.plugins.WMSGetFeatureInfo.superclass.constructor.apply(this, arguments);
        // templates for brief display
        this.templates = {};
        this.templates['BLOCKFACE_AVAILABILITY'] = {};
        this.templates['BLOCKFACE_AVAILABILITY'][app.constants.AVAILABILITY] = 
            new Ext.Template('<span class="itemHeading itemHeadingStreet">{NAME}</span><br/><span>{AVAIL_MSG}</span><br/>');
        this.templates['BLOCKFACE_AVAILABILITY'][app.constants.PRICING] = 
            new Ext.Template('<span class="itemHeading itemHeadingStreet">{NAME}</span><br/>{RATE}');
        this.templates['OSP_AVAILABILITY'] = {};
        this.templates['OSP_AVAILABILITY'][app.constants.AVAILABILITY] = 
            new Ext.Template('<span class="itemHeading itemHeadingStreet">{NAME}</span><br/><span>{AVAIL_MSG}</span><br/>');
        this.templates['OSP_AVAILABILITY'][app.constants.PRICING] = 
            new Ext.Template('<span class="itemHeading itemHeadingStreet">{NAME}</span><br/>{RATE}');
        this.rateTemplate = new Ext.Template('<span class="rateTimes">{TIME}{DESC}</span> <span class="rateQualifier">{RATE}</span><br/>');
        this.hourTemplate = new Ext.Template('{DAYS} {TIME}<br/>');
    },
     
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
                            if (evt.features && evt.features.length > 0) {
                                var feature = evt.features[0];
                                var rates = null;
                                // protect ourselves against data issues
                                try {
                                    rates = Ext.decode(feature.attributes['RATE_SCHED']);
                                } catch(err) {
                                }
                                var featureType = feature.gml.featureType;
                                var tpl = this.templates[featureType][this.target.mode];
                                var html = tpl.applyTemplate(feature.attributes);
                                if (rates) {
                                    html += '<div id="sfparkrates" style="display:none"><span class="itemHeading itemHeadingRates">Rates:</span><div class="rates">';
                                    for (var i=0,ii=rates.RS.length;i<ii;++i) {
                                        var rate = rates.RS[i];
                                        html += this.rateTemplate.applyTemplate(rate);
                                    }
                                    html += '</div></div>';
                                }
                                // opening hours
                                var hours = Ext.decode(feature.attributes['OP_HRS']);
                                if (hours) {
                                    html += '<div id="sfparkhours" style="display:none"><span class="itemHeading itemHeadingHours">Hours:</span><div class="hours">';
                                    if (hours.OPHRS instanceof Array) {
                                        for (var i=0,ii=hours.OPHRS.length;i<ii;++i) {
                                            var hour = hours.OPHRS[i];
                                            html += this.hourTemplate.applyTemplate(hour);
                                        }
                                    } else {
                                        html += this.hourTemplate.applyTemplate(hours.OPHRS);
                                    }
                                    html += '</div></div>';
                                }
                                this.displayPopup(evt, html);
                            }
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

    expandInfo: function() {
        var rateInfo = Ext.get('sfparkrates');
        if (rateInfo) {
            rateInfo.dom.style.display = 'block';
        }
        var hourInfo = Ext.get('sfparkhours');
        if (hourInfo) {
            hourInfo.dom.style.display = 'block';
        }
        this.popup.getTopToolbar().items.get(1).hide();
        this.popup.getTopToolbar().items.get(2).show();
        this.popup.setSize(300, 200);
    },

    closePopup: function() {
        this.popup.close();
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
            frame: false,
            bodyCfg: {tag: 'div', cls: 'x-panel-body sfpopup', html: text},
            closable: false,
            unpinnable: false,
            tbar: ['->', {text: "+", handler: this.expandInfo, scope: this}, {text: "X", hidden: true, handler: this.closePopup, scope: this}],
            location: evt.xy,
            map: this.target.mapPanel,
            width: 200,
            height: 100
        });
    }
    
});

Ext.preg(app.plugins.WMSGetFeatureInfo.prototype.ptype, app.plugins.WMSGetFeatureInfo);
