Ext.namespace("app.plugins");

app.plugins.PilotAreas = Ext.extend(gxp.plugins.GoogleGeocoder, {
    
    /** api: ptype = app_pilotareas */
    ptype: "app_pilotareas",

    init: function(target) {

        var pilotAreas = [
            ["All pilot areas", null,new OpenLayers.Bounds(-122.444513628356, 37.7519975745233, -122.387941585531, 37.8085150445566)],
            ["Marina", null, new OpenLayers.Bounds(-122.444513628356, 37.7976746797776, -122.433827141927, 37.8017570192231)],
            ["Fisherman's Wharf", null, new OpenLayers.Bounds(-122.444513628356, 37.7519975745233, -122.387941585531, 37.8085150445566)],
            ["Fillmore", null, new OpenLayers.Bounds(-122.436403263234, 37.7783211605922, -122.427775370026, 37.7930035407379)],
            ["Civic Center", null, new OpenLayers.Bounds(-122.426801445628, 37.7730736409647, -122.414750657748, 37.7836402560389)],
            ["Downtown", null, new OpenLayers.Bounds(-122.408967618884, 37.7801852615563, -122.39039437801, 37.7974088646307)],
            ["South Embarcadero", null, new OpenLayers.Bounds(-122.4035148658, 37.7637978685394, -122.387941585531, 37.7908383878039)],
            ["Mission", null, new OpenLayers.Bounds(-122.424408804036, 37.7519975745233, -122.416109294491, 37.7669016660382)]
        ];

        var store = new Ext.data.ArrayStore({
            fields: ['address', 'location', 'viewport'],
            data : pilotAreas
        });

        var combo = new Ext.form.ComboBox(Ext.apply({
            store: store,
            mode: 'local', 
            triggerAction: 'all',
            displayField: "address",
            listeners: {
                select: this.onComboSelect,
                scope: this
            }
        }, this.outputConfig));
        
        this.combo = combo;
        
        return gxp.plugins.GoogleGeocoder.superclass.init.apply(this, arguments);

    }

});

Ext.preg(app.plugins.PilotAreas.prototype.ptype, app.plugins.PilotAreas);
