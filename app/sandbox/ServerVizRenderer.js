/**
 *  Provide access to backend rendering service to render/download
 *  rendered results (images, spreadsheet)
 */
Ext.define('Sandbox.util.viz.ServerVizRenderer', {
    statics: {
	/**
	 * Takes three params:
	 *
	 *   svg_to_png_url: url of the backend service that does the conversion;
	 *   ext_container: the container that has one svg chart element in it;
	 *   chart_name: (optionally) name of the chart/file the png file download is going to use. Default to "chart.png".
	 *
	 * If no svg element is found in ext_container, nothing will
	 * happen; if there are more than one svg element, the first one
	 * will be used.  Otherwise, create a hidden form panel to
	 * submit/post the svg
	 */
	renderSvgAsPng: function(svg_to_png_url, ext_container, chart_name) {
	    var svgEls = Ext.DomQuery.select('#' + ext_container.id + ' svg');

	    if (svgEls.length >= 1) {
		var svgElAsString = typeof window.XMLSerializer != "undefined"?
		    new window.XMLSerializer().serializeToString(svgEls[0]):
		    typeof svgEls[0].xml != "undefined"?
		    svgEls[0].xml:
		    "<svg/>";
		chart_name = chart_name || 'chart.png';
		var hiddenForm = Ext.create('Ext.form.Panel', {
		    standardSubmit: true,
		    url: svg_to_png_url,
		    timeout: 120000,
		    height: 0,
		    width: 0,
		    hidden: true,
		    items: [{
			xtype: 'hidden',
			name: 'svg',
			value: svgElAsString
		    }, {
			xtype: 'hidden',
			name: 'name',
			value: chart_name
		    }]
		});
		
		hiddenForm.getForm().submit();
	    }
	},

	/**
	 * Takes FIVE (5) params:
	 *
	 *   json_to_excel_url: url of the backend service that does the conversion;
	 *   dataset: the grid dataset (either store.data.items, or selModel.getSelection())
	 *   column_defs: an array of column definitions (as defined in Sandbox.util.ColumnDefinitions)
	 *   file_name: (optionally) name of the excel file download is going to use. Default to "report.xls"
	 *   header String optional excel header text
	 *   footer String optional excel footer text
	 *
	 */
	renderDataAsExcel: function(json_to_excel_url, dataset, column_defs, file_name, header, footer) {
	    // use it to strip off any html tags in value
	    var htmlTagRemovedRegex = /(<([^>]+)>)/ig;
	    
	    // construct json data export
	    var jsonGrid = {
		headers: Ext.Array.map(column_defs, function(column) {
		    var retVal = {};
		    retVal.dataIndex = column.dataIndex;
		    retVal.text = column.text.replace(htmlTagRemovedRegex, ' ');	// <br> = space
		    return retVal;
		}),
		
		data: Ext.Array.map(dataset, function(row) {
		    var retVal = {};
		    
		    column_defs.forEach(function(col, index) {
			retVal[col.dataIndex] = Sandbox.util.GridRenderers.timestampToDate == col.renderer?
			    col.renderer(row.data[col.dataIndex]):
			    row.data[col.dataIndex];
		    });

		    return retVal;
		})
	    };

	    if (header != undefined && header != null) {
		jsonGrid.header = header;
	    }
	    
	    if (footer != undefined && footer != null) {
		jsonGrid.footer = footer;
	    }
	    
	    file_name = file_name || "report.xls"

	    var hiddenForm = Ext.create('Ext.form.Panel', {
		standardSubmit: true,
		url: json_to_excel_url,
		timeout: 120000,
		height: 0,
		width: 0,
		hidden: true,
		items: [{
		    xtype: 'hidden',
		    name: 'json',
		    value: Ext.encode(jsonGrid)
		}, {
		    xtype: 'hidden',
		    name: 'name',
		    value: file_name
		}]
		// MF: add header, footer params here
	    });
	    
	    hiddenForm.getForm().submit();
	}
    }
});
