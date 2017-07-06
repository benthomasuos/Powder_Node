var allGraphDivs = $('.graphDiv');
var allControls = $('.controls');
var plotAllTests = $('#plotAll');
var currentTestTable = $('#currentTests');
var tableBody = currentTestTable.find("tbody")
var graph_LS = $('#graph_LS')
var graph_LS_Parent = $('#graph_LS_Parent');
var graph_TS = $('#graph_TS');
var graph_TS_Parent = $('#graph_TS_Parent')
var graph_VS = $('#graph_VS');
var graph_VS_Parent = $('#graph_VS_Parent')
var graph_SRS = $('#graph_SRS');
var graph_SRS_Parent = $('#graph_SRS_Parent')
var graph_SS = $('#graph_SS');
var graph_SS_Parent = $('#graph_SS_Parent')

var chart_LS = "";
var chart_TS = "";
var chart_VS = "";
var chart_SRS =  "";
var chart_SS = "";


var data = []


var NH_K_slider = $('#NH_K_slider');
var NH_n_slider = $('#NH_n_slider');
var NH_m_slider = $('#NH_m_slider');
var NH_beta_slider = $('#NH_beta_slider');
var NH_temps = $('#NH_temperature');
var NH_strainrates = $('#NH_strainrate');


//setup the in-memory database to save the uploaded flow stress data and saved fitted parameters


var pouchdb = new PouchDB('flowstress')
pouchdb.info().then(function (info) {
  console.log(info);
})




$(document).ready(function(){
    var tests_to_compare = window.location.href.split("?")[1].split('&')
    var testIDs = []
    for(var i=0; i<tests_to_compare.length;i++){
        testIDs.push( tests_to_compare[i].split('=')[1])
    }

    getTests(testIDs)
    //graph_LS_Parent.hide();
    //graph_TS_Parent.hide();
    //graph_VS_Parent.hide();
    //graph_SRS_Parent.hide();
    //graph_SS_Parent.hide();
    plotAllExpTests(testIDs)


    $('#const_Eq').on("change", function(){
        allControls.hide();
        var equations = $(this).find("option:selected");
        equations.each(function(){
            var equation = $(this).val();
            switch(equation){
                case "NH":
                    $('#NH_controls').show(200);
                break;
                case "JC":
                    $('#JC_controls').show(200);
                break;
                case "BB":
                    $('#BB_controls').show(200);
                break;
                default:
                    allControls.hide();
                break;
            }
        })

    })


    $(".fa-caret-up").on('click', function(){
        $(this).closest(".panel").find(".panel-body").toggle();
        $(this).toggleClass("fa-caret-up");
        $(this).toggleClass("fa-caret-down");
    })



    $("#NH_controls input[type='range']").on('input', function(){
        var value = $(this).val()
        $(this).siblings('.value').html( value )
        plotNHEq()
    })

    $("#NH_controls select").on('change', function(){
        plotNHEq()
    })

})



function getTests(testIDs){
    console.log(testIDs)
    tableBody.html("");

    for(var i=0;i<testIDs.length;i++){

        pouchdb.get( testIDs[i] ).then(function(doc){
                $('#test_status').hide()
                console.log(doc)
                tableBody.append("<tr name='"+ doc._id +"'><td>"+ doc._id  +"</td><td name='sample'>"+ doc.sample.name.user_defined +"</td><td name='temperature'>"+ doc.temperature +"</td><td name='strainrate'>"+ doc.strainrate +"</td><td>"+ doc.testdate +"</td></tr>")

            }).catch(function(err){
                        $('#test_status').show()
                        console.log("Couldn't retrieve data from the database")
            })

            tableBody.find("td").on("click", function(){
                        var row = $(this).closest('tr');
                        var test_id = row.attr("name");
                        var color = "#d33";
                        if(!row.hasClass("plotted")){
                            row.addClass("plotted");
                            plotSingleTest(test_id);
                        }
                        else{
                            row.removeClass("plotted")
                            removePlot(test_id);
                        }
                    })


    }




}


function removePlot(test_id){
    for(var i=0; i<allGraphs.raw.length;i++){
        var serie = allGraphs.raw[i].getSerie(test_id)
        console.log(serie)
        serie.kill()
        allGraphs.raw[i].redraw()
    }
}



function plotNHEq(){
    //graph.removeSeries()
    var ss_data = chart_SS.get("data")
    for(var i =0; i<ss_data.length;i++){
        if(ss_data[i].name.includes("NH -")){

                ss_data[i].remove()

            }
        }

    var strainrates = [];
    var temperatures = [];
    var strains = [];
    for(var i=0; i<100; i++){
        strains.push(i/100.0)
    }
    NH_strainrates.find('option:selected').each(function(item){
        strainrates.push( $(this).val() )
    })
    NH_temps.find('option:selected').each(function(item){
        temperatures.push( $(this).val() )
    })
    var traces = [];

    for(var i=0; i<temperatures.length; i++){
            for(var j=0; j<strainrates.length; j++){
                var data = [];
                for(var k=0; k<strains.length; k++){
                        var stress = NH_K_slider.val() * ( strains[k] ** NH_n_slider.val() ) * ( strainrates[j] ** NH_m_slider.val()) * (Math.exp( NH_beta_slider.val()/temperatures[i]))
                        data.push( { "x": strains[k], "y": stress } );
                    }

                    chart_SS.options.data.push({
                                              type: "line",
                                              showInLegend: true,
                                              name: "NH - " + (temperatures[i]-273) + " ºC - " + strainrates[j] + " /s",
                                              toolTipContent: "Strain: {x} , Stress: {y} MPa",
                                              dataPoints: data
                                          })


        }
    }
    chart_SS.render()

    //plotAllExpTests();
}

function removeNHPlots(){
    var ss_data = chart_SS.get("data")
    for(var i =0; i<ss_data.length;i++){
        if(ss_data[i].name.includes("NH -")){

                ss_data[i].remove()

            }
        }
    console.log(ss_data)
    chart_SS.render()
}


function plotAllExpTests(test_ids){
    initialiseGraphs()
    for(var i=0; i<test_ids.length; i++){
        var test_id = test_ids[i]
        pouchdb.get( test_id )
                .then(function(result){
                    plotData(result)
                }).catch(function(err){
                    console.log(err)
                })

            }
}







function plotSingleTest(test_id){
    initialiseGraphs()
    pouchdb.get( test_id )
            .then(function(result){
                plotData(result)
            }).catch(function(err){
                console.log(err)
            })
}




function plotData(data) {
    console.log('Plotting graphs for test');
    //console.log(data)
    console.log(chart_LS)
    console.log(chart_LS.options)


    if(chart_LS.options.data){
        chart_LS.options.data.push({
                      type: "line",
                      showInLegend: true,
                      name: data.temperature + " ºC - " + data.strainrate +" /s",
                      toolTipContent: "Height: {x} mm, Load: {y} kN",
                      dataPoints: parseData(data.measurements, "displacement", "load", "")
                  })
    }else{
        chart_LS.options.data = []
    }

    chart_TS.options.data.push({
                      type: "line",
                      showInLegend: true,
                      name: data.temperature + " ºC - " + data.strainrate +" /s",
                      toolTipContent: "Height: {x} mm, Temp: {y} ºC",
                      dataPoints: parseData(data.measurements, "displacement", "sample_temp_2_centre", "")
                  })
    chart_VS.options.data.push({
                      type: "line",
                      showInLegend: true,
                      name: data.temperature + " ºC - " + data.strainrate +" /s",
                      toolTipContent: "Height: {x} mm, Velocity: {y} mm/s",
                      dataPoints: parseData(data.measurements, "displacement", "velocity_", "")
                  })
    chart_SRS.options.data.push({
                      type: "line",
                      showInLegend: true,
                      name: data.temperature + " ºC - " + data.strainrate +" /s",
                      toolTipContent: "Height: {x} mm, Strain rate: {y} /s",
                      dataPoints: parseData(data.measurements, "displacement", "strainrate", "")
                  })
    chart_SS.options.data.push({
                      type: "line",
                      showInLegend: true,
                      name: data.temperature + " ºC - " + data.strainrate +" /s",
                      toolTipContent: "Strain: {x} , Stress: {y} MPa",
                      dataPoints: parseData(data.measurements, "strain", "fricStress", "")
                  })
    chart_LS.render()
    chart_TS.render()
    chart_VS.render()
    chart_SRS.render()
    chart_SS.render()
   }



   function parseData(data, x_name, y_name, label){
        //console.log(label)
           var parsed_data = data.map(function(d){
               return {"x": d[x_name]  , "y": d[y_name], "label": label }
           })
           //console.log(parsed_data)
           return parsed_data
   }



   function initialiseGraphs(){


            chart_LS = new CanvasJS.Chart("graphLS",
           {
               animationEnabled: true,
               zoomEnabled: true,
               zoomType: "xy",
               exportEnabled: true,
               exportFileName: "graph",
               toolTip: {
                       enabled: true,
                       shared: true
               },
               title: {
                   text: "Load - Stroke",
                   fontColor: "#000",
                   fontfamily: "Arial",
                   fontSize: 20,
                   padding: 8
               },
                legend: {
                           horizontalAlign: "right", // left, center ,right
                           verticalAlign: "center",  // top, center, bottom
                            cursor: "pointer",
                            itemclick: function (e) {
                                //console.log("legend click: " + e.dataPointIndex);
                                //console.log(e);
                                if (typeof (e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
                                    e.dataSeries.visible = false;
                                } else {
                                    e.dataSeries.visible = true;
                                }

                                e.chart.render();
            }
        },
           axisX:{
                   title: "Sample height (mm)",
                   fontColor: "#000",
                   fontfamily: "Arial",
                   titleFontSize: 20,
                   labelFontSize: 12,
                   lineColor: "#000",
                   tickColor: "#000",
                   labelFontColor: "#000",
                   titleFontColor: "#000",
                   lineThickness: 1,
                   reversed:  true
           },
           axisY:
              {
                title: "Load (kN)",
                fontfamily: "Arial",
                titleFontSize: 20,
                labelFontSize: 12,
                lineColor: "#000",
                tickColor: "#000",
                labelFontColor: "#000",
                titleFontColor: "#000",
                lineThickness: 1,
                reversed:  true
            },
            data: []
           });


           chart_TS = new CanvasJS.Chart("graphTS",
          {
              animationEnabled: true,
              zoomEnabled: true,
              zoomType: "xy",
              exportEnabled: true,
              exportFileName: "graph",
              toolTip: {
                      enabled: true,
                      shared: true
              },
              title: {
                  text: "Temperature - Stroke",
                  fontColor: "#000",
                  fontfamily: "Arial",
                  fontSize: 20,
                  padding: 8
              },
              legend: {
                         horizontalAlign: "right", // left, center ,right
                         verticalAlign: "center",  // top, center, bottom
                          cursor: "pointer",
                          itemclick: function (e) {
                              //console.log("legend click: " + e.dataPointIndex);
                              //console.log(e);
                              if (typeof (e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
                                  e.dataSeries.visible = false;
                              } else {
                                  e.dataSeries.visible = true;
                              }

                              e.chart.render();
          }
      },
          axisX:{
                  title: "Sample height (mm)",
                  fontColor: "#000",
                  fontfamily: "Arial",
                  titleFontSize: 20,
                  labelFontSize: 12,
                  lineColor: "#000",
                  tickColor: "#000",
                  labelFontColor: "#000",
                  titleFontColor: "#000",
                  lineThickness: 1,
                  reversed:  true
          },
          axisY:
             {
               title: "Temperature (ºC)",
               fontfamily: "Arial",
               titleFontSize: 20,
               labelFontSize: 12,
               lineColor: "#000",
               tickColor: "#000",
               labelFontColor: "#000",
               titleFontColor: "#000",
               lineThickness: 1
           },
           data: []
          });



       chart_VS = new CanvasJS.Chart("graphVS",
       {
          animationEnabled: true,
          zoomEnabled: true,
          zoomType: "xy",
          toolTip: {
                  enabled: true,
                  shared: true,
          },
          exportEnabled: true,
          exportFileName: "graph",
          toolTip: {
                  enabled: true,
                  shared: true
          },
          title: {
              text: "Velocity - Stroke",
              fontColor: "#000",
              fontfamily: "Arial",
              fontSize: 20,
              padding: 8
          },
          legend: {
                     horizontalAlign: "right", // left, center ,right
                     verticalAlign: "center",  // top, center, bottom
                      cursor: "pointer",
                      itemclick: function (e) {
                          //console.log("legend click: " + e.dataPointIndex);
                          //console.log(e);
                          if (typeof (e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
                              e.dataSeries.visible = false;
                          } else {
                              e.dataSeries.visible = true;
                          }

                          e.chart.render();
      }
  },
       axisX:{
              title: "Sample height (mm)",
              fontColor: "#000",
              fontfamily: "Arial",
              titleFontSize: 20,
              labelFontSize: 12,
              lineColor: "#000",
              tickColor: "#000",
              labelFontColor: "#000",
              titleFontColor: "#000",
              lineThickness: 1,
              reversed:  true
       },
       axisY:
         {
           title: "Velocity (mm/s)",
           fontfamily: "Arial",
           titleFontSize: 20,
           labelFontSize: 12,
           lineColor: "#000",
           tickColor: "#000",
           labelFontColor: "#000",
           titleFontColor: "#000",
           lineThickness: 1
        },
        data: []
       });



       chart_SRS = new CanvasJS.Chart("graphSRS",
       {
          animationEnabled: true,
          zoomEnabled: true,
          zoomType: "xy",
          exportEnabled: true,
          exportFileName: "graph",
          toolTip: {
                  enabled: true,
                  shared: true
          },
          title: {
              text: "Strain rate",
              fontColor: "#000",
              fontfamily: "Arial",
              fontSize: 20,
              padding: 8
          },
          legend: {
                     horizontalAlign: "right", // left, center ,right
                     verticalAlign: "center",  // top, center, bottom
                      cursor: "pointer",
                      itemclick: function (e) {
                          //console.log("legend click: " + e.dataPointIndex);
                          //console.log(e);
                          if (typeof (e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
                              e.dataSeries.visible = false;
                          } else {
                              e.dataSeries.visible = true;
                          }

                          e.chart.render();
      }
  },
       axisX:{
              title: "Sample height (mm)",
              fontColor: "#000",
              fontfamily: "Arial",
              titleFontSize: 20,
              labelFontSize: 12,
              lineColor: "#000",
              tickColor: "#000",
              labelFontColor: "#000",
              titleFontColor: "#000",
              lineThickness: 1,
              reversed:  true
       },
       axisY:
         {
           title: "Strain rate (/s)",
           fontfamily: "Arial",
           titleFontSize: 20,
           labelFontSize: 12,
           lineColor: "#000",
           tickColor: "#000",
           labelFontColor: "#000",
           titleFontColor: "#000",
           lineThickness: 1
        },
        data: []
       });


       chart_SS = new CanvasJS.Chart("graphSS",
       {
          animationEnabled: true,
          zoomEnabled: true,
          zoomType: "xy",
          toolTipContent: "x: {x}, y: {y[0]} ",
          exportEnabled: true,
          exportFileName: "graph",
          toolTip: {
                  enabled: true,
                  shared: true,
          },
          title: {
              text: "True stress - true strain",
              fontColor: "#000",
              fontfamily: "Arial",
              fontSize: 20,
              padding: 8
          },
          legend: {
                     horizontalAlign: "right", // left, center ,right
                     verticalAlign: "center",  // top, center, bottom
                      cursor: "pointer",
                      itemclick: function (e) {
                          //console.log("legend click: " + e.dataPointIndex);
                          //console.log(e);
                          if (typeof (e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
                              e.dataSeries.visible = false;
                          } else {
                              e.dataSeries.visible = true;
                          }

                          e.chart.render();
      }
  },
       axisX:{
              title: "True strain (mm/mm)",
              fontColor: "#000",
              fontfamily: "Arial",
              titleFontSize: 20,
              labelFontSize: 12,
              lineColor: "#000",
              tickColor: "#000",
              labelFontColor: "#000",
              titleFontColor: "#000",
              lineThickness: 1,
              viewportMinimum: 0.0,
              viewPortMaximum: 1.0
       },
       axisY:
         {
           title: "True stress (MPa)",
           fontfamily: "Arial",
           titleFontSize: 20,
           labelFontSize: 12,
           lineColor: "#000",
           tickColor: "#000",
           labelFontColor: "#000",
           titleFontColor: "#000",
           lineThickness: 1,
           viewportMinimum: 0.0
        },
        data: []
       });

















   }
