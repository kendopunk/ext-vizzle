d3.helper = {};

d3.helper.tooltip = function(){
    var tooltipDiv;
    var bodyNode = d3.select('body').node();
    var attrs = {};
    var text = '';
    var styles = {
    	/*
        background: '#FFFFCC',
        padding: '3px',
        border: '1px',
        font: '9px, sans-serif',
        border: '1px solid'
        */
        'line-height': '120%',
        'font-weight': 'normal',
        font: '9px sans-serif',
        padding: '5px',
        background: '#222222',
        color: '#EEEEEE',
		'border-radius': '3px',
       	'pointer-events': 'none',
		'box-shadow': '1px 1px 2px #686868'
    };

    function tooltip(selection){

        selection.on('mouseover.tooltip', function(pD, pI){
            var name, value;
            // Clean up lost tooltips
            d3.select('body').selectAll('div.tooltip').remove();
            // Append tooltip
            tooltipDiv = d3.select('body').append('div');
            tooltipDiv.attr(attrs);
            tooltipDiv.style(styles);
            var absoluteMousePos = d3.mouse(bodyNode);
            tooltipDiv.style({
                left: (absoluteMousePos[0] + 10)+'px',
                top: (absoluteMousePos[1] - 15)+'px',
                position: 'absolute',
                'z-index': 1001,
                'border-radius': '8px'
            });
            // Add text using the accessor function, Crop text arbitrarily
           // tooltipDiv.style('width', function(d, i){ return (text(pD, pI).length > 80) ? '200px' : null; })
                //.html(function(d, i){return text(pD, pI);});
                
            // auto width
            tooltipDiv.html(function(d, i){return text(pD, pI);});
        })
        .on('mousemove.tooltip', function(pD, pI){
            // Move tooltip
            var absoluteMousePos = d3.mouse(bodyNode);
            tooltipDiv.style({
                left: (absoluteMousePos[0] + 10)+'px',
                top: (absoluteMousePos[1] - 15)+'px'
            });
            // Keep updating the text, it could change according to position
            tooltipDiv.html(function(d, i){ return text(pD, pI); });
        })
        .on('mouseout.tooltip', function(pD, pI){
        	if(tooltipDiv !== undefined) {
        		tooltipDiv.remove();
        	}
        })
        .on('click.tooltip', function() {
	        if(tooltipDiv !== undefined) {
        		tooltipDiv.remove();
        	}
	    })
        .on('dblclick.tooltip', function() {
			if(tooltipDiv !== undefined) {
        		tooltipDiv.remove();
        	}
	    });
    }

    tooltip.attr = function(_x){
        if (!arguments.length) return attrs;
        attrs = _x;
        return this;
    };

    tooltip.style = function(_x){
        if (!arguments.length) return styles;
        styles = _x;
        return this;
    };

    tooltip.text = function(_x){
        if (!arguments.length) return text;
        text = d3.functor(_x);
        return this;
    };

    return tooltip;
};