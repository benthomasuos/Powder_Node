var allGraphDivs = $('.graphDiv');
var allControls = $('.controls');
var plotAllTests = $('#plotAll');
var currentTestTable = $('#currentTests');
var tableBody = currentTestTable.find("tbody");
var graph = $('#graph');
var graph_Parent = $('#graph_Parent');
var graph_load = $('#graph_load');
var graph_SS_Parent = $('#graph_SS_Parent');
var graph_sr_Parent = $('#graph_sr_Parent');
var export_load = $('#export_load');
var settingsDiv = $('#settingsDiv');

var displacement_offset = $('#displacement_offset');
var displacement_offset_range = $('#displacement_offset_range');
var load_offset = $('#load_offset');
var load_offset_range = $('#load_offset_range');
var zero_offset = $('#zero_offset');
var load_offset = $('#load_offset');
var export_SS = $("#export_SS");

var chart_load = "";
var chart_angle = "";
var chart_disp = "";
var chart_torque = "";


var currentTest = "";
var vol_cold = 0.0;
var vol_hot = 0.0;

//setup the in-memory database to save the uploaded flow stress data and saved fitted parameters


var test_db = new PouchDB('orthogonal')
test_db.info().then(function (info) {
  console.log(info);
})

    displacement_offset.on('input', function(){
        var value = $(this).val();
        displacement_offset_range.val(value)
        currentTest.zero_offset = value;
        calcOffset(value)
    })

    displacement_offset_range.on('input', function(){
        var value = $(this).val();
        displacement_offset.val(value)
        currentTest.zero_offset = value;
        calcOffset(value)
    })

    load_offset.on('input', function(){
        var value = $(this).val();
        load_offset_range.val(value)
        currentTest.load_offset = value;
        calcOffset(value)
    })

    load_offset_range.on('input', function(){
        var value = $(this).val();
        load_offset.val(value)
        currentTest.load_offset = value;
        calcOffset(value)
    })







$(document).ready(function(){
    currentTest = window.location.href.split("?")[1].split("=")[1];
    if(currentTest){
        console.log("Processing test: "+ currentTest)
        getSingleTest()
    }else{
        console.log("No test chosen")
        getAllTests()

    }




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



    $(window).scroll(function(){

        if($(window).scrollTop() >= '10'){
            $('.settingsDiv').removeClass('floating');
            $('.settingsDiv').addClass('fixed');
        }

        else{
            $('.settingsDiv').addClass('floating');
            $('.settingsDiv').removeClass('fixed');
        }
    });




    $(".fa-caret-up").on('click', function(){
        $(this).closest(".panel").find(".panel-body").toggle();
        $(this).toggleClass("fa-caret-up");
        $(this).toggleClass("fa-caret-down");
    })




    var $sidebar   = $("#settingsDiv"),
       $window    = $(window),
       offset     = $sidebar.offset(),
       topPadding = 30;

   $window.scroll(function() {
       if ($window.scrollTop() > offset.top) {
           //$sidebar.stop().animate({
        //       marginTop: $window.scrollTop() - offset.top + topPadding
         //  });
           $sidebar.css("marginTop", $window.scrollTop() - offset.top + topPadding
           );
       } else {
           $sidebar.css("marginTop", 0);
       }
   });




})

















function getSingleTest(){
    tableBody.html("");
    console.log( currentTest )
    test_db.get( currentTest  )
            .then(function(doc){
                currentTest = doc;
                console.log(doc)

                            tableBody.append("<tr name='"+ currentTest._id +"'><td>"+ currentTest._id  +"</td><td name='sample'>"+ currentTest.sample +"</td><td name='acut_speed'>"+ currentTest.cut_speed +"</td><td name='cut_depth'>"+ currentTest.cut_depth +"</td><td name='cut_length'>"+ currentTest.cut_length +"</td></tr>")
                            $("#test_status").hide()
                            console.log(currentTest)

        })
            .then(function(){
                                        processData(currentTest.rawData)
            }).catch(function(err){
                                        console.log(err)
                                        $('#test_status').show()
            })
}




function saveData(){
    $('input').each(function(){
        if($(this).attr('name')){
            var name = $(this).attr('name')

            var value = $(this).val()

            if($(this).attr('type') == "number"){
                 value =  +$(this).val()

            }
            if( name.includes("h_") || name.includes("d_") && !name.includes("load")){
                currentTest.sample.dimensions[name] = value;
            }else{
                //console.log($(this).attr('name'), $(this).val())
                localStorage[name] = value;
                currentTest[name] = value;


            }

        }
    })
    console.log("Saved data")
    console.log(currentTest)
    test_db.get( currentTest._id ).then(function(doc) {
        currentTest._rev = doc._rev
      return test_db.put( currentTest );
        }).then(function(response) {
            console.log(response);
        $('#saveData').html("Data saved OK").addClass('btn-success').delay(2000)
        .queue(function(n) {
               $(this).html("Save and Plot");
               $(this).removeClass('btn-success')
               n();
           })
           console.log("Processing data after saving it")
           processData(prepareDownload)
    }).catch(function (err) {
      console.log(err);
    });


}

function loadData(){
    $('input').each(function(){
        if($(this).attr('name')){
            var name = $(this).attr('name')
            if( name.includes("h_") || name.includes("d_") && !name.includes("load")){
                $(this).val(currentTest.sample.dimensions[name]);
            }else{
                $(this).val(currentTest[name]);
            }

        }
    })
    vol_cold = currentTest.sample.dimensions.av_h_initial * Math.PI * (currentTest.sample.dimensions.av_d_initial/2) **2
    currentTest.sample.dimensions.vol_initial_cold = vol_cold

    console.log("Loaded data")
    console.log("Initial sample volume (cold): "+ currentTest.sample.dimensions.vol_initial_cold )
    console.log(currentTest.sample.dimensions)
    $('#loadData').html("Data loaded").delay(1000).html("Load data")
}


$("input[name^='h_initial_'").on('input', function(){
    var sum = 0.0;
    var num_inputs = 0;
    $("input[name^='h_initial_'").each(function(){
        console.log($(this).val())
        if($(this).val() > 0.0){
            sum += parseFloat( $(this).val() )
            num_inputs++
            console.log("sum of sample heights = " + sum)
        }
    })
    var av_height_initial = sum / num_inputs
    console.log("Average sample height = " + av_height_initial)
    $('#av_h_initial').val(av_height_initial)
    currentTest.sample.dimensions.av_h_initial = +av_height_initial
    calcOffset()

})
$("input[name^='h_final_'").on('input', function(){
    var sum = 0.0;
    var num_inputs = 0;
    $("input[name^='h_final_'").each(function(){
        console.log($(this).val())
        if($(this).val() > 0.0){
            sum += parseFloat( $(this).val() )
            num_inputs++
            console.log("sum of sample heights = " + sum)
        }
    })
    var av_height_final = sum / num_inputs
    console.log("Average sample height = " + av_height_final)
    $('#av_h_final').val(av_height_final)
    currentTest.sample.dimensions.av_h_final = +av_height_final

})

$("input[name^='d_initial_'").on('input', function(){
    var sum = 0.0;
    var num_inputs = 0;
    $("input[name^='d_initial_'").each(function(){
        console.log($(this).val())
        if($(this).val() > 0.0){
            sum += parseFloat( $(this).val() )
            num_inputs++
            console.log("sum of sample heights = " + sum)
        }
    })
    var av_diameter_initial = sum / num_inputs
    console.log("Average sample diamter = " + av_diameter_initial)
    $('#av_d_initial').val(av_diameter_initial)
    currentTest.sample.dimensions.av_d_initial = +av_diameter_initial

})
$("input[name^='d_final_'").on('input', function(){
    var sum = 0.0;
    var num_inputs = 0;
    $("input[name^='d_final_'").each(function(){
        console.log($(this).val())
        if($(this).val() > 0.0){
            sum += parseFloat( $(this).val() )
            num_inputs++
            console.log("sum of sample heights = " + sum)
        }
    })
    var av_diameter_final = sum / num_inputs
    console.log("Average sample diamter = " + av_diameter_final)
    $('#av_d_final').val(av_diameter_final)
    currentTest.sample.dimensions.av_d_final = +av_diameter_final
})



$("input[name^='d_mid_'").on('input', function(){
    var sum = 0.0;
    var num_inputs = 0;
    $("input[name^='d_mid_'").each(function(){
        console.log($(this).val())
        if($(this).val() > 0.0){
            sum += parseFloat( $(this).val() )
            num_inputs++
            console.log("Sum of diameter middles = " + sum)
        }
    })
    var av_d_mid_final = sum / num_inputs
    console.log("Average av_d_mid_final  = " + av_d_mid_final )
    $('#av_d_mid_final ').val(av_d_mid_final )
    currentTest.sample.dimensions.av_d_mid_final = +av_d_mid_final
    calcOffset()

})










$('#analysed').on('click', function(){
        currentTest.analysed = true
})

function processData(data, rate) {
    //console.log(currentTest)
    plot_raw(data, rate)
    //callback()
}



function prepareDownload(){
    var dataPoints = currentTest.trimmedData
    //console.log(dataPoints)
    var data = []
    data[0] = "Time(s),Displacement(mm),Load(kN),Torque(Nm)\r\n"
    for(var i=0; i<dataPoints.length; i++){
        var point = dataPoints[i]
        if(point.time && point.displacement_inst && point.axial_load_inst && point.torque_inst ){
            data.push(point.time +","+ point.displacement_inst +","+ point.axial_load_inst +","+ point.torque_inst +  "\r\n")
    //        console.log(point)
        }
    }
    //console.log(data)
    data.join()

    var blob = new Blob(data, {type: "text/.txt"});
    var url = URL.createObjectURL(blob);
    export_load.attr('href', url )
    export_load.attr('download', currentTest.data_file.name + "_trimmed.txt" )
    export_load.show(200)

}


function calcStress(){
    var area_0 = Math.PI * ((parseFloat(currentTest.sample.dimensions.av_d_initial)/2)**2)
    var heights = chart_2.options.data[1].dataPoints
    chart_4.options.data[0].dataPoints = heights.map(function(d, i){
        var strain = chart_3.options.data[0].dataPoints[i].x
        //console.log(strain)
        var h_i = currentTest.sample.dimensions.av_h_initial - d.x
        //console.log(h_i)
        var d_i = Math.sqrt(( 4 * vol_cold ) / ( Math.PI * h_i))
        //console.log(d_i)
        var area_i = Math.PI * ( ( d_i / 2 ) ** 2 )
        var stress = - ( d.y / area_i ) * 1000.0
        //console.log(stress)
        return { "x": strain, "y": stress, "label": "Strain"}
    })
    chart_4.render()
}


function calcFricCorrStress(){
    var heights = chart_1.options.data[0].dataPoints
    var stress = chart_4.options.data[0].dataPoints

    var radii = heights.map(function(d){
         return Math.sqrt(( 4 * vol_cold ) / ( Math.PI * d.x))
    })

    console.log("Friction mu_0 = " + currentTest.mu_0)
    chart_4.options.data[1].dataPoints = heights.map(function(d, i){
        var factor = 1 / ( 1 + ( ( 2 * currentTest.mu_0 * radii[i] )  / ( d.x  * Math.sqrt(3) * 3  ) ))
        var stress_fric_corr = stress[i].y * factor
        var strain = stress[i].x
        return { "x": strain, "y": stress_fric_corr, "label": "Fric Corr Stress 1"}
    })

    chart_4.render()
}






$(".panel-heading").on('click', function(){
    var panel = $(this).parent()
    panel.parent().find(".panel").each(function(){
        var panel_body = $(this).find(".panel-body").hide();
        var panel_heading = $(this).find(".panel-heading i.fa")
        panel_heading.addClass("fa-caret-down");
        panel_heading.removeClass("fa-caret-up");
    })
    var body = panel.find('.panel-body');
    //console.log(body)
    body.show()
    panel.find('panel-heading i.fa').addClass("fa-caret-up");

})



function plot_raw(data) {
    console.log(data)
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
            title: "Time (s)",
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
        data:[
        {
            connectNullData: false,
            type: "line",
            showInLegend: true,
            name: "Load",
            color: "#333",
            toolTipContent: "Time: {x} s, Load: {y} kN",
            dataPoints: data.map(function(d, i){
                return { x: d.time , y: -d.axial_load_inst}
            })
        }
    ]
    });


    console.log('Plotting angle load graph');
/*
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
            title: "Time (s)",
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
        data:[
        {
            connectNullData: false,
            type: "line",
            showInLegend: true,
            name: "Raw Data",
            color: "#333",
            toolTipContent: "Time: {x} s, Angle inst.: {y} º",
            dataPoints: data.map(function(d){
                return { x : d.time ,  y : d.angle_inst }
            })
        }
    ]
    });


*/
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
            title: "Time (s)",
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
        data:[
        {
            connectNullData: false,
            type: "line",
            showInLegend: true,
            name: "Raw Data",
            color: "#333",
            toolTipContent: "Time: {x} s, Displacement: {y} mm",
            dataPoints: data.map(function(d){
                    //var displacement = Math.abs(d.displacement_inst - currentTest.rawData[0].displacement_inst)
                return { x : d.time , y : d.displacement_inst }
            })
        }
    ]
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
           title: "Displacement (mm)",
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
       data:[
       {
           connectNullData: false,
           type: "line",
           showInLegend: true,
           name: "Raw Data",
           color: "#333",
           toolTipContent: "Time: {x} s, Torque: {y} Nm",
           dataPoints: data.map(function(d){
               return { x : d.time , y : d.torque_inst }
           })
       }
   ]
   });




    chart_load.render();
    //chart_audio.render();
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
       //chart_audio.options.axisX.viewportMinimum = x_min
      // chart_audio.options.axisX.viewportMaximum = x_max
       chart_torque.options.axisX.viewportMinimum = x_min
       chart_torque.options.axisX.viewportMaximum = x_max

       chart_load.render();
       chart_disp.render();
       //chart_audio.render();
       //chart_angle.render();
       chart_torque.render();





  }



function parseData(data, x_name, y_name, label){
    //console.log(label)
       var parsed_data = data.map(function(d){
           return {"x": d[x_name]  , "y": d[y_name], "label": label }
       })
       //console.log(parsed_data)
       return parsed_data
}

$('#resetDataBtn').on('click', function(){
    processData(currentTest.rawData)
})


$('#trimDataBtn').on('click', function(){
    alert("Use the Axial Load graph to pick:\n1) Start of test\n2) End of test\nSelect points by clicking on the graph line at the relevant points")
    currentTest.trimmedData = []
    $(this).attr('disabled', true)
    var statusMsg = $(this).after("<span></span>")
    statusMsg.html("Pick start of the test")
    var num_clicks = 0;
    var firstPoint = ""
    var secondPoint = ""
    chart_load.options.data[0].click = function(e){
        num_clicks += 1;
        statusMsg.html("Pick point at start of the test")
        if(num_clicks == 1){
            firstPoint = e.dataPointIndex
            console.log("First point picked")
            //console.log(chart_angle.options.data[0].dataPoints)
            chart_load.options.data[0].dataPoints[firstPoint].markerColor = "light-green"
            chart_load.options.data[0].dataPoints[firstPoint].markerSize = 10
            chart_load.render()
            statusMsg.html("Pick point at end of the test")
        }
        else if(num_clicks == 2){
            secondPoint = e.dataPointIndex
            console.log("Second point picked")
            chart_load.options.data[0].dataPoints[secondPoint].markerColor = "red"
            chart_load.options.data[0].dataPoints[firstPoint].markerSize = 10
            chart_load.render()
            for(var i=0; i<currentTest.rawData.length; i++){
                if( i >= firstPoint && i <= secondPoint ){

                    currentTest.trimmedData.push(currentTest.rawData[i])
                }


            }
            statusMsg.html("Data trimmed")
            alert("Data trimmed")
            console.log("Trimming finished")

            chart_load.options.data[0].click  = null
            processData( currentTest.trimmedData )
            prepareDownload()
        }

        }

    })


$("#graph_load").on("contextmenu",function(){
    console.log("OPened contect menits")


})
