
//setup the in-browser database to save the uploaded flow stress data and saved fitted parameters
var pouchdb = new PouchDB('flowstress')
pouchdb.info().then(function (info) {
  console.log(info);
})


$(document).ready(function(){
        getAllTests()

})



function getAllTests(){

    pouchdb.allDocs({
                include_docs : true
            })
            .then(function(result){
                console.log(result)
                var data = [];
                for(var i=0; i<result.rows.length;i++){
                    var test = result.rows[i].doc
                    data.push(test)

                }

                var samples = d3.map( data, function(d){ return d.sample.name.user_defined }).keys()
                var materials = d3.map( data, function(d){ return d.sample.material }).keys()
                var strainrates = d3.map( data, function(d){ return +d.strainrate }).keys()
                var temperatures = d3.map( data, function(d){ return +d.temperature }).keys()

                nv.addGraph(function() {
                  var chart = nv.models.scatterChart()
                                .showDistX(true)
                                .showDistY(true)

                  //Configure how the tooltip looks.


                  //Axis settings
                  chart.xAxis.tickFormat(d3.format('.02f'));
                  chart.yAxis.tickFormat(d3.format('.0f'));

                 


                  d3.select('#choiceGraph')
                      .datum(data)
                      .call(chart);

                  nv.utils.windowResize(chart.update);

                  return chart;
                });





            }).catch(
                    console.log("Couldn't retrieve data from the database")
            )

}
