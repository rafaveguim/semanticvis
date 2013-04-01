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

console.log(size.width);

d3.json('tree-nouns-100k-1b40de1eae.json', function(data){
    var tree = d3.layout.tree()
        .sort(null)
        /*.size([size.height-padding.top, 
                size.width - padding.left - options.nodeRadius - options.maxLabelLength*options.fontSize])*/ // horizontal
        .size([size.width - padding.left - options.nodeRadius,
            size.height-padding.top]) // vertical
        .children(function(d){
            return (d.children === 0) ? null : d.children;
        });

    var nodes = tree.nodes(data),
        links = tree.links(nodes);

    /* data mapping */
//    var nodeRadius = d3.scale().linear()
//              .domain(d3.extent(nodes.map(function(d){
//                return d.children == null ? 0 : d.children.length;
//              })))
//              .range([0,10]);


    var svg = d3.select('body')
                .append('svg:svg')
                .attr('width', size.width)
                .attr('height', size.height)
                .append("svg:g")
                .classed('container', true)
                .attr('transform', 'translate('+padding.left+','+padding.top+')');

    var link = d3.svg.diagonal()
                //.projection(function(d){ return [d.y, d.x]}); // horizontal
                .projection(function(d){ return [d.x, d.y]});   // vertical

    svg.selectAll('path.link')
        .data(links)
        .enter()
        .append('svg:path')
        .classed('link', true)
        .attr('d', link);

    var nodeGroup = svg.selectAll('g.node')
                        .data(nodes)
                        .enter()
                        .append('svg:g')
                        .classed('node', true)
                        .attr("transform", function(d){
                            //return "translate(" + d.y + "," + d.x + ")"; // horizontal
                            return "translate(" + d.x + "," + d.y + ")"; // vertical
                        });

    nodeGroup.append('svg:circle')
        .classed('node-dot', true)
        .attr('r', options.nodeRadius)
        .append('title')
        .text(function(d){return d.key});

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
});
