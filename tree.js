/**
 * Created with JetBrains WebStorm.
 * User: 100457636
 * Date: 15/11/12
 * Time: 4:38 PM
 * To change this template use File | Settings | File Templates.
 */

var size    = {width : d3.select('body').node().clientWidth,
        height: d3.select('body').node().clientHeight},
    padding = {left: 10, top:10},
    options = {nodeRadius: 5, maxLabelLength: 15, fontSize: 10};

var tree = d3.layout.tree()
    .sort(null)
    .size([size.width - padding.left - options.nodeRadius, size.height - padding.top]) // vertical
    .children(function(d){
        return !d.children ? null : d.children;
    });

d3.json('tree-nouns-5mi-0-5d1409f.json', function(data){
    var svg = d3.select('body')
        .append('svg:svg')
        .attr('width', size.width)
        .attr('height', size.height)
        .append("svg:g")
        .classed('container', true)
        .attr('transform', 'translate('+padding.left+','+padding.top+')');

    display(svg, data);

    d3.select('body').on('click', function(){ display(svg, data); });
});


function clickCircle(d){
    event.stopImmediatePropagation();
    display(d3.select('g.container'), d);
}


function display(svg, root){

    var nodes = tree.nodes(root),
        links = tree.links(nodes);

    var link = d3.svg.diagonal()
        .projection(function(d){ return [d.x, d.y]});   // vertical

//    var bindLinks = function(links){
        var path = svg.selectAll('path.link').data(links);
        path.exit().remove();
        path.enter().append('svg:path');
        path.classed('link', true)
            .attr('d', link);
//    };

//    var bindNodes = function(nodes){
        var nodeGroup = svg.selectAll('g.node').data(nodes);
        nodeGroup.exit().remove();
        nodeGroup.enter()
            .append('svg:g')
            .classed('node', true)
            .append('svg:circle')
            .classed('node-dot', true)
            .append('title');
        nodeGroup.attr("transform", function(d){
            return "translate(" + d.x + "," + d.y + ")";
        });
        var circles = nodeGroup.select('circle.node-dot')
            .attr('r', options.nodeRadius)
            .on('click', clickCircle);
        circles.select('title')
            .text(function(d){ return d.key+'\n'+d.value });

//    };

    // creates/updates links and nodes
//    bindLinks(links);
//    bindNodes(nodes);

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


/*Drawing of cuts. Need to draw them after all cut files are loaded. Uses queue.js.

 var cutFiles = ['cut-nouns-100k-0-5d1409f.txt', 'cut-nouns-500k-0-5d1409f.txt', 'cut-nouns-5mi-0-5d1409f.txt'];
 var q = queue(cutFiles.length);

 // an array of tasks that will load the files
 var tasks = cutFiles.map(function(f){
 return function(callback){
 d3.json(f, callback);
 };
 });

 // loads the files in parallel
 tasks.forEach(function(t) { q.defer(t); });
 q.awaitAll(function(error, cuts) {
 var colors = ['red', 'orange', 'pink'];

 // replaces the ids by the actual nodes they refer to
 cuts = cuts.map(function(cut){
 return nodes.filter(function(n){return cut.indexOf(n.id)>-1;});
 });

 // draws a polyline for each cut
 svg.selectAll('path.cut')
 .data(cuts)
 .enter()
 .append('svg:path')
 .classed('cut', true)
 .attr('d', function(d){
 var line = d3.svg.line();
 return line(d.map(function(node){
 return [node.x, node.y];
 }));
 })
 .style('stroke', function(d,i){return colors[i];});*//**//*
 });*/