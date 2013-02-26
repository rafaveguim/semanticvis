/**
 * Created with JetBrains WebStorm.
 * User: 100457636
 * Date: 16/11/12
 * Time: 12:23 PM
 * To change this template use File | Settings | File Templates.
 */
var margin = {top: 20, right: 0, bottom: 0, left: 0},
    width = 1500,
    height = 700 - margin.top - margin.bottom,
    formatNumber = d3.format(",d"),
    transitioning,
    root,
    originalRoot;

// Filtering parameters
var minValue = 0, maxValue=999999;

var x = d3.scale.linear()
    .domain([0, width])
    .range([0, width]);

var y = d3.scale.linear()
    .domain([0, height])
    .range([0, height]);

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

d3.json("0_1000000.json", function(tree) {

    root = originalRoot = tree;

    initialize(root);
    accumulate(root);
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
    function layout(d) {
        if (d.children) {
            treemap.nodes({children: d.children.filter(filter)});
            d.children.filter(filter).forEach(function(c) {
                c.x = d.x + c.x * d.dx;
                c.y = d.y + c.y * d.dy;
                c.dx *= d.dx;
                c.dy *= d.dy;
                c.parent = d;
                layout(c);
            });
        }
    }

    function filter(d){
        return d.value >= minValue && d.value <= maxValue;
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
            .data(d.children.filter(filter))
            .enter().append("g");

        g.filter(function(d) { return d.children; })
            .classed("children", true)
            .on("click", transition);

        g.filter(function(d) { return !d.children; })
            .classed("leaf", true);

        g.selectAll(".child")
            .data(function(d) { return d.children || [d]; })
            .enter().append("rect")
            .attr("class", "child")
            .call(rect);

        g.append("rect")
            .attr("class", "parent")
            .call(rect)
            .append("title")
            .text(function(d) { return formatNumber(d.value); });

        g.append("text")
            .attr("dy", ".75em")
            .text(function(d) { return d.key; })
            .call(text);

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
            t2.selectAll("text").call(text).style("fill-opacity", 1);
            t1.selectAll("rect").call(rect);
            t2.selectAll("rect").call(rect);

            // Remove the old node when the transition is finished.
            t1.remove().each("end", function() {
                svg.style("shape-rendering", "crispEdges");
                transitioning = false;
            });
        }

        return g;
    }

    function text(text) {
        text.attr("x", function(d) { return x(d.x) + 6; })
            .attr("y", function(d) { return y(d.y) + 6; });
    }

    function rect(rect) {
        rect.attr("x", function(d) { return x(d.x); })
            .attr("y", function(d) { return y(d.y); })
            .attr("width", function(d) { return x(d.x + d.dx) - x(d.x); })
            .attr("height", function(d) { return y(d.y + d.dy) - y(d.y); })
            .attr("class", function(d){
                var curClass = d3.select(this).attr('class');
                return d.children ? curClass : curClass + ' leaf';
            });
    }

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
                minValue = ui.values[0];
                maxValue = ui.values[1];
                var target =  grandparent.datum() == null ? root : grandparent.datum();
                d3.select('g.depth').data([]).exit().remove();
                layout(root);
                display(root);
            }
        });
    }
});
