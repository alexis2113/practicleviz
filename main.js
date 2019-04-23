//let Mapchart=window.Mapchart;
        
    
     
//let worldmap=Mapchart.draw(World)
//attach the return nodes;
//document.getElementById("baseMap").appendChild(worldmap);


    
   

    // var ex=barchart().dimension(Gyear).group(Gyear.group(d3.timeYear));

    var trans = d3.transition()
        .duration(303).ease(d3.easeLinear);
   

  /*  const clips = d3.select("svg")
        .append('g')
        .append("defs")
        .append("clipPath")
        .attr("id", "battery-clip");
 var Dsuicide = CRS.dimension(function (d) {
        return d.suicide;
    }); //
    var Dsuccess = CRS.dimension(function (d) {
        return d.success;
    }); //

    clips
        .append('g')
        .selectAll("rect")
        .data(d3.range(25).slice().reverse())
        .enter()
        .append('rect')
        .attr('transform', (d, i) => `translate(${40}, ${20+i * 23})`)
        .attr('width', 40)
        .attr('height', 19)
        .attr("rx", 3)
        .attr("ry", 3);*/

data=Dnation("4");
dashboard(data)
Rosechart(data)