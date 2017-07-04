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

var chart_load = "";
var chart_disp = "";
var chart_torque = "";
var chart_stress = ""
var chart_SS =  "";
var chart_SS = "";


var data = []


var test_db = new PouchDB('aspshear')
test_db.info().then(function (info) {
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

        test_db.get( testIDs[i] ).then(function(doc){
                $('#test_status').hide()
                console.log(doc)
                tableBody.append("<tr name='"+ doc._id +"'><td>"+ doc._id  +"</td><td name='sample'>"+ doc.sample +"</td><td name='load'>"+ doc.load +"</td><td name='angular_velocity'>"+ doc.angular_velocity +"</td><td>"+ doc.data_file.name +"</td></tr>")

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




function plotAllExpTests(test_ids){
    initialiseGraphs()
    for(var i=0; i<test_ids.length; i++){
        var test_id = test_ids[i]
        test_db.get( test_id )
                .then(function(result){
                    plotData(result.trimmedData)
                }).catch(function(err){
                    console.log(err)
                })

            }
}







function plotSingleTest(test_id){
    initialiseGraphs()
    test_db.get( test_id )
            .then(function(result){
                plotData(result)
            }).catch(function(err){
                console.log(err)
            })
}




function plotData(data) {
    console.log('Plotting graphs for test');
    //console.log(data)

    if(chart_load.options.data){
        chart_load.options.data.push({
                      type: "line",
                      showInLegend: true,
                      name: data.load + " Nm - " + data.angular_velocity +" º/s",
                      toolTipContent: "Angle: {x} mm, Load: {y} kN",
                      dataPoints: parseData(data, "angle_inst", "axial_load_inst", "")
                  })
    }else{
        chart_load.options.data = []
    }

    chart_disp.options.data.push({
                      type: "line",
                      showInLegend: true,
                      name: data.load + " Nm - " + data.angular_velocity +" º/s",
                      toolTipContent: "Angle: {x} mm, Displacement: {y} m",
                      dataPoints: parseData(data, "angle_inst", "displacement_inst", "")
                  })


    chart_torque.options.data.push({
                      type: "line",
                      showInLegend: true,
                      name: data.load + " Nm - " + data.angular_velocity +" º/s",
                      toolTipContent: "Angle: {x} mm, Torque: {y} Nm",
                      dataPoints: parseData(data, "angle_inst", "torque_inst", "")
                  })

    chart_load.render()
    chart_disp.render()
    chart_torque.render()
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

           console.log('Plotting time-load graph');

            chart_load = new CanvasJS.Chart("graph_load",
           {
               animationEnabled: true,
               zoomEnabled: true,
               zoomType: "x",
               exportEnabled: true,
               exportFileName: "graph_load_raw",
               rangeChanging: function(e){

                   rescalePlots(e)

               },
               toolTip: {
                       enabled: true,
                       shared: true,
               },
               title: {
                   text: "Axial load",
                   fontColor: "#000",
                   fontfamily: "Arial",
                   fontSize: 20,
                   padding: 8
               },
               legend: {
                          horizontalAlign: "right", // left, center ,right
                          verticalAlign: "top",  // top, center, bottom
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
                   title: "Angle (º)",
                   fontColor: "#000",
                   fontfamily: "Arial",
                   titleFontSize: 20,
                   labelFontSize: 12,
                   lineColor: "#000",
                   tickColor: "#000",
                   labelFontColor: "#000",
                   titleFontColor: "#000",
                   lineThickness: 1
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
                lineThickness: 1
            },
               data:[]
           });


           console.log('Plotting angle load graph');

            chart_angle = new CanvasJS.Chart("graph_angle",
           {
               animationEnabled: true,
               zoomEnabled: true,
               zoomType: "x",
               exportEnabled: true,
               exportFileName: "graph",
               rangeChanging: function(e){

                   rescalePlots(e)

               },
               toolTip: {
                       enabled: true,
                       shared: true,
               },
               title: {
                   text: "Angle",
                   fontColor: "#000",
                   fontfamily: "Arial",
                   fontSize: 20,
                   padding: 8
               },
               legend: {
                          horizontalAlign: "right", // left, center ,right
                          verticalAlign: "top",  // top, center, bottom
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
                   title: "Angle (º)",
                   fontColor: "#000",
                   fontfamily: "Arial",
                   titleFontSize: 20,
                   labelFontSize: 12,
                   lineColor: "#000",
                   tickColor: "#000",
                   labelFontColor: "#000",
                   titleFontColor: "#000",
                   lineThickness: 1
           },
           axisY:
              {
                title: "Angle (º)",
                fontfamily: "Arial",
                titleFontSize: 20,
                labelFontSize: 12,
                lineColor: "#000",
                tickColor: "#000",
                labelFontColor: "#000",
                titleFontColor: "#000",
                lineThickness: 1
            },
               data:[]
           });



           console.log('Plotting load stroke graph');

            chart_disp = new CanvasJS.Chart("graph_disp",
           {
               animationEnabled: true,
               zoomEnabled: true,
               zoomType: "x",
               exportEnabled: true,
               exportFileName: "graph",
               rangeChanging: function(e){
                   rescalePlots(e)
               },
               toolTip: {
                       enabled: true,
                       shared: true,
               },
               title: {
                   text: "Axial displacement",
                   fontColor: "#000",
                   fontfamily: "Arial",
                   fontSize: 20,
                   padding: 8
               },
               legend: {
                          horizontalAlign: "right", // left, center ,right
                          verticalAlign: "top",  // top, center, bottom
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
                   title: "Angle (º)",
                   fontColor: "#000",
                   fontfamily: "Arial",
                   titleFontSize: 20,
                   labelFontSize: 12,
                   lineColor: "#000",
                   tickColor: "#000",
                   labelFontColor: "#000",
                   titleFontColor: "#000",
                   lineThickness: 1
           },
           axisY:
              {
                title: "Displacement (mm)",
                fontfamily: "Arial",
                titleFontSize: 20,
                labelFontSize: 12,
                lineColor: "#000",
                tickColor: "#000",
                labelFontColor: "#000",
                titleFontColor: "#000",
                lineThickness: 1
            },
               data:[]
           });

           chart_torque = new CanvasJS.Chart("graph_torque",
          {
              animationEnabled: true,
              zoomEnabled: true,
              zoomType: "x",
              exportEnabled: true,
              exportFileName: "graph",
              rangeChanged: function(e){

                  rescalePlots(e)

              },
              toolTip: {
                      enabled: true,
                      shared: true,
              },
              title: {
                  text: "Torque",
                  fontColor: "#000",
                  fontfamily: "Arial",
                  fontSize: 20,
                  padding: 8
              },
              legend: {
                         horizontalAlign: "right", // left, center ,right
                         verticalAlign: "top",  // top, center, bottom
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
                  title: "Angle (º)",
                  fontColor: "#000",
                  fontfamily: "Arial",
                  titleFontSize: 20,
                  labelFontSize: 12,
                  lineColor: "#000",
                  tickColor: "#000",
                  labelFontColor: "#000",
                  titleFontColor: "#000",
                  lineThickness: 1
          },
          axisY:
             {
               title: "Torque (Nm)",
               fontfamily: "Arial",
               titleFontSize: 20,
               labelFontSize: 12,
               lineColor: "#000",
               tickColor: "#000",
               labelFontColor: "#000",
               titleFontColor: "#000",
               lineThickness: 1
           },
              data:[]
          });


           chart_load.render();
           chart_disp.render();
           chart_torque.render();


}



function rescalePlots(e) {
   var x_min = e.axisX[0].viewportMinimum
   var x_max = e.axisX[0].viewportMaximum

       chart_load.options.axisX.viewportMinimum = x_min
       chart_load.options.axisX.viewportMaximum = x_max
       chart_disp.options.axisX.viewportMinimum = x_min
       chart_disp.options.axisX.viewportMaximum = x_max
       //chart_angle.options.axisX.viewportMinimum = x_min
       //chart_angle.options.axisX.viewportMaximum = x_max
       chart_torque.options.axisX.viewportMinimum = x_min
       chart_torque.options.axisX.viewportMaximum = x_max

       chart_load.render();
       chart_disp.render();
       //chart_angle.render();
       chart_torque.render();





  }
