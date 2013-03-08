/**
 * Created with JetBrains WebStorm.
 * User: Rafa
 * Date: 16/11/12
 * Time: 12:23 PM
 */
var margin  = {top: 20, right: 0, bottom: 0, left: 0},
    width   = util.toInt(d3.select('#chart').style('width')),
    height  = document.getElementsByTagName('body')[0].clientHeight - document.getElementById('controls').clientHeight
        - margin.top - margin.bottom,
    formatNumber = d3.format(",d"),
    transitioning,
    root,
    originalRoot;

var svgXmlns = "http://www.w3.org/2000/svg";

// Filtering parameters (frequency)
var frequencyMin = 0,
    frequencyMax = 999999,
    entropyMin   = 0,
    entropyMax   = 999999;

// Fonts
var maxFontSize = util.toInt(d3.select('body').style('font-size')),
    minFontSize = 8;

var x = d3.scale.linear()
        .domain([0, width])
        .range ([0, width]),

    y = d3.scale.linear()
        .domain([0, height])
        .range ([0, height]);

var treemap = d3.layout.treemap()
    .children(function(d, depth) { return depth ? null : d.children; })
    .sort(function(a, b) { return a.value - b.value; })
    .ratio(height / width * 0.5 * (1 + Math.sqrt(5)))
    .round(false);

var svg = d3.select('body').select("#chart").append('svg:svg')
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.bottom + margin.top)
    .style("margin-left", -margin.left + "px")
    .style("margin-right", -margin.right + "px")
    .append("svg:g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .style("shape-rendering", "crispEdges");

var grandparent = svg.append("svg:g")
    .attr("class", "grandparent");

grandparent.append("rect")
    .attr("y", -margin.top)
    .attr("width", width)
    .attr("height", margin.top);

grandparent.append("text")
    .attr("x", 6)
    .attr("y", 6 - margin.top)
    .attr("dy", ".75em");

// Creating font for measuring purposes.
var font        = new Font();
font.fontFamily = d3.select('body').style('font-family').split(', ')[0];
font.src        = font.fontFamily;

d3.json("0_1000000.json", function(tree) {

    root = originalRoot = tree;

    initialize(root);
//    accumulate(root);
    layout(root);
    display(root);
    controls(root);

    function initialize(root) {
        root.x = root.y = 0;
        root.dx = width;
        root.dy = height;
        root.depth = 0;
    }

    // Aggregate the values for internal nodes. This is normally done by the
    // treemap layout, but not here because of our custom implementation.
    function accumulate(d) {
        return d.children
            ? d.value = d.children.reduce(function(p, v) { return p + accumulate(v); }, 0)
            : d.value;
    }

    // Compute the treemap layout recursively such that each group of siblings
    // uses the same size (1×1) rather than the dimensions of the parent cell.
    // This optimizes the layout for the current zoom state. Note that a wrapper
    // object is created for the parent node for each group of siblings so that
    // the parent’s dimensions are not discarded as we recurse. Since each group
    // of sibling was laid out in 1×1, we must rescale to fit using absolute
    // coordinates. This lets us use a viewport to zoom.
    // doFilter indicates whether or not filtering should be done. By default it is true.
    function layout(d, doFilter) {
        doFilter = (typeof doFilter === "undefined") ? true : doFilter;

        if (d.children) {

            var children = doFilter ? d.children.filter(frequencyFilter) : d.children;

            treemap.nodes({children: children});

            children.forEach(function(c) {
                c.x = d.x + c.x * d.dx;
                c.y = d.y + c.y * d.dy;
                c.dx *= d.dx;
                c.dy *= d.dy;
                c.parent = d;
                layout(c,false); // this line ensures filtering is only at the first level
            });
        }
    }

    function frequencyFilter(d){
        return d.value >= frequencyMin && d.value <= frequencyMax;
    }

    function entropyFilter(d){
        return d.entropy >= entropyMin && d.entropy <= entropyMax;
    }


    function display(d) {
        grandparent
            .datum(d.parent)
            .on("click", transition)
            .select("text")
            .text(name(d));

        var g1 = svg.insert("g", ".grandparent")
            .datum(d)
            .attr("class", "depth");

        var g = g1.selectAll("g")
            .data(d.children.filter(frequencyFilter))
            .enter().append("g");

        var gChildren = g.filter(function(d) { return d.children; })
            .classed("children", true)
            .on("click", transition);

        g.filter(function(d) { return !d.children; })
            .classed("leaf", true);

        g.selectAll("rect.child")// TODO: Check this. Not all of them have children.
            .data(function(d) { return d.children || [d]; })
            .enter().append("rect")
            .attr("class", "child")
            .call(rect);

        g.append("rect")
            .attr("class", "parent")
            .call(rect)
            .append("title")
            .text(function(d) { return formatNumber(d.value) + '\n' + d.entropy; });

        // creates labels for all children
        // TODO: if too slow, creates only for those whose entropy is above threshold
        gChildren.selectAll('text.child')
            .data(function(d){return d.children})
            .enter()
            .append('text')
            .classed('child',true)
            .call(childText);

        g.append("text")
            .attr("dy", ".75em")
            .text(function(d) { return d.key; })
            .classed('parent', true)
            .call(text);

        updateOnEntropy(gChildren, false);

        function transition(d) {
            if (transitioning || !d) return;
            transitioning = true;

            var g2 = display(d),
                t1 = g1.transition().duration(750),
                t2 = g2.transition().duration(750);

            // Update the domain only after entering new elements.
            x.domain([d.x, d.x + d.dx]);
            y.domain([d.y, d.y + d.dy]);

            // Enable anti-aliasing during the transition.
            svg.style("shape-rendering", null);

            // Draw child nodes on top of parent nodes.
            svg.selectAll(".depth").sort(function(a, b) { return a.depth - b.depth; });

            // Fade-in entering text.
            g2.selectAll("text").style("fill-opacity", 0);

            // Transition to the new view.
            t1.selectAll("text").call(text).style("fill-opacity", 0);
            t2.selectAll("text").call(text).style("fill-opacity", null);
            t1.selectAll("rect").call(rect);
            t2.selectAll("rect").call(rect);
            t2.selectAll("text.child").call(childText);
            
            // Remove the old node when the transition is finished.
            t1.remove().each("end", function() {
                svg.style("shape-rendering", "crispEdges");
                transitioning = false;
            });
        }

        return g;
    }

    function childText(text){
        if (!font.loaded){
            font.src    = font.fontFamily;
            font.onload = function(){childText(text)};
            return;
        }

        var leftPadding =  5, // in pixels
            vPadding    = .5; // vertical padding in EM units

        text.attr("x", function(d) { return x(d.x);})
            .attr("y", function(d) { return y(d.y) + rectHeight(d)/2; })
//          .attr('width' , rectWidth)
//          .attr('height', rectHeight)
            .attr('dominant-baseline', 'middle')
            .text(function(d){return d.key})
            .attr('dx', leftPadding)
            .attr('font-size', function(d){
                var w = rectWidth(d),
                    h = rectHeight(d);

                if (!d.key) // yes, there's a category whose key is null TODO: investigate it
                    return 0;

                var measure = util.adjustFontSize(font, d.key, w-leftPadding, h-h*vPadding, maxFontSize, minFontSize);

                return measure ? measure.size+'px' : 0;
            });
    }

    function text(text) {
        text.attr("x", function(d) { return x(d.x) + 6; })
            .attr("y", function(d) { return y(d.y) + 6; });
    }

    function rect(rect) {
        rect.attr("x", function(d) { return x(d.x); })
            .attr("y", function(d) { return y(d.y); })
            .attr("width", rectWidth)
            .attr("height", rectHeight)
            .attr("class", function(d){
                var curClass = d3.select(this).attr('class');
                return d.children ? curClass : curClass + ' leaf';
            });
    }

    function rectWidth (d) { return x(d.x + d.dx) - x(d.x); }
    function rectHeight(d) { return y(d.y + d.dy) - y(d.y); }

    function name(d) {
        return d.parent
            ? name(d.parent) + "." + d.key
            : d.key;
    }

    function controls(root){
        var max = d3.max(root.children.map(function(d) {return d.value;}));

        $( "#filter" ).slider({
            range: true,
            min: 0,
            max: max,
            values: [ 0, max ],
            stop: function( event, ui ) {
                $("#count").val( ui.values[ 0 ] + " - " + ui.values[ 1 ] );
                frequencyMin = ui.values[0];
                frequencyMax = ui.values[1];
                var target =  d3.select('g.depth').datum();
                d3.select('g.depth').data([]).exit().remove();
                layout(target);
                display(target);
            }
        });

        var maxEntropy = d3.max(root.children.map(function(d) {return d.entropy;}));

        $( "#entropy_slider" ).slider({
            range: true,
            min: 0,
            max: maxEntropy,
            step: 0.01,
            values: [ 0, maxEntropy ],
            stop: function( event, ui ) {
                $("#entropy").val( ui.values[ 0 ] + " - " + ui.values[ 1 ] );
                entropyMin = ui.values[0];
                entropyMax = ui.values[1];

                updateOnEntropy(d3.selectAll('g.children'), true);
            }
        });
    }

    /**
     * Given 'this' being a rect element, creates a label for its data item and
     * positions the label on the middle-left. Sets its opacity to 0.
     * @param d data item
     * @param i index
     */
    function createLabel(d, i){
        var x = +d3.select(this).attr('x'),
            y = +d3.select(this).attr('y'),
            w = util.toInt(d3.select(this).attr('width')),
            h = util.toInt(d3.select(this).attr('height')),
            leftPadding =  5, // in pixels
            vPadding    = .5; // vertical padding in EM units

        var measures = util.adjustFontSize(font, d.key, w-leftPadding, h-h*vPadding, maxFontSize, minFontSize);

        if (measures) {
            var text = util.insertAfter('text', this, svgXmlns);

            d3.select(text)
                .datum(d)
                .attr('dominant-baseline', 'middle') // baseline is in the middle
                .attr('x', x)
                .attr('y', y + h/2)
                .attr('font-size', measures.size+'px')
                .attr('dx', leftPadding)
                .text(function(o){return o.key})
                .classed('child', true)
                .style('opacity', 0);
        }
    }

    /**
     * Updates the view based on the entropy threshold
     * @param selection selection in which the update should operate
     * @param transition if falsey, doesn't animate

     */
    function updateOnEntropy(selection, transition){

        var outter = selection.filter(function(d){return !entropyFilter(d)});

        // fades-out the parent's title
        if (transition){
            outter.selectAll('text.parent').transition().style('opacity', 0.0);
            outter.selectAll('text.child').transition().style('opacity', 1);
        } else {
            outter.selectAll('text.parent').style('opacity', 0.0);
            outter.selectAll('text.child').style('opacity', 1);
        }

        // reveals children's labels
        

        var inner = selection.filter(entropyFilter);

        if (transition) inner.selectAll('text.parent').transition().style('opacity', 1);
        else            inner.selectAll('text.parent').style('opacity', 1);

        inner.selectAll('text.child')
            .style('opacity',0);
    }
});
