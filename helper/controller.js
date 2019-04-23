/**
 *
 */
function hide(selector) {
  selector.classed("hidden", true);
  selector.classed("reveal", false);
}
function show(selector) {
  selector.classed("reveal", true);
  selector.classed("hidden", false);
}

var width = 900;
var height = 720;
var margin = {
  top: 0,
  left: 20,
  bottom: 30,
  right: 10
};

// recoshowrding plots indexes

var mapdata = World;
var bardata = TerroristData.slice(1, 10);
var connectiondata = ConnectionData;
var pointsdata = PointsData.slice(0, 10);
var areaData = ClaimsData;
var routedata = d3
  .nest()
  .key(function(d) {
    return [d.Corigin, d.Cdest];
  })
  .rollup(function(leaves) {
    return { value: leaves.length, start: leaves[0].start, end: leaves[0].end };
  })
  .entries(connectiondata);

var minColor = "#f0f0f0",
  maxColor = "rgb(8, 48, 107)";
let mapcolor = function(value) {
  let cf = d3
    .scaleLog()
    .domain([1, 1600])
    .range([1, 0]);
  return value > 0 ? d3.interpolateRdGy(cf(value)) : 0;
};
function mapmsg(ctr, rec) {
  return (
    "<div class='tooltipcontent'><li><span>areaData : " +
    ctr +
    "</span></li><li><span>Records : " +
    rec +
    "</span></li></div>"
  );
}
var projection = d3
  .geoMercator()
  .scale([width / (2 * Math.PI)])
  .translate([width / 2, height / 1.5])
  .precision(0.01);
var path = d3.geoPath().projection(projection);

var scrollVis = function() {
  // constants to define the size
  // and margins of the vis area.

  /**
   * start drawing barchart
   * for displaying top
   * terriost organization
   *
   */
  var lastIndex = -1;
  var activeIndex = 0;

  // Sizing for the Map visualization
  var mapSize = 6;
  var mapPad = 2;

  // initiate svg
  var svg = null;

  // initiate g
  var g = null;

  var xareasScale = d3
    .scaleLinear()
    .domain([0, 30])
    .range([0, width - 20]);
  var yareasScale = d3.scaleLinear().range([height, 0]);
  var coughColorScale = d3
    .scaleLinear()
    .domain([0, 1.0])
    .range(["#008080", "red"]);
  var Barwidth = d3
    .scaleLinear()
    .domain([0, d3.max(bardata, d => d.value)])
    .range([0, width]);
  var xAxisBar = d3.axisBottom().scale(Barwidth);
  var xAxisareas = d3
    .axisBottom()
    .scale(xareasScale)
    .tickFormat(function(d) {
      return d + " min";
    });

  var activateFunctions = [];

  var updateFunctions = [];
  // create svg and give it a width and height

  /**
   * chart
   *
   * @param selection - the current d3 selection(s)
   *  to draw the visualization in. For this
   *  example, we will be drawing it in #vis
   */
  var chart = function(selection) {
    selection.each(function(start = true) {
      svg = d3
        .select(this)
        .selectAll("svg")
        .data([mapdata]);
      var svgE = svg.enter().append("svg");
      // combine enter and existing selection
      svg = svg.merge(svgE);

      svg.attr("width", width + margin.left + margin.right);
      svg.attr("height", height + margin.top + margin.bottom);

      svg.append("g");

      // this group element will be used to contain all
      // other elements.
      g = svg
        .select("g")
        .attr("class", "major group")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      // perform some preprocessing on raw data

      // set the bar scale's domain
      var countMax = d3.max(bardata, function(d) {
        return d.value;
      });
      Barwidth.domain([0, countMax]);

      // get aggregated areasogram data

      // set areasogram's domain
      var areasMax = d3.max(areaData, function(d) {
        return d.value;
      });
      yareasScale.domain([0, areasMax]);

      setupVis(mapdata, connectiondata, pointsdata, bardata, areaData);

      setupSections(mapdata, connectiondata, pointsdata, bardata, areaData);
    });
  };

  /**
   * @param mapdata - geofeatures for drawing maps
   * @param g - d3-selection,place holder for maps
   */

  function drawmap() {
    //clearing all remaining elements

    /** Awesome tooltip idea from Eric Porter https://codepen.io/EricPorter/pen/xdJLaG?editors=1000*/
    d3.select(".inner-layer")
      .append("path")
      .datum(topojson.mesh(World, World.objects.countries, (a, b) => a !== b))
      .attr("d", path)
      .attr("class", "map border")
      .attr("stroke", "white")
      .attr("stroke-width", 2);
    var selection2 = d3
      .select(".countries-layer")
      .selectAll(".map.countries.requiretooltip")
      .data(Feature)
      .attr("message", d => mapmsg(d.name, d.nrecord));

    selection2
      .enter()
      .append("g")
      .attr("message", d => mapmsg(d.name, d.nrecord))
      .attr("class", "map countries requiretooltip")
      .append("path")
      .attr("id", d => d.id)
      .attr("d", path)
      .attr("fill", d => mapcolor(d.nrecord))
      .attr("fill-opacity", 1)
      .attr("stroke-width", 2)
      .attr("opacity", 1);
  }

  function updatepoints() {
    const g = d3.select(".Points-layer");

    const ge = g.selectAll(".points.Points-layer").data(pointsdata);

    ge.enter()
      .append("use")
      .join(ge)
      .attr("class", "points Points-layer")
      .attr("id", d => d.feature.name)
      .attr("x", d => projection([d.coordinates[0], d.coordinates[1]])[0] - 19)
      .attr("y", d => projection([d.coordinates[0], d.coordinates[1]])[1] - 40)
      .attr("xlink:href", "#pinpoints")
      .attr("fill", "blue")
      .attr("opacity", 1)
      .attr("fill-opacity", 1);

    // Exit selection: Remove elements without data from the DOM
  }

  function drawconnection() {
    var links = [];
    for (var i = 0, len = routedata.length; i < len; i++) {
      links.push({
        type: "LineString",
        coordinates: [
          [routedata[i].value.start[0], routedata[i].value.start[1]],
          [routedata[i].value.end[0], routedata[i].value.end[1]]
        ]
      });
    }

    // Standard enter / update
    var pathArcs = d3
      .select(".Connections-layer")
      .selectAll(".routes.Connections-layer")
      .data(links)
      .attr("d", path)
      .attr("stroke", "white")
      .attr("stroke-width", 2);

    //enter
    pathArcs
      .enter()
      .append("path")
      .attr("class", "arc routes Connections-layer")
      .attr("d", path)
      .attr("stroke", "white")
      .attr("stroke-width", 2)
      .attr("fill", "none")
      .attr("opacity", 1);
  }

  function drawIntro() {
    var selection = d3
      .select(".Intro-layer")
      .selectAll(".Intro-layer.texts")
      .data(["hello"]);

    selection
      .enter()
      .append("p")
      .attr("class", "Intro-layer texts")
      .text(d => d[0])
      .attr("opacity", 0)
      .transition()
      .duration(100)
      .ease(d3.easeLinear)
      .attr("opacity", 1);

    // Exit selection: Remove elements without data from the DOM

    selection.exit().remove();
  }

  function drawbar() {
    var margin = 100;
    var xscale = d3
        .scaleLinear()
        .domain([0, d3.max(bardata, d => d.value)])
        .range([0, width - margin]),
      yscale = d3
        .scaleBand()
        .domain(d3.range(bardata.length))
        .range([margin, height - margin])
        .round(true)
        .paddingInner(3);
    var Barheight = (height - 70) / bardata.length;
    var g = d3
      .select(".Bar-layer")
      .selectAll(".terrorist-bars.Bar-layer")
      .data(bardata);

    var yaxis = d3
      .select(".Bar-layer")
      .selectAll(".y.bar-axis Bar-layer")
      .data(bardata);
    yaxis
      .enter()
      .append("g")
      .attr("transform", (d, i) => {
        return (
          "translate(" + `${margin + 400}` + "," + `${yscale(i) - 50}` + ")"
        );
      })
      .attr("class", "y bar-axis Bar-layer")
      .attr("text-anchor", "start")
      .append("text")
      .text(d => d.key);

    g.enter()
      .append("rect")
      .attr("class", "terrorist-bars Bar-layer")
      .attr("x", -10)
      .attr("y", (d, i) => yscale(i) - 40)
      .attr("height", Barheight - 30)
      .attr("width", d => xscale(d.value));
  }

  /**
   * setupVis - creates initial elements for all
   * sections of the visualization.
   *
   * @param mapdata - data
   * @param {Array.<Object>} bardata - summarize top terriost,
   *  array of objects with properties [gname,counts]
   * @param {Array.<Array>} areaData - Array with length 1 include filtered data
   */
  var setupVis = function (
    mapdata,
    connectiondata,
    pointsdata,
    bardata,
    areaData
  ) {
    // axis
    g.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxisBar);

    g.append("g").attr("class", " hidden section-Intro Intro-layer");
    //create new group for maps
    g.append("g").attr("class", " section-map Map-layer");
    const MAPG = d3.select(".Map-layer");
    MAPG.append("g")
      .attr("class", "Map-layer map")
      .attr("id", "Map-outlayer")
      .append("g")
      .attr("class", "map inner-layer hidden");

    d3.select(".map.inner-layer")
      .append("g")
      .attr("class", "map countries-layer");
    d3.select(".map.inner-layer")
      .append("g")
      .attr("class", "map Points-layer hidden");
    d3.select(".map.inner-layer")
      .append("g")
      .attr("class", "map Connections-layer hidden");

    //
    g.append("g").attr("class", "section-terrorist Bar-layer hidden");
    g.append("g").attr("class", "section-area Area-layer hidden");
    g.append("g").attr("class", "section-area Detail-layer hidden");

    /**
     *
     * @param areaData - datas for drawing bars
     * @param g - datas for drawing bars
     */
    function drawarea(data = Dnation("4")) {
    
      var data = Array(3);
      rdata = d3.nest().entries(areaData);
      newdata = d3
        .nest()
        .key(function (d) {
          return d.fdate;
        })
        .rollup(function (leaves) {
          return {
            nkill: d3.sum(leaves, function (l) {
              return Math.max(+l.nkill, 0);
            }),
            nhost: d3.sum(leaves, function (l) {
              return Math.max(+l.nhostkid, 0);
            }),
            nwound: d3.sum(leaves, function (l) {
              return Math.max(+l.nwound, 0);
            })
          };
        })
        .entries(rdata);
      data[0] = {
        key: "nkill",
        value: d3.sum(newdata, function (e) {
          return e.value.nkill;
        })
      };
      data[1] = {
        key: "hostkip",
        value: d3.sum(newdata, function (e) {
          return e.value.nhostkid;
        })
      };
      data[2] = {
        key: "wound",
        value: d3.sum(newdata, function (e) {
          return e.value.nwound;
        })
      };

      const maxVlue = d3.sum(data, d => d.value);
      var margin = { top: 10, left: 10, right: 10, bottom: 10 };
      var config = {
        width: 300,
        height: 300,
        levels: 5,
        labelFactor: 1.25,
        opacity: 0.5,
        dotRadius: 7,
        circlecolor: "blue",
        strokeWidth: 2,
        format: d3.format(".0%"),
        color: d3.scaleOrdinal(d3.schemeCategory10)
      };
      var types = data.map(d => d.key),
        total = types.length,
        radius = Math.min(
          -margin.left + config.width / 2,
          -margin.top + config.height / 2
        ),
        Format = d3.format(config.format),
        angleSlice = (Math.PI * 2) / 3;

      var svg = d3
        .select(".Area-layer")
        .attr("height", config.height)
        .attr("width", config.width);
      var filter = svg
        .append("defs")
        .append("filter")
        .attr("id", "glow"),
        feGaussianBlur = filter
          .append("feGaussianBlur")
          .attr("stdDeviation", "2.5")
          .attr("result", "coloredBlur"),
        feMerge = filter.append("feMerge"),
        feMergeNode_1 = feMerge.append("feMergeNode").attr("in", "coloredBlur"),
        feMergeNode_2 = feMerge.append("feMergeNode").attr("in", "SourceGraphic");
      let parseTime = d3.timeParse("%b,%Y");

      var circleaxis = svg
        .append("g")
        .attr("class", "radaraxis")
        .attr("transform", "translate(" + 0 + "," + 0 + ")");

      circleaxis
        .selectAll(".levels")
        .data(d3.range(5))
        .enter()
        .append("circle")
        .attr("class", "innerCircle")
        .attr("cx", config.width / 2 + margin.left)
        .attr("cy", config.height / 2 + margin.top)
        .attr("r", function (d, i) {
          return ((i + 1) * radius) / 5;
        })
        .attr("stroke", "blue")
        .attr("fill", "none")
        .attr("fill-opacity", 0.2)
        .attr("stroke-opacity", 0.5)
        .attr("filter", "url(#glow)");

      circleaxis
        .selectAll(".axisLabel")
        .data(d3.range(5))
        .enter()
        .append("text")
        .attr("class", "axisLabel")
        .attr(
          "transform",
          "translate(" +
          (margin.left + config.width / 2) +
          "," +
          (margin.top + config.width / 2) +
          ")"
        )
        .attr("x", margin.left)
        .attr("y", d => -margin.top - (d * radius) / 5)
        .attr("dy", "0.4em")
        .style("font-size", "10px")
        .attr("fill", "#737373")
        .text(function (d) {
          return d == 0 ? "" : config.format(d / 4);
        });

      var Areaaxis = svg
        .append("g")
        .attr("class", "ray axis")
        .attr(
          "transform",
          "translate(" +
          (margin.left + config.width / 2) +
          "," +
          (margin.top + config.width / 2) +
          ")"
        )
        .selectAll("g")
        .data(d3.range(0, 360, 120))
        .enter()
        .append("g")
        .attr("transform", function (d) {
          return "rotate(" + `${0}` + ")";
        });

      Areaaxis.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", (d, i) => 0 + radius * Math.sin(angleSlice * (i + 1)))
        .attr("y2", (d, i) => 0 + radius * Math.cos(angleSlice * (i + 1)))
        .attr("stroke", "black");

      Areaaxis.append("text")
        .attr("dominant-baseline", "central")
        .attr("x", (d, i) => 0 + radius * Math.sin(angleSlice * (i + 1)))
        .attr("y", (d, i) => 0 + radius * Math.cos(angleSlice * (i + 1)))
        .attr("text-anchor", "middle")
        .text(function (d, i) {
          return ["Killed", "Hostages", "Wounded"][i];
        });
      //Append the lines

      angleSlice = (Math.PI * 2) / 3;

      let rscale = d3
        .scaleLinear()
        .domain([0, maxVlue])
        .range([0, config.width / 2]);
      const rline = d3
        .lineRadial()
        .radius(function (d) {
          return rscale(d.value);
        })
        .angle(function (d, i) {
          return Math.PI / 3 + (i + 1) * angleSlice;
        });

      let msg = data.map(function (e) {
        return "<li>" + e.key + " : " + e.value + "</li>";
      });

      const ra = svg
        .append("g")
        .attr("class", "radar-area")
        .attr(
          "transform",
          "translate(" +
          (config.width / 2 + margin.left) +
          "," +
          (margin.top + config.height / 2) +
          ")"
        );
      ra.selectAll("path")
        .data([data])
        .enter()
        .append("path")
        .attr("class", "radarArea requiretooltip")
        .attr(
          "transform",
          "translate(" +
          (margin.left + config.width / 2) +
          "," +
          (margin.top + config.height / 2) +
          ")"
        )
        .attr("d", rline(data))
        .attr("fill", "red")
        .attr("transform", function (d, i) {
          return "rotate(" + `${0}` + ")";
        })
        .attr("opacity", 0.2)
        .attr("stroke", "black")
        .attr("stroke-width", 2)
        .attr("message", msg);
    }
  
  
   
    
      
   
    function barsgroup(data) {
      function prepareBD(Country) {
        formattime = d3.timeFormat("%b,%Y");
        let parseTime = d3.timeParse("%b,%Y");
        let parseYear = d3.timeParse("%Y");
        let crs = crossfilter(Country);
        let Ddate = crs.dimension(function(d) {
          return d.fdate;
        });
        let Dyear = crs.dimension(function(d) {
          return d.year;
        });
        groupbyyear = Dyear.group().all();
        let newdataate = d3.nest().key(function(d) {
          return d.fdate;
        });
        let readydata = newdataate.entries(Ddate.top(Infinity));

        let g1data = readydata.map(function(e) {
          e.counts = 0;
          e.countf = 0;
          e.values.forEach(function(l) {
            if (l.success == "Yes") {
              e.counts = e.counts + 1;
            } else if (l.success == "NO") {
              e.countf = e.countf + 1;
            }
          });

          return e;
        });
        g1data.forEach(element => {
          element.key = parseTime(element.key);
        });

        //sort date anewdata parse

        return [groupbyyear, g1data];
      }

      data = prepareBD(data);

      const data1 = data[0];
      const data2 = data[1];
      let margin = {
          top: 30,
          right: 20,
          bottom: 20,
          left: 20
        },
        offset = {
          top: 330,
          bottom: 330
        },
        width = 900,
        gap = 160,
        height = 800,
        BG = {};
      const parseTime = d3.timeParse("%b,%Y");
      const parseYear = d3.timeParse("%Y");
      let Brush = d3
        .brushX()
        .extent([[0, 0], [width, height]])
        .handleSize(8);

      let mgb = d3
        .select(".msg")
        .append("p")
        .attr("class", "title a")
        .text("message");

      var X1 = d3.scaleTime().range([0, width]),
        Y = d3
          .scaleLinear()
          .range([height - offset.top - offset.bottom - margin.bottom, 0]),
        XAxis = d3.axisBottom(X1),
        YAxis = d3.axisLeft(Y);
      pathx = d3
        .area()
        .curve(d3.curveMonotoneX)
        .x(function(d) {
          return X1(parseYear(d.key));
        })
        .y0(height - offset.top - offset.bottom - margin.bottom)
        .y1(function(d) {
          return Y(d.value);
        });

      let xb = d3
        .scaleTime()
        .range([0, width])
        .nice();

      let yTcale = d3.scaleLinear().range([offset.top, margin.top]);
      let yBcale = d3.scaleLinear().range([offset.bottom, margin.bottom]);

      const svg = d3
        .select(".Detail-layer")
        .attr("transform", `translate( 100 , ${margin.top})`);

      const central = svg
        .append("g")
        .attr("class", "central")
        .attr("transform", "translate(" + 0 + "," + margin.top + ")");
      central
        .append("g")
        .append("defs")
        .append("clipPath")
        .attr("id", "Clip")
        .append("rect")
        .attr("width", width)
        .attr("fill", "grey")
        .attr("height", gap - margin.top - margin.bottom / 2)
        .attr("x", 0)
        .attr("y", offset.bottom - margin.bottom);

      X1.domain(
        d3.extent(data1, function(d) {
          return parseYear(d.key);
        })
      );
      Y.domain([
        0,
        d3.max(data1, function(d) {
          return d.value;
        })
      ]);

      //data involve

      central
        .append("g")
        .attr("class", "central axis axis--x")
        .attr(
          "transform",
          "translate(" +
            margin.right / 2 +
            "," +
            `${height - offset.bottom - margin.bottom - margin.bottom}` +
            ")"
        )
        .call(XAxis);

      central
        .append("g")
        .attr("class", "central axis axis--y")
        .attr(
          "transform",
          "translate(" + 0 + "," + `${offset.bottom - margin.bottom-10}` + ")"
        )
        .call(YAxis);

      central
        .append("g")
        .attr("class", "area layer")
        .attr(
          "transform",
          "translate(" + 0 + "," + `${offset.bottom - margin.bottom}` + ")"
        )
        .append("path")
        .datum(data1)
        .attr("d", pathx);

      central
        .append("g")
        .attr("class", "central brush")
        .attr("clip-path", "url(#Clip)")
        .call(Brush)
        .call(Brush.move, [0, width]);

      yTcale.domain(d3.extent(data2.map(d => d.counts))).clamp(true);
      yBcale.domain(d3.extent(data2.map(d => d.countf))).clamp(true);

      svg.append("g").attr("class", "uplayer");
      const upgroup = d3.select(".uplayer");
      svg
        .append("g")
        .attr("class", "downlayer")
        .attr(
          "transform",
          "translate(" +
            0 +
            "," +
            `${margin.bottom + gap - margin.top}` +
            ")"
        );
      const downgroup = d3.select(".downlayer");

      BG.updatebars = function(data, barwidth) {
        const bars = upgroup.selectAll(".upbars").data(data, function(d) {
          return d;
        });
        bars.exit().remove();

        bars
          .enter()
          .append("rect")
          .join(bars)
          .attr("class", "upbars")
          .attr("x", (d, i) => xb(d.key))
          .attr("y", d => yTcale(d.counts))
          .attr("width", barwidth)
          .transition(trans)
          .attr("height", d => yTcale(0) - yTcale(d.counts));

        const upaxis = upgroup.selectAll(".xaxis--up").data([""]);
        upaxis.exit().remove();
        upaxis
          .enter()
          .append("g")
          .merge(upaxis)
          .attr("transform", "translate(" + 0 + "," + `${offset.top +10}`+ ")")
          .attr("class", "xaxis--up")
          .call(d3.axisBottom(xb));

        const bars2 = downgroup
          .selectAll(".downbars")
          .data(data, function(d) {
            return d;
          });
        bars2.exit().remove();

        bars2
          .enter()
          .append("rect")
          .join(bars2)
          .attr("class", "downbars")
          .attr("x", (d, i) => xb(d.key))
          .attr("y", d => yBcale(0))
          .attr("width", barwidth)
          .transition(trans)
          .attr("height", d => yBcale(0) - yBcale(d.countf));
      };

      xb.domain(d3.extent(data2.map(d => d.key)));
      let barwidth =
        (width - margin.right / 2) / xb.ticks(d3.timeMonth.every(1)).length;

      BG.updatebars(data2, barwidth);

      Brush.on("start", function() {
        mgb.text("start");
        extent = d3.event.selection;
        (transform1 = X1.invert(extent[0])),
          (transform2 = X1.invert(extent[1])),
          (t1 = d3.timeMonth.floor(transform1));
        t2 = d3.timeMonth.ceil(transform2);

        //
      });
      Brush.on("brush", function() {
        mgb.text("brushing");
        extent = d3.event.selection;
        (transform1 = X1.invert(extent[0])),
          (transform2 = X1.invert(extent[1])),
          (t1 = d3.timeMonth.floor(transform1));
        t2 = d3.timeMonth.ceil(transform2);
        xb.domain([t1, t2])
          .range([0, width])
          .clamp(true);
        stepwidth =
          (width - margin.right / 2) / d3.timeMonth.range(t1, t2, 1).length;
        barwidth = stepwidth < 1000 && stepwidth > 0 ? stepwidth : 0;
        BG.updatebars(data2, barwidth);
      });
      Brush.on("end", function() {});

      return BG;
    }

    

      
    

    //
    updatepoints();
    drawmap();

    drawconnection();
    drawbar();
  
    
    drawarea(Dnation("4"));

    barsgroup(Dnation("4"));
  }

  


  /**
   * setupSections - each section is activated
   * by a separate function. Here we associate
   * these functions to the sections based on
   * the section's index.
   *
   */
  var setupSections = function() {
    // activateFunctions are called each

    activateFunctions[0] = showIntro;
    activateFunctions[1] = showMap;
    activateFunctions[2] = showPoints;
    activateFunctions[3] = showPoints2;
    activateFunctions[4] = showConnect;
    activateFunctions[5] = showBar;
    activateFunctions[6] = showArea;
    activateFunctions[7] = showDetails;
    activateFunctions[8] = showFinal;

    // updateFunctions are called while
    // in a particular section to update
    // the scroll progress in that section.
    // Most sections do not need to be updated
    // for all scrolling and so are set to
    // no-op functions.
    for (var i = 0; i < 9; i++) {
      updateFunctions[i] = function() {};
    }
    updateFunctions[7] = updating;
  };

  /**
   * Control Flows
   *
   *
   */

  /**
   * showIntro - initial title
   *
   * hides: All the maps related item
   * (no previous step to hide)
   * shows: intro title
   *
   */
  function showIntro(backwards = false) {
    hideAxis()
    if (backwards) {
      d3.selectAll(".map.inner-layer").call(hide);
    } else {
      d3.selectAll(".intro-layer").call(show);
    }
  }

  /**
   * showMap - preparemap
   *
   * hides: intro title
   * hides: map Map
   * shows: filler count title
   *
   */

  function showMap(backwards = false) {
    hideAxis();
    if (backwards) {
      d3.selectAll(".Points-layer").call(hide);
      d3.selectAll(".map.inner-layer").call(show);
    } else {
      d3.selectAll(".intro-layer").call(hide);
      d3.selectAll(".map.inner-layer").call(show);
    }
  }

  /**
   * showPoints - show top countries on the map
   *
   * hides: barchart, text and axis
   * shows: map Map and highlighted
   * filler words. also ensures maps
   * are moved back to their place in the Map
   */
  function showPoints(backwards = false) {
    if (backwards) {
    } else {
      d3.selectAll(".Points-layer").call(show);
    }
  }
  function showPoints2(backwards = false) {
    if (backwards) {
      d3.selectAll(".Connections-layer").call(hide);
      d3.selectAll(".Points-layer").call(show);
    } else {
      d3.selectAll(".Points-layer").call(show);
    }
  }
  /**
   * showConnect -
   *
   * hides: map Map
   * hides: areasogram
   * shows: barchart
   *
   */
  function showConnect(backwards = false) {
    hideAxis();
    if (backwards) {
      d3.selectAll(".Bar-layer").call(hide);
      d3.selectAll(".map.inner-layer").call(show);
      d3.selectAll(".Connections-layer").call(show);
    } else {
      d3.selectAll(".Points-layer").call(hide);
      d3.selectAll(".Connections-layer").call(show);
    }
  }

  /**
   * showBar - shows the first part
   *  of the areasogram of filler words
   *
   * hides: barchart
   * hides: last half of areasogram
   * shows: first half of areasogram
   *
   */
  function showBar(backwards = false) {
    console.log("show bar");
    if (backwards) {
      d3.selectAll(".Area-layer").call(hide);
      d3.selectAll(".Bar-layer").call(show);
    } else {
      d3.selectAll(".map.inner-layer").call(hide);
      d3.selectAll(".Bar-layer").call(show);
    }
    showAxis(xAxisBar);
  }

  /**
   * showArea - show all countries
   *
   * hides: cough title and color
   * (previous step is also part of the
   *  areasogram, so we don't have to hide
   *  that)
   * shows: all areasogram bars
   *
   */
  function showArea(backwards = false) {
    if (backwards) {
      d3.selectAll(".Area-layer").call(show);
      d3.selectAll(".Detail-layer").call(hide);
    } else {
      d3.selectAll(".Area-layer").call(show);
      d3.selectAll(".Bar-layer").call(hide);
    }
    hideAxis();
  }
  /**
   * showDetails - Deatil page of each country
   */

  function showDetails(backwards = false) {
    if (backwards) {
      d3.selectAll(".Detail-layer").call(show);
    } else { 
 d3.selectAll(".Area-layer").call(hide);
 hideAxis();
     d3.selectAll(".Detail-layer").call(show);
    }
   
   
    
    
  }

  /**
   * showFinal
   *
   * hides: nothing
   * (previous and next sections are areasograms
   *  so we don't have to hide much here)
   * shows: areasogram
   *
   */
  function showFinal(backwards = false) {
    // ensure the axis to areasogram one
    
    d3.selectAll(".Detail-layer").call(hide);
    hideAxis();
  }

  /**
   * showAxis - helper function to
   * display particular xAxis
   *
   * @param axis - the axis to show
   *  (xAxisareas or xAxisBar)
   */
  function showAxis(axis) {
    g.select(".x.axis")
      .call(axis)
      .transition()
      .duration(500)
      .style("opacity", 1);
  }

  /**
   * hideAxis - helper function
   * to hide the axis
   *
   */
  function hideAxis() {
    g.select(".x.axis")
      .transition()
      .duration(500)
      .style("opacity", 0);
  }

  /**
   * UPDATE FUNCTIONS
   *
   * These will be called within a section
   * as the user scrolls through it.
   *
   * We use an immediate transition to
   * update visual elements based on
   * how far the user has scrolled
   *
   */

  /**
   * updating - increase/decrease
   *
   *
   * @param progress - 0.0 - 1.0 -
   *  how far user has scrolled in section
   */
  function updating(progress) {
    g.selectAll(".cough")
      .transition()
      .duration(0)
      .attr("opacity", progress);

    g.selectAll(".areas")
      .transition("cough")
      .duration(0)
      .style("fill", function(d) {
        return d.x0 >= 14 ? coughColorScale(progress) : "#008080";
      });
  }

  /**
   * activate -
   *
   * @param index - index of the activated section
   */
  chart.activate = function(index) {
    activeIndex = index;
    var sign = activeIndex - lastIndex < 0 ? -1 : 1;
    var scrolledSections = d3.range(lastIndex + sign, activeIndex + sign, sign);

    scrolledSections.forEach(function(i) {
      activateFunctions[i](sign < 0 ? true : false);
    });
    lastIndex = activeIndex;
  };

  /**
   * update
   *
   * @param index
   * @param progress
   */
  chart.update = function(index, progress) {
    updateFunctions[index](progress);
  };

  // return chart function
return chart;}


/**
 * display - called once data
 * has been loaded.
 * sets up the scroller and
 * displays the visualization.
 *
 * @param rawD - rawdata
 */
function display(rawD) {
  // create a new plot and
  // display it
  var plot = scrollVis();
  d3.select("#vis")
    .datum([rawD])
    .call(plot);

  // setup scroll functionality
  var scroll = scroller().container(d3.select("#graphic"));

  // pass in .step selection as the steps
  scroll(d3.selectAll(".step"));

  // setup event handling
  scroll.on("active", function(index) {
    d3.selectAll(".step")
      .style("opacity", function(d, i) {
        return i === index ? 1 : 0.5;
      })
      .classed("activate", function(d, i) {
        return i === index ? true : false;
      });
    d3.selectAll(".counter")
      .style("opacity", function(d, i) {
        return i === index ? 1 : 0.5;
      })
      .classed("activate", function(d, i) {
        return i === index ? true : false;
      });

    // activate current section
    plot.activate(index);
  });

  scroll.on("progress", function(index, progress) {
    plot.update(index, progress);
  });
}

// load data and display
display([]);
