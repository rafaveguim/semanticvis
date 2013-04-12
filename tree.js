/**
 * Created with JetBrains WebStorm.
 * User: 100457636
 * Date: 15/11/12
 * Time: 4:38 PM
 * To change this template use File | Settings | File Templates.
 */

var size = { width : width('body'),
            height : height('body') - height('#searchbox') },
    padding = {left: 10, top:10},
    options = {nodeRadius: 5, maxLabelLength: 15, fontSize: 10};

var tree = d3.layout.tree()
    .sort(null)
    .size([size.width - padding.left - options.nodeRadius,
        size.height - padding.top - options.nodeRadius])
    .children(function(d){ return !d.children ? null : d.children; });

var svg = d3.select('body')
    .append('svg:svg')
    .attr('width', size.width)
    .attr('height', size.height)
    .attr("class", "BuGn");

var root = null;

var cutFiles = ['cut-n-wagner-1000-0-5000000-1c3eb76.txt',
                'cut-n-wagner-5000-0-5000000-1c3eb76.txt',
                'cut-n-wagner-10000-0-5000000-1c3eb76.txt'],
    cuts     = null;

// Loading cuts with a little help of queue.js.
var q = queue(cutFiles.length);

// an array of tasks that will load the files
var tasks = cutFiles.map(function (f) {
    return function (callback) { d3.json('data/'+f, callback); };
});
tasks.forEach(function (t) { q.defer(t); });


// loads the files in parallel
q.awaitAll(function (error, results) {
    cuts = results;
    d3.json('data/tree-n-wagner-1000-0-5000000-1c3eb76.json', initialize);
});

function initialize(data){
    root = data;

    display(root);

    d3.select('body').on('click', clickBody);

    // prevents body from catching clicks on the searchbox
    d3.select('#searchbox').on('click', function(){ d3.event.stopImmediatePropagation() });

    document.onkeydown = function(evt){
        if (evt.keyCode == 38){
            var d = d3.select('g.container > circle.node:first-of-type')
                .datum().parent;
            if (d) display(d);
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
    d3.selectAll('.tipsy').remove();


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

function search(str){
    var re = str != '' ? new RegExp("^(s.)*" + str) : /[^\w\W]/;

    d3.selectAll('circle.node')
        .each(function(d){

            if (!re.test(d.key)){
                $(this).tipsy('hide');
                return;
            }

            $(this).tipsy({
                gravity: 's',
                trigger: 'manual',
                title: function() { return d.key; }
            });

            $(this).tipsy('show');
            var tip = $(this).tipsy(true)['tip']()[0];
            d3.select(tip)
                .datum(d)
                .on('click', clickCircle);
        });
}

function width(el) { return d3.select(el).node().clientWidth;  }

function height(el){ return d3.select(el).node().clientHeight; }

function toInt(str){ return +str.replace(/[a-zA-Z]/g, ''); }

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








