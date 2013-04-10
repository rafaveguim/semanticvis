/**
 * Created with JetBrains WebStorm.
 * User: 100457636
 * Date: 15/11/12
 * Time: 4:38 PM
 * To change this template use File | Settings | File Templates.
 */

var size = { width : d3.select('body').node().clientWidth,
        height : d3.select('body').node().clientHeight },
    padding = {left: 10, top:10},
    options = {nodeRadius: 5, maxLabelLength: 15, fontSize: 10};

var tree = d3.layout.tree()
    .sort(null)
    .size([size.width - padding.left - options.nodeRadius, size.height - padding.top - options.nodeRadius])
    .children(function(d){ return !d.children ? null : d.children; });

var svg = d3.select('body')
    .append('svg:svg')
    .attr('width', size.width)
    .attr('height', size.height)
    .attr("class", "BuGn");

var root = null;

var
//cutFiles = ['cut-nouns-li_abe-100k-0-06141a7dc4.txt', 'cut-nouns-li_abe-500k-0-06141a7dc4.txt', 'cut-nouns-li_abe-5mi-0-06141a7dc4.txt'],
//    cutFiles = ['cut-nouns-wagner-5mi-0-06141a7dc4.txt', 'cut-nouns-li_abe-5mi-0-06141a7dc4.txt'],
    cutFiles = ['cut-nouns-wagner-5mi-100-0-06141a7dc4.txt', 'cut-nouns-wagner-5mi-1000-0-06141a7dc4.txt',
        'cut-nouns-wagner-5mi-10000-0-06141a7dc4.txt'/*, 'cut-nouns-wagner-5mi-100000-0-06141a7dc4.txt'*/],
    cuts     = null;

// Loading cuts with a little help of queue.js.

var q = queue(cutFiles.length);
// an array of tasks that will load the files
var tasks = cutFiles.map(function (f) {
    return function (callback) { d3.json('data/'+f, callback); };
});

// loads the files in parallel
tasks.forEach(function (t) { q.defer(t); });

q.awaitAll(function (error, results) {
    cuts = results;
    d3.json('data/tree-nouns-li_abe-5mi-0-06141a7dc4.json', initialize);
});

function initialize(data){
    root = data;

    display(root);

    d3.select('body').on('click', clickBody);

    document.onkeydown = function(evt){
        if (evt.keyCode == 38){
            var d = d3.select('g.container > circle.node:first-of-type')
                .datum().parent;
            display(d);
        }
    };
}

function clickBody(){ display(root); }

function clickCircle(d){
    event.stopImmediatePropagation();
    display(d);
}

function display(root){
    var nodes = tree.nodes(root),
        links = tree.links(nodes);

    var link = d3.svg.diagonal()
        .projection(function(d){ return [d.x, d.y]});

    svg.selectAll('g.container').remove();

    var color = d3.scale.quantile()
        .domain(d3.values(nodes.map(function(d){ return d.value; })))
        .range(d3.range(9));

    // offscreen strategy, as described in https://groups.google.com/forum/?fromgroups=#!topic/d3-js/3ZBw94L0UD4
    var offscreen = d3.select(document.createElementNS(d3.ns.prefix.svg, "g"))
        .classed('container', true)
        .attr('transform', 'translate('+padding.left+','+padding.top+')');

    var path = offscreen.selectAll('path.link').data(links);
    path.exit().remove();
    path.enter().append('svg:path');
    path.classed('link', true)
        .attr('d', link);

    var colors = ['#878D00', '#E70000', '#0098E0'];

    // replaces the ids by the actual nodes they refer to
    var cutsNodes = cuts.map(function (cut) {
        return nodes.filter(function (n) {
            return cut.indexOf(n.id) > -1;
        });
    });

    // draws a polyline for each cut
    offscreen.selectAll('path.cut')
        .data(cutsNodes)
        .enter()
        .append('svg:path')
        .classed('cut', true)
        .attr('d', function (d) {
            var line = d3.svg.line();
            return line(d.map(function (node) {
                return [node.x, node.y];
            }));
        })
        .style('stroke', function (d, i) { return colors[i]; })
        .on('mouseover', function(){
            d3.select(this).style('stroke-width', '3px');
            var last = d3.select('g.container > path.cut:last-of-type').node();
            if (last!=this)
                this.parentNode.insertBefore(this, last.nextElementSibling);
        })
        .on('mouseout', function(){ d3.select(this).style('stroke-width', null); });


    var nodeGroup = offscreen.selectAll('circle.node').data(nodes);
    nodeGroup.exit().remove();
    nodeGroup.enter()
        .append('svg:circle')
        .append('title');
    nodeGroup.attr('cx', function(d){ return d.x })
        .attr('cy', function(d){ return d.y })
        .attr('r', options.nodeRadius)
        .on('click', clickCircle)
        .attr("class", function(d) { return "q" + color(d.value) + "-9"; })
        .classed('node', true)
        .select('title')
        .text(function(d){ return d.key+'\n'+d.value });



    svg.node().appendChild(offscreen.node());
}

/* data mapping */
/*var nodeRadius = d3.scale().linear()
 .domain(d3.extent(nodes.map(function(d){
 return d.children == null ? 0 : d.children.length;
 })))
 .range([0,10]);*/


// append labels
/*nodeGroup.append('svg:text')
 .attr('text-anchor', function(d){
 return d.children == null ? 'end' : 'start'
 })
 .attr('dx', function(d){
 var gap = 2 * options.nodeRadius;
 return d.children == null ? -gap : gap;
 })
 .attr('dy', 3)
 .text(function(d){return d.key;});*/








