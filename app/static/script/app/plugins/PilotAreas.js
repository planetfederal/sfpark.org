Ext.namespace("app.plugins");

app.plugins.PilotAreas = Ext.extend(gxp.plugins.Tool, {
    
    /** api: ptype = app_pilotareas */
    ptype: "app_pilotareas",

    init: function(target) {

        var store = new gxp.data.WFSFeatureStore({
            url: this.url,
            featureType: this.featureType,
            featureNS: this.featureNS,
            srsName: target.mapPanel.map.projection,
            fields: [{name: this.displayField}],
            autoLoad: true
        });

        var combo = new Ext.form.ComboBox(Ext.apply({
            store: store,
            triggerAction: 'all',
            mode: "local",
            forceSelection: true,
            typeAhead: true,
            displayField: this.displayField,
            listeners: {
                select: this.onComboSelect,
                scope: this
            }
        }, this.outputConfig));
        
        this.combo = combo;
        return app.plugins.PilotAreas.superclass.init.apply(this, arguments);

    },

    /** api: method[addOutput]
     */
    addOutput: function(config) {
        return app.plugins.PilotAreas.superclass.addOutput.call(this, this.combo);
    },

    onComboSelect: function(combo, record) {
        var location = record.get("feature").geometry.getBounds();
        var map = this.target.mapPanel.map;
        map.zoomToExtent(location, true);
    }

});

Ext.preg(app.plugins.PilotAreas.prototype.ptype, app.plugins.PilotAreas);
