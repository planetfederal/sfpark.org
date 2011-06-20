/**
 * @require plugins/PilotAreas.js
 * @require plugins/WMSGetFeatureInfo.js
 */

Ext.QuickTips.init();
Ext.BLANK_IMAGE_URL = "theme/app/img/blank.gif";
OpenLayers.DOTS_PER_INCH = 25.4 / 0.28;
OpenLayers.ImgPath = "externals/openlayers/img/";
OpenLayers.ProxyHost = "proxy/?url=";
OpenLayers.Layer.WMS.prototype.DEFAULT_PARAMS.transparent = true;

app.availabilityTip = "<div class='legend-tip'><h4>Availability</h4><ul>" +
    "<li class='legend-avail-low'>Low (&lt; 15%)</li>" +
    "<li class='legend-avail-med'>Medium (15 - 30%)</li>" +
    "<li class='legend-avail-high'>High (&gt; 30%)</li>" +
    "<li class='legend-nodata'>No data</li>" +
    "</ul></div>";

app.rateTip = "<div class='legend-tip'><h4>Rates</h4><ul>" +
    "<li class='legend-rates-low'>$0 - $2.00/hr</li>" +
    "<li class='legend-rates-med'>$2.01 - $4.00/hr</li>" +
    "<li class='legend-rates-high'>&gt; $4.00/hr</li>" +
    "<li class='legend-nodata'>No data</li>" +
    "</ul></div>";

app.refreshTipTemplate = new Ext.Template(
    "<div class='legend-tip'><h4>Refresh</h4>",
    "Rates and availability<br>as of {time}."
);

app.getFormattedTime = function() {
    var date = new Date();
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var suffix = "AM";
    if (hours >= 12) {
        suffix = "PM";
        hours -= 12;
    }
    if (hours === 0) {
        hours = 12;
    }
    if (minutes < 10) {
        minutes = "0" + minutes;
    }
    return hours + ":" + minutes + " " + suffix;
};


var viewer = new gxp.Viewer({
    
    mode: "availability",
    portalConfig: {
        renderTo: "mapportal",
        border: false, 
        width: 940, 
        height: 494,
        region: "center"
    },
    portalItems: [{
        region: "center",
        xtype: "container",
        items: [
            {
                xtype: "container",
                layout: "hbox",
                cls: "search", 
                layoutConfig: {
                    align: "middle"
                },
                defaults: {
                    border: false,
                    height: 33
                },
                height: 45,
                items: [
                    {
                        xtype: "box",
                        width: 150,
                        autoEl: {tag: "div", cls: "findHeader", html: "<h3>Find parking:</h3>"}
                    }, {
                        xtype: "container",
                        width: 270,
                        id: "geocoder"
                    }, {
                        xtype: "container",
                        style: {
                            padding: "0 5px 0 10px"
                        },
                        items: [{
                            xtype: "button",
                            enableToggle: true,
                            allowDepress: false,
                            toggleGroup: "style",
                            pressed: true,
                            cls: "availability-btn",
                            width: 99,
                            height: 33,
                            handler: function() {
                                viewer.mode = "availability";
                                Ext.get('legend-body').dom.qtip = app.availabilityTip;
                                Ext.get('legend-body').removeClass("pricing-legend");
                                Ext.get('legend-body').addClass("availability-legend");
                                var map = viewer.mapPanel.map;
                                for (var i=0,ii=map.layers.length;i<ii;++i) {
                                    var layer = map.layers[i];
                                    if (layer instanceof OpenLayers.Layer.WMS) {
                                        if (layer.params.LAYERS === "sfpark:BLOCKFACE_AVAILABILITY") {
                                            layer.mergeNewParams({"STYLES": "BLOCKFACE_AVAIL_THRESHOLD"});
                                        }
                                        if (layer.params.LAYERS === "sfpark:OSP_AVAILABILITY") {
                                            layer.mergeNewParams({"STYLES": "OSP_AVAIL_THRESHOLD"});
                                        }
                                    }
                                }
                            }
                        }]
                    }, {
                        xtype: "container",
                        style: {
                            padding: "0 10px 0 5px"
                        },
                        items: [{
                            xtype: "button",
                            enableToggle: true,
                            allowDepress: false,
                            toggleGroup: "style",
                            cls: "pricing-btn",
                            width: 73,
                            height: 33,
                            handler: function() {
                                viewer.mode = "pricing";
                                Ext.get('legend-body').dom.qtip = app.rateTip;
                                Ext.get('legend-body').removeClass("availability-legend");
                                Ext.get('legend-body').addClass("pricing-legend");
                                var map = viewer.mapPanel.map;
                                for (var i=0,ii=map.layers.length;i<ii;++i) {
                                    var layer = map.layers[i];
                                    if (layer instanceof OpenLayers.Layer.WMS) {
                                        if (layer.params.LAYERS === "sfpark:BLOCKFACE_AVAILABILITY") {
                                            layer.mergeNewParams({"STYLES": "BLOCKFACE_RATE_THRESHOLD"});
                                        }
                                        if (layer.params.LAYERS === "sfpark:OSP_AVAILABILITY") {
                                            layer.mergeNewParams({"STYLES": "OSP_RATE_THRESHOLD"});
                                        }
                                    }
                                }
                            }
                        }]
                    }, {
                        xtype: "container",
                        layout: "hbox",
                        width: 260,
                        height: 20,
                        style: {
                            padding: "0 10px"
                        },
                        items: [{
                            xtype: "box",
                            width: 40,
                            html: "Low",
                            cls: "legend-item"
                        }, {
                            flex: 1,
                            border: false,
                            bodyCfg: {
                                tag: "div",
                                id: "legend-body",
                                qtip: app.availabilityTip,
                                cls: "availability-legend",
                                html: "&nbsp;"
                            }
                        }, {
                            xtype: "box",
                            width: 40,
                            html: "High",
                            cls: "legend-item"
                        }]
                    }, {
                        xtype: "button",
                        cls: "refresh-btn",
                        id: "refresh-btn",
                        width: 20,
                        height: 22,
                        handler: function(cmp) {
                            var map = viewer.mapPanel.map;
                            for (var i=0,ii=map.layers.length;i<ii;++i) {
                                var layer = map.layers[i];
                                if (layer instanceof OpenLayers.Layer.WMS) {
                                    layer.redraw(true);
                                }
                            }
                            for (var key in this.tools) {
                                var tool = this.tools[key];
                                if (tool.ptype == "app_wmsgetfeatureinfo") {
                                    if (tool.popup) {
                                        tool.popup.close();
                                    }
                                    break;
                                }
                            }
                            cmp.dynamicTip.destroy();
                            cmp.dynamicTip = new Ext.ToolTip({
                                target: "refresh-btn",
                                html: app.refreshTipTemplate.applyTemplate({
                                    mode: viewer.mode,
                                    time: app.getFormattedTime()
                                })
                            });
                        },
                        listeners: {
                            render: function(cmp) {
                                // TODO: This looks neccessary in order to update the tip.
                                // Find a better alternative if possible.
                                cmp.dynamicTip = new Ext.ToolTip({
                                    target: "refresh-btn",
                                    html: app.refreshTipTemplate.applyTemplate({
                                        mode: viewer.mode,
                                        time: app.getFormattedTime()
                                    })
                                });
                            }
                        }
                    }
                ]
            }, 
            "map"
        ]
    }],
    sources: {
        local: {
            ptype: "gxp_wmssource",
            url: "/geoserver/ows",
            title: "Local GeoServer",
            version: "1.1.1"
        },
        google: {
            ptype: "gxp_googlesource"
        }
    },
    tools: [
        {
            ptype: "app_wmsgetfeatureinfo",
            actionTarget: null
        }, {
            ptype: "app_pilotareas",
            url: "/geoserver/ows",
            featureType: "PILOT_AREAS",
            featureNS: "sfpark",
            displayField: "PM_DISTRICT_NAME",
            outputTarget: "geocoder",
            outputConfig: {
                width: 250,
                emptyText: "Select a Neighborhood"
            }
        }
    ],
    map: {
        id: "map", 
        height: 449,
        border: false,
        projection: "EPSG:900913",
        units: "m",
        numZoomLevels: 21,
        maxResolution: 156543.03390625,
        maxExtent: [
            -20037508.34, -20037508.34,
            20037508.34, 20037508.34
        ],
        extent: [-13630460.905642, 4544450.3840456, -13624163.334642, 4552410.6141212],
        layers: [{
            source: "google",
            title: "Road Map",
            name: "ROADMAP",
            group: "background",
            visibility: true
        }, {
            source: "google",
            title: "Hybrid Map",
            name: "HYBRID",
            group: "background",
            visibility: false
        }, {
            source: "google",
            title: "Satellite Map",
            name: "SATELLITE",
            group: "background",
            visibility: false
        }, {
            source: "google",
            title: "Terrain Map",
            name: "TERRAIN",
            group: "background",
            visibility: false
        }, {
            source: "local",
            name: "sfpark:BLOCKFACE_AVAILABILITY",
            styles: "BLOCKFACE_AVAIL_THRESHOLD",
            visibility: true
        }, {
            source: "local",
            name: "sfpark:OSP_AVAILABILITY",
            styles: "OSP_AVAIL_THRESHOLD",
            visibility: true
        }],
        items: [{
            xtype: "gx_zoomslider",
            vertical: true,
            height: 100
        }]
    }
});
