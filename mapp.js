(function ($scope, d3, topojson, undefined) {
    /*
    var currenthoja, displayImages, hoja;
  
    hoja = $('#guirnalda').find('path');
  
    currenthoja = 0;
  
    (displayImages = function () {
      return hoja.eq(currenthoja++).fadeIn(20, displayImages);
    })();
    const height = width * 5/8;
  */
    'use strict'
    var Chart = {};
    var width = 2000;

    var height = 1200;
    
    var domparse = new DOMParser;
    var mydom = domparse.parseFromString("<svg></svg>", "text/html");
    var container = mydom.getElementsByTagName("svg")[0];
    var DOM = d3.selectAll([container]);
    var configs={};

    //.translate([innerWidth/2 , innerHeight/])
    //.scale(300);

    

    function drawmap(world) {
        var world=world;
        
        let color = function (value) { 
            let cf=d3.scaleLog().domain([1, 1600]).range([1,0]);
            return value>0?d3.interpolateRdGy(cf(value)):0;
        }
        width=innerWidth;
        height=innerHeight;
         var projection=d3.geoMercator().scale([width/(2.5*Math.PI)]).translate([width/2,height/2]).precision(0.01);
        var path = d3.geoPath().projection(projection);
        function center(d){
           let dx=d3.geoCentroid(d)[0];
            let dy=d3.geoCentroid(d)[1];
            return projection([dx,dy]);
        }
        var radiusScale = d3.scaleQuantize().domain([1, 1500]).range([5,15,40,60]);
        var rscale=function(value){
            return value==0?0:radiusScale(value);
        }
        //  let g = painter.append("g")

        const svg = d3.create("svg")
        .attr("viewBox","0 0 2000 1200")
        .attr("id","Mapsvg");
  
       
         /** Awesome tooltip idea from Eric Porter https://codepen.io/EricPorter/pen/xdJLaG?editors=1000*/ 
        function msg(ctr,rec){
            return"<div class='tooltipcontent'><li><span>Country : "+ctr+"</span></li><li><span>Records : "+rec+"</span></li></div>";
        }
       
        //outline group
       

        const g = svg.append('g')
            .attr('class', 'map')
            .attr("clip-path","url(#map-glowclip)")
            .attr("fill","url(#map-gradient)")
            .attr("id","Map-outlayer");
        const outline=g.append("path")
            .datum(topojson.mesh(world, world.objects.countries, (a, b) => a !== b))
            .attr("stroke", "white")
            .attr("stroke-linejoin", "round")
            .attr("id","countryoutline")
            .attr("stroke-width",2)
            .attr("d", path);
     
       const cg= svg.append("g")
            .attr("class", "countries-layer")
            .selectAll("path")
            .data(Feature)
            .enter()
            .append("g")
            .attr("class","countryg requiretooltip")
            .attr("id",d=>d.id)
            .attr("message",d=>msg(d.name,d.nrecord));

        
            
        const cp=cg
            .append("path")
            .attr("fill", d => color(d.nrecord))
            .attr("fill-opacity",0.6)
            .attr("stroke", "white")
            .attr("stroke-linejoin", "round")
            .attr("stroke-width",2)
            .attr("d", path)
            .attr("class","countryborder")
            .attr("id",d=>d.id)
            .attr("name",d=>CodeMap.get(d.id));
   
      
        //bind the results
        const cirg=svg.append("g").attr("class","circle-layer")
        .selectAll("circle-wrapper")
        .data(Feature)
        .enter()
        .append("g");

        cirg.append("circle")
            .attr("class","pins glow-pins")
            .attr("cx",d=> center(d)[0])
            .attr("cy",d=> center(d)[1])
            .attr("r", d=>rscale(d.nrecord))
            .attr("fill","red")
            .attr("fill-opacity",0.6)
            .attr("records",d=>rscale(d.nrecord));
        
        cirg
            .append("circle")
            .attr("class","pins solid-pins")
            .attr("cx",d=> center(d)[0])
            .attr("cy",d=> center(d)[1])
            .attr("r", d=>rscale(d.nrecord))
            .attr("fill", "red")
            .attr("fill-opacity",0.6)
            .attr("records",d=>rscale(d.nrecord));
        return svg.node();


    }




    //pinponit the countries

    function pins(countries) {
       const svg=d3.create("svg");
       const g=svg.append('g').attr('class', 'countries');
        var projection= d3.geoMercator().translate([width / 2.1, height / 2.4]).scale(300);
        
       const circles= g.append("g")
       .attr("id","cpoints")
               .selectAll("circle")
			    .data(countries)
			       .enter()
			       .append("circle")
			       .attr("cx", function(d) { return projection([d["1"]["1"], d["1"]["2"]])[0];})
			       .attr("cy", function(d) {return projection([d["1"]["1"], d["1"]["2"]])[1];})
			       .attr("r", 5)
			       .attr("fill", "red")
                   .attr("opacity", 0.6);
       
        return g.node();
    
    }
  

    
/*
var zoom = d3.behavior.zoom()
    .on("zoom",function() {
        g.attr("transform","translate("+ 
            d3.event.translate.join(",")+")scale("+d3.event.scale+")");
        g.selectAll("path")  
            .attr("d", path.projection(projection)); 
  });
svg.call(zoom);


    }


   */ 

    Chart.draw = drawmap;
 
    Chart.container = container;
    Chart.configs=configs;
    Chart.makepins=pins;
    $scope.Mapchart = Chart;
  


})(window, d3, topojson);

