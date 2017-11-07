var allGraphDivs = $('.graphDiv');
var allControls = $('.controls');
var plotAllTests = $('#plotAll');
var currentTestTable = $('#currentTests');
var tableBody = currentTestTable.find("tbody");
var graph = $('#graph');
var graph_Parent = $('#graph_Parent');
var graph_SS = $('#graph_SS');
var graph_SS_Parent = $('#graph_SS_Parent');
var graph_sr_Parent = $('#graph_sr_Parent');

var settingsDiv = $('#settingsDiv');

var displacement_offset = $('#displacement_offset');
var displacement_offset_range = $('#displacement_offset_range');
var load_offset = $('#load_offset');
var load_offset_range = $('#load_offset_range');
var zero_offset = $('#zero_offset');
var load_offset = $('#load_offset');
var export_Data = $("#export_Data");

var chart_load = "";
var chart_angle = "";
var chart_disp = "";
var chart_torque = "";



var NH_K_slider = $('#NH_K_slider');
var NH_n_slider = $('#NH_n_slider');
var NH_m_slider = $('#NH_m_slider');
var NH_beta_slider = $('#NH_beta_slider');
var NH_temps = $('#NH_temperature');
var NH_strainrates = $('#NH_strainrate');

var currentTest = "";
var vol_cold = 0.0;
var vol_hot = 0.0;

//setup the in-memory database to save the uploaded flow stress data and saved fitted parameters


var test_db = new PouchDB('aspshear')
test_db.info().then(function (info) {
  console.log(info);
})
var powders_db = new PouchDB('powders')
powders_db.info().then(function (info) {
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


/*
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

*/


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


$('#startYield').on('click', function(){
    console.log("Started yield calculation")
    $(this).attr("disabled", true)
    startYieldCalculation()
})

$('#stopYield').on('click', function(){
    $('#startYield').attr("disabled", false)
    chart_4.options.data[0].set("click") = null
    chart_4.options.axisX[0].set("viewportMinimum", 0.0 )
    chart_4.options.axisX[0].set("viewportMaximum", 0.1 )
})

function startYieldCalculation(){
    console.log(chart_4)
    var chart_options = chart_4.options;
    var ss_points = chart_options.data[0].dataPoints;

    chart_options.data[0] = {}
    chart_options.axisX[0].set("viewportMinimum", 0.0 )
    chart_options.axisX[0].set("viewportMaximum", 0.1 )
    chart_options.data[0].set("click" ,function(e){
        console.log(e)
    alert(  e.dataSeries.type + ", dataPoint { x:" + e.dataPoint.x + ", y: "+ e.dataPoint.y + " }" );
})




}



function prepareDownload(){

    var data = []
    data[0] = "Time (s), Zero-corrected displacement (mm), Axial load (kN), Zero-corrected angle (deg), Torque (Nm)\r\n"
    for(var i=0; i<currentTest.trimmedData.length; i++){
        var point = currentTest.trimmedData[i]
        data.push(point.time + "," + point.displacement_inst + "," + point.axial_load_inst + ',' + point.angle_inst + ',' + point.torque_inst + "\r\n")
    }
    //console.log(data)
    data.join()

    var blob = new Blob(data, {type: "text/.csv"});
    var url = URL.createObjectURL(blob);
    export_Data.attr('href', url )
    export_Data.attr('download', currentTest._id + "_trimmed_data.csv" )

}




/*
function getAllTests(){
    //var allTests = tests_coll.find({});
    var allTests = [];
    tableBody.html("");

    pouchdb.allDocs({
            include_docs : true
            })
            .then(function(result){
                //console.log(result.rows)
                        if(result.rows.length > 0){
                            $('#test_status').hide()
                            for(i=0; i<result.rows.length; i++){
                                var doc = result.rows[i].doc;
                                console.log(doc)
                                tableBody.append("<tr name='"+ result.rows[i].id +"'><td>"+ result.rows[i].id  +"</td><td name='sample'>"+ doc.sample +"</td><td name='temperature'>"+ doc.data.temperature +"</td><td name='strainrate'>"+ doc.data.strainrate +"</td><td><i class='fa fa-trash fa-2x' ></i></td></tr>")
                            }

                        tableBody.find("tr td:not(:last-child)").on("click", function(){
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

                        tableBody.find("i.fa-trash").on('click', function(){
                            var test_id = $(this).closest('tr').attr('name');
                            console.log("Deleting test " + test_id)
                            removeTest(test_id);
                        })





                        }
                        else{
                            $('#test_status').show()

                        }

            }).catch(
                    console.log("Couldn't retrieve data from the database")
            )
    //console.log(allTests);
}
*/

function getSingleTest(){
    tableBody.html("");
    console.log( currentTest )
    test_db.get( currentTest  )
            .then(function(doc){
                currentTest = doc;
                console.log(doc)

                powders_db.get( doc.powder_id )
                    .then(function(powder){
                        console.log(powder)

                                        tableBody.append("<tr name='"+ currentTest._id +"'><td>"+ currentTest._id  +"</td><td name='sample'>"+ powder.name +"</td><td name='load'>"+ currentTest.load +"</td><td name='angular_velocity'>"+ currentTest.angular_velocity +"</td></tr>")
                                        $("#test_status").hide()
                                        console.log(currentTest)

            })
        })
            .then(function(){

                if(currentTest.trimmedData){
                            processData(currentTest.trimmedData)
                            prepareDownload()
                            export_Data.show()

                }else{
                            processData(currentTest.rawData)
                            export_Data.hide()
                }
            }).catch(function(err){
                                        console.log(err)
                                        $('#test_status').show()
            })
}




function saveData(){
/*
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
*/

    console.log("Saved data")
    console.log(currentTest)
    
    var d = new Date();
    test.modified = d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds() + " " + d.getDate() + "-" + d.getMonth() + "-" + d.getFullYear()

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


$('#iso_period').on('input change', function(){
    $('#iso_period_value').html( $(this).val() )
})

$('#analysed').on('click', function(){
        currentTest.analysed = true
})

function processData(data) {
    //console.log(currentTest)

    plot_raw(data)
    //callback()



}


function calcOffset(value){
    var dataPoints = chart_2.options.data[0].dataPoints
    chart_2.options.data[1].dataPoints = dataPoints.map(function(d){
        return { "x": d.x - currentTest.zero_offset, "y": d.y - currentTest.load_offset , "label": d.label}
    })
    chart_2.render()
}


function calcStrain(){
    var heights = chart_2.options.data[1].dataPoints
    chart_3.options.data[0].dataPoints = heights.map(function(d){
        var strain = -Math.log(parseFloat(currentTest.sample.dimensions.av_h_initial - d.x ) / currentTest.sample.dimensions.av_h_initial )
        if(isNaN(strain)){
            strain = 0.0
        }
        return { "x": strain, "y": d.y, "label": "Strain"}
    })
    chart_3.render()
}

function calcStrainRate(){
    var heights = chart_2.options.data[0].dataPoints
    chart_sr.options.data[0].dataPoints = heights.map(function(d, i){
        var height =  currentTest.sample.dimensions.av_h_initial - d.x
        var velocity = currentTest.measurements[i].velocity_
        var strainrate = velocity / height
        return { "x": height, "y": strainrate, "label": "Strain rate"}
    })
    graph_sr_Parent.show()
    chart_sr.render()
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

function calcIsoStress(){
    var fric_corr_stress = chart_4.options.data[1].dataPoints
    var temps = currentTest.measurements

    var factors = []


    var factors = fric_corr_stress.map(function(d, i){
        return { "T": temps[i].sample_temp_2_centre, "fric_corr_stress": d.y, "strain": d.x}
    })


    chart_4.options.data[2].dataPoints = factors.map(function(d, i ){
        var period = Math.round( $('#iso_period').val())
        if(i < factors.length - period ){
            var slice = factors.slice(i,i+period)
            //console.log(temp_slice)
            var sum_T=0.0
            var sum_S=0.0
            for( var j = 0; j < slice.length; j++ ){
                 sum_T += parseInt( slice[j].T );
                 sum_T += parseInt( slice[j].fric_corr_stress );
            }

            var avg_T = sum_T/slice.length;
            var avg_S = sum_S/slice.length;
            //console.log(avg_T)
            var delta_T = avg_T - currentTest.temperature
            var d_T = slice[slice.length-1].T - slice[0].T
            var d_S = slice[slice.length-1].fric_corr_stress - slice[0].fric_corr_stress
            var d_S_d_T = d_S / d_T
            var corr_factor = d_T * d_S_d_T

            var iso_stress = d.fric_corr_stress + corr_factor
            return { "x": factors[i+period].strain, "y": iso_stress, "label": "Isothermal Stress"}
        }
        else {
            return { "x": factors[i].strain, "y": null, "label": "Isothermal Stress"}
        }
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
        zoomType: "xy",
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
                return { x: d.time , y: d.axial_load_inst}
            })
        }
    ]
    });


    console.log('Plotting angle load graph');

     chart_angle = new CanvasJS.Chart("graph_angle",
    {
        animationEnabled: true,
        zoomEnabled: true,
        zoomType: "xy",
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



    console.log('Plotting load stroke graph');

     chart_disp = new CanvasJS.Chart("graph_disp",
    {
        animationEnabled: true,
        zoomEnabled: true,
        zoomType: "xy",
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
         lineThickness: 1,
         viewportMaximum: Math.max.apply(Math,data.map(function(d){return -d.displacement_inst;})) * 1.2,
         viewportMinimum: Math.min.apply(Math,data.map(function(d){return -d.displacement_inst;})) * 0.9
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
                return { x : d.time , y : -d.displacement_inst }
            })
        }
    ]
    });

    chart_torque = new CanvasJS.Chart("graph_torque",
   {
       animationEnabled: true,
       zoomEnabled: true,
       zoomType: "xy",
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














   chart_disp_torq = new CanvasJS.Chart("graph_disp_torq",
  {
      animationEnabled: true,
      zoomEnabled: true,
      zoomType: "xy",
      exportEnabled: true,
      exportFileName: "graph",
      toolTip: {
              enabled: true,
              shared: true,
      },
      title: {
          text: "Axial displacement vs Torque",
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
          type: "scatter",
          markerColor: "rgba(100,100,100,0.5)",
          showInLegend: true,
          name: "Raw Data",
          color: "#333",
          toolTipContent: "Displacement: {x} mm, Torque: {y} Nm",
          dataPoints: data.map(function(d){
              return { x : -d.displacement_inst , y : d.torque_inst }
          })
      }
  ]
  });



  chart_load_torq = new CanvasJS.Chart("graph_load_torq",
 {
     animationEnabled: true,
     zoomEnabled: true,
     zoomType: "xy",
     exportEnabled: true,
     exportFileName: "graph",
     toolTip: {
             enabled: true,
             shared: true,
     },
     title: {
         text: "Load vs Torque",
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
         title: "Load (kN)",
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
         type: "scatter",
         markerColor: "rgba(100,100,100,0.5)",
         showInLegend: true,
         name: "Raw Data",
         color: "#333",
         toolTipContent: "Load: {x} kN, Torque: {y} Nm",
         dataPoints: data.map(function(d){
             return { x : -d.axial_load_inst , y : d.torque_inst }
         })
     }
 ]
 });



















    chart_load.render();
    chart_angle.render();
    chart_disp.render();
    chart_torque.render();
    chart_disp_torq.render();
    chart_load_torq.render();

   }


function rescalePlots(e) {
   var x_min = e.axisX[0].viewportMinimum
   var x_max = e.axisX[0].viewportMaximum

       chart_load.options.axisX.viewportMinimum = x_min
       chart_load.options.axisX.viewportMaximum = x_max
       chart_disp.options.axisX.viewportMinimum = x_min
       chart_disp.options.axisX.viewportMaximum = x_max
       chart_angle.options.axisX.viewportMinimum = x_min
       chart_angle.options.axisX.viewportMaximum = x_max
       chart_torque.options.axisX.viewportMinimum = x_min
       chart_torque.options.axisX.viewportMaximum = x_max

       chart_load.render();
       chart_disp.render();
       chart_angle.render();
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
    export_Data.hide(500)
    processData(currentTest.rawData)
})




$('#trimDataBtn').on('click', function(){
    currentTest.trimmedData = []
    $(this).attr('disabled', true)
    $(this).addClass('btn-success' )
    var statusMsg = $(this).after("<span></span>")
    statusMsg.html("Pick start of the test on Angle graph")
    var num_clicks = 0;
    var firstPoint = ""
    var secondPoint = ""
    chart_angle.options.data[0].click = function(e){
        num_clicks += 1;
        statusMsg.html("Pick point at start of the test")
        if(num_clicks == 1){
            firstPoint = e.dataPointIndex
            console.log("First point picked")
            //console.log(chart_angle.options.data[0].dataPoints)
            chart_angle.options.data[0].dataPoints[firstPoint].markerColor = "red"
            chart_angle.options.data[0].dataPoints[firstPoint].markerSize = 20
            statusMsg.html("Pick point at end of the test on Angle graph")
        }
        else if(num_clicks == 2){
            secondPoint = e.dataPointIndex
            console.log("Second point picked")
            chart_angle.options.data[0].dataPoints[secondPoint].markerColor = "red"
            chart_angle.options.data[0].dataPoints[firstPoint].markerSize = 20

            for(var i=0; i<currentTest.rawData.length; i++){
                if( i > firstPoint && i < secondPoint ){
                    currentTest.trimmedData.push(currentTest.rawData[i])
                }

                statusMsg.html("Data trimmed")
                statusMsg.removeClass('btn-success' )
                statusMsg.addClass('btn-default' )
            }
            console.log("Trimming finished")
            chart_angle.options.data[0].click  = null

            currentTest.trimmedData.map(function(d, i){

                d.time = i / currentTest.sample_rate
                d.displacement_inst = d.displacement_inst - currentTest.rawData[0].displacement_inst
                d.angle_inst = d.angle_inst - currentTest.rawData[0].angle_inst
                d.torque_inst = d.torque_inst - currentTest.trimmedData[0].torque_inst

                return d
            })
            currentTest.analysed = true
            prepareDownload()
            export_Data.show(500)
            processData( currentTest.trimmedData )
        }

        }

    })
