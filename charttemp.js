(function () {
  
  

 
  var stateById = d3
    .nest()
    .key(function(d) {
      return d.country;
    })
    .entries(Cdata);
  var dataById = new Map(stateById.map(d => [d.key.padStart(3,"0"), d]));
  
  var dispatch = d3.dispatch("load", "Countrychange");
  var Country = NCODE.map(function(d) {
    return { key: d["country-code"], name: d["name"] };
  });
  // A drop-down menu for selecting a Country; uses the "menu" namespace.
  dispatch.on("load.menu", function () {
    
    var select = d3
      .select("#menu")
      .append("div")
      .append("select")
      .on("change", function () {
        
        dispatch.call("Countrychange", this,  dataById.get(this.value));
      });

    select
      .selectAll("option")
      .data(Country)//a map object 
      .enter()
      .append("option")
      .attr("value", function (d) {
        return d.key;
      })
      .text(function (d) {
        return d.name;
      });

    dispatch.on("Countrychange.menu", function (ky) {
      console.log(ky)
      select.property("value", CodeMap.get(ky));
    });
  });

  // A bar chart to show total population; uses the "bar" namespace.
  dispatch.on("load.bar", function (Country) {
    
    var margin = { top: 20, right: 20, bottom: 30, left: 40 },
      width = 80 - margin.left - margin.right,
      height = 460 - margin.top - margin.bottom;

    var y = d3
      .scaleLinear()
      .rangeRound([height, 0])
      .nice();

    var yAxis = d3.axisLeft(y).tickFormat(d3.format(".2s"));

    var svg = d3
      .select("#bar")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg
      .append("g")
      .attr("class", "y axis")
      .call(yAxis);

    var rect = svg
      .append("rect")
      .attr("x", 4)
      .attr("width", width - 4)
      .attr("y", height)
      .attr("height", 0)
      .style("fill", "#aaa");

    dispatch.on("Countrychange.bar", function (d, i) {
      console.log("changed", d)
      var bardata = REDUCE(d.values);
      
      y = y.domain(d3.extent(bardata, d => d.value));
      svg.selectAll("rect").data(bardata);
      svg
        .enter()
        .append("rect")
        .transition()
        .attr("y", y(d.value))
        .attr("height", y(0) - y(i));
    });
  });

  // A pie chart to show population by age group; uses the "pie" namespace.
  dispatch.on("load.pie", function (Country) {
    var width = 880,
      height = 460,
      radius = Math.min(width, height) / 2;

    var color = d3
      .scaleOrdinal()
      .domain(groups)
      .range([
        "#98abc5",
        "#8a89a6",
        "#7b6888",
        "#6b486b",
        "#a05d56",
        "#d0743c",
        "#ff8c00"
      ]);

    var arc = d3
      .arc()
      .outerRadius(radius - 10)
      .innerRadius(radius - 70);

    var pie = d3.pie().sort(null);

    var svg = d3
      .select("#pie")
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    var path = svg
      .selectAll("path")
      .data(groups)
      .enter()
      .append("path")
      .style("fill", color)
      .each(function () {
        this._current = { startAngle: 0, endAngle: 0 };
      });

    dispatch.on("Countrychange.pie", function (d) {
      path
        .data(
          pie.value(function (g) {
            console.log(g,d)
            return d[g];
          })(0)
        )
        .transition()
        .attrTween("d", function (d) {
          var interpolate = d3.interpolate(this._current, d);
          this._current = interpolate(0);
          return function (t) {
            return arc(interpolate(t));
          };
        });
    });
  });





/*
  dispatch.on("load.bargroup", function () { 

  })
  */
/*
 dispatch.on("load.raydar", 
  


  function mapwindow(update = false) {
      let update = update;
      let k = 0.8;
      const svg = d3.select("#mapwindow");
      const data = Feature;
      let path = svg
        .append("g")
        .selectAll("path")
        .data(data)
        .enter()
        .append("path")
        .attr("fill", (d, i) => color(i))
        .attr("d", d3.geoPath())
        .attr("transform", `translate(-5,-5)scale(.33)`);
      function updater(parent, callback) {
        let button = parent
          .append("g")
          .attr("class", "button")
          .attr("cursor", "pointer")
          .attr("transform", `translate(${width - 85},${0.5 * height - 10})`)
          .on("click", callback);
        button
          .append("rect")
          .attr("rx", 2)
          .attr("ry", 2)
          .attr("width", 70)
          .attr("height", 20)
          .attr("fill", "#fc0");
        let text = button
          .append("text")
          .attr("x", 8)
          .attr("y", 14)
          .attr("font-size", 12)
          .text("Interrupt");
      }

      if (update) {
        const d = data[Math.round(Math.random() * data.length)];
        const [x, y] = d3.geoPath().centroid(d);
        const [[x0, y0], [x1, y1]] = d3.geoPath().bounds(d);
        k = 0.8 * Math.min(height / (y1 - y0), width / (x1 - x0));
        path
          .transition()
          .duration(1500)
          .attr(
            "transform",
            `translate(165,100)scale(${k})translate(${-x},${-y})`
          );
      }
    }
*/
  function rosy(data, n = 12) {
      color = d3
        .scaleOrdinal()
        .domain(data.map(d => d.key))
        .range(
          d3.quantize(t => d3.interpolateSpectral(t * 0.8 + 0.1), n).reverse()
        );
      const width = window.innerWidth / 2;
      const height = window.innerHeight;
      let angles = d3
        .scaleBand()
        .domain([0, n])
        .range([0, 2 * Math.PI]);
      outerRadius = 400;
      innerRadius = 5;

      let outerScale = d3
        .scaleLinear()
        .range([innerRadius, outerRadius])
        .domain([0, d3.max(data, d => Math.sqrt(d.value))]);
      let labelArc = d3
        .arc()
        .innerRadius(innerRadius)
        .outerRadius(innerRadius + 20)
        .startAngle((d, i) => angles(i) - angles.bandwidth() / 2)
        .endAngle((d, i) => angles(i) + angles.bandwidth() / 2);
      const total = d3.sum(data, d => d.value);
      pct = function (d) {
        var pctFmt = d3.format(".1%");
        return pctFmt(d.value / total);
      };

      y = d3
        .scaleLinear()
        .domain([0, total])
        .range([0, outerRadius * 7]);

      x = d3
        .scaleBand()
        .domain(data.map(d => d.key))
        .range([0, 2 * Math.PI])
        .align(0);
      let arc = d3
        .arc()
        .innerRadius(innerRadius)
        .outerRadius(d => y(d.value))
        .startAngle(d => x(d.key))
        .endAngle(d => x(d.key) + x.bandwidth())
        .padAngle(0.15)
        .padRadius(innerRadius);

      let rose = d3
        .select("#rose")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2},${height / 2})`)
        .attr("width", width)
        .attr("height", height);
      let g = rose.append("g");

      g.selectAll("path")
        .data(data)
        .enter()
        .append("path")
        .attr("d", arc)
        .attr("fill", d => color(d.key))
        .attr("class", "rosechart")
        .attr("message", d => "<li>" + d.key + "</li><li>" + d.value + "</li>");
    }

  /*
var dashboard = {};
dashboard.draw = function(){

  // setup private variables
  var height, dispatcher;

  function my(group){
    group.each(function(d,i){
      // here is the code for creating brush
      // note `this` is also available (in addition to d and i), for e.g.
      var b = d3.select(this);

      console.log("inside my each "+height);
      if (dispatcher) {
        dispatcher.call("update");
      }
    });
  }

  my.move = function (group, position){
    console.log("moving");

    group.each(function(d,i){
      // here is the code for moving the brush
      // note `this` is also available (in addition to d and i), for e.g.
      var b = d3.select(this), that = this;

      console.log("inside move each");
      console.log(typeof(position));   // note it is function

      let pos = position.apply(that, arguments);
      console.log(pos);
      if (dispatcher) {
        dispatcher.call("test2");
      }
    })

    return my;
  }

  my.height = function(value){
    if(!arguments.length) return value;
    height = +value;
    return my;
  }

  my.dispatcher = function(value){
    if(!arguments.length) return dispatch ? true : false;
    dispatcher = value;
    return my;
  }

  return my;
};*/

/*
var orchestrator = d3.dispatch("update2", "test2");

orchestrator.on("update2", function(){
  console.log("update has been called!!!");
  
});

orchestrator.on("test2", function(){
  console.log("and now, test2 has also been called!!!");
  
});*/

// Okay, now use all that nice code

/*var data = [
  {id: 1, dt: DetailData[0]},
  {id: 2, dt: DetailData[1]},
  {id: 3, dt: DetailData[2]}
];
*/
// orchestrator sets the dispatch created during instantiantion
//var brush = dashboard.draw().height(90).dispatcher(orchestrator);
/*
var svg = d3.select("svg");

var g = svg.selectAll("g").data(data).enter()
  .append("g")
  .attr("transform", (d,i)=>"translate(0,"+i*100+")");

g.call(brush).call(brush.move, (d,i)=>d.dt);
  

  
  

  dispatch.call("load", this, dataById);
  
  dispatch.call("Countrychange", this, dataById.get("004"));

  //dispatch.call("Countrychange", this, Country.get("CA"));

  //dispatch.call("load", this, CodeMap);
  //dispatch.call("Countrychange", this, Dnation("4"));
  
  
  window.loadchart = dispatch;*/
  
window.barchart = barChart;
  window.Rosechart = rosy;
  window.heatmap = drawheat;
  window.raydar = raydar;
})();
