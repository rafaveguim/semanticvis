/**
 * Created with JetBrains WebStorm.
 * User: 100457636
 * Date: 16/11/12
 * Time: 11:46 AM
 * To change this template use File | Settings | File Templates.
 */

var margin = {top: 0, right: 10, bottom: 10, left: 10},
    width = 1300 - margin.left - margin.right,
    height = 700 - margin.top - margin.bottom;

var color = d3.scale.category20c();



d3.json("0_100000.json", function(root) {

    var treemap = d3.layout.treemap()
        .size([width, height])
        .sticky(true)
        .value(function(d) { return d.value; });

    var div = d3.select("body").append("div")
        .style("position", "relative")
        .style("width", (width + margin.left + margin.right) + "px")
        .style("height", (height + margin.top + margin.bottom) + "px")
        .style("left", margin.left + "px")
        .style("top", margin.top + "px");

    var node = div.datum(root).selectAll(".node")
        .data(treemap.nodes)
        .enter().append("div")
        .attr("class", "node")
        .call(position)
        .style("background", function(d) { return d.children ? color(d.key) : null; })
        .text(function(d) { return d.key; });

    d3.selectAll("input").on("change", function change() {
        var value = this.value === "count"
            ? function() { return 1; }
            : function(d) { return d.value; };

        node.data(treemap.value(value).nodes)
            .transition()
            .duration(1500)
            .call(position);
    });
});

function position() {
    this.style("left", function(d) { return d.x + "px"; })
        .style("top", function(d) { return d.y + "px"; })
        .style("width", function(d) { return Math.max(0, d.dx - 1) + "px"; })
        .style("height", function(d) { return Math.max(0, d.dy - 1) + "px"; });
}