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
var export_SS = $("#export_SS");

var chart_1 = "";
var chart_2 = "";
var chart_3 = "";
var chart_4 = "";
var chart_sr = "";


var currentTest = "";
var vol_cold = 0.0;
var vol_hot = 0.0;

//setup the in-memory database to save the uploaded flow stress data and saved fitted parameters


var pouchdb = new PouchDB('flowstress')
pouchdb.info().then(function (info) {
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
    startYieldCalculation()
})

$('#stopYield').on('click', function(){
    stopYieldCalculation()
})


$('#mu_0').on('change', function(){
        console.log("Replotting friction correction")
        processData(currentTest.measurements, prepareDownload)
})

function stopYieldCalculation(){
    $('#stopYield').attr("disabled", true)
    $('#startYield').attr("disabled", false)
    $('#yieldCalcMsg').html('Yield calculation finished');
    processData(currentTest.measurements, prepareDownload)

}





function startYieldCalculation(){


    $('#stopYield').attr("disabled", false)
    $('#startYield').attr("disabled", true)
    $('#yieldCalcMsg').html('Click at end of elastic region on <span style="color:lightgreen">green</span> line');
    console.log(chart_4)
    var chart_options = chart_4.options;
    var ss_points = chart_options.data[0].dataPoints;



    chart_4.options.axisX.viewportMinimum = 0.0
    chart_4.options.axisX.viewportMaximum = 0.1
    chart_4.render()



    chart_options.data[1].click  = function(e){
            console.log(e)
        chart_options.data[3].dataPoints = [{x:0,y:0}]
        chart_options.data[4].dataPoints = [{x:0.02,y:0}]
        chart_options.data[3].dataPoints.push({ x: e.dataPoint.x , y: e.dataPoint.y })

        var m = (chart_options.data[3].dataPoints[1].y - chart_options.data[3].dataPoints[0].y)/ (chart_options.data[3].dataPoints[1].x - chart_options.data[3].dataPoints[0].x)
        console.log("Youngs modulus = " + ( m / 1000.0 ) + "GPa")
        currentTest.young_mod_gpa = (m / 1000.0).toFixed(2)
        //console.log()

        var y =  e.dataPoint.y * 2.0
        var x =  (y / m) + 0.02

        chart_options.data[4].dataPoints.push( { "x": x , "y": y})

        chart_4.render()
        $('#yieldCalcMsg').html('Click at the point the <span style="color:lightblue">blue</span> line crosses the <span style="color:lightgreen">green</span> line');
        chart_options.data[1].click  = function(e){
            console.log("Yield Stress = " + e.dataPoint.y + " MPa" )
            currentTest.yield_strength_02_mpa = e.dataPoint.y.toFixed(2)
            chart_options.data[1].click  = null
            stopYieldCalculation()
            $('#yieldCalcMsg').html('Yield calculation finished<br>Youngs Modulus:  ' + (m / 1000.0).toFixed(2) + ' GPa<br>Yield stress:  ' + (e.dataPoint.y).toFixed(2) + ' MPa')
        }


    }


    //chart_options.data[1].click = null


}



function startTrim(){






}









function getSingleTest(){
    tableBody.html("");
    pouchdb.get( currentTest , { attachments : true } )
            .then(function(doc){
                currentTest = doc;
                //populateTestForm(doc)
                loadData()
                console.log(doc)
                tableBody.append("<tr name='"+ doc._id +"'><td>"+ doc._id  +"</td><td name='sample'>"+ doc.sample.name.user_defined +"</td><td name='temperature'>"+ doc.temperature +"</td><td name='strainrate'>"+ doc.strainrate +"</td></tr>")
                if(doc.yield_strength_02_mpa && doc.young_mod_gpa){
                    $('#yieldCalcMsg').html('Yield calculation already completed.<br>Click START to recalculate.<br><br><b>Youngs Modulus</b>:  ' + doc.yield_strength_02_mpa + ' GPa<br><b>Yield stress:</b>  ' + doc.young_mod_gpa + ' MPa')
                }

                $("#test_status").hide()
                console.log(currentTest)
            }).then(function(){
                processData(currentTest.measurements, prepareDownload)
            }).catch(function(err){
                        console.log(err)
                    $('#test_status').show()
            })
}


function plotData(){
    processData(currentTest.measurements, prepareDownload)
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

var measurements = currentTest.measurements.map(function(d,i){
    var strainrate = chart_sr.options.data[0].dataPoints[i].y
    var strain = chart_4.options.data[2].dataPoints[i].x
    var fricStress = chart_4.options.data[1].dataPoints[i].y
    var isoStress = chart_4.options.data[2].dataPoints[i].y

d.strain = strain
d.strainrate = strainrate
d.fricStress = fricStress
d.isoStress = isoStress

return d

})

    console.log("Saved data")
    console.log(currentTest)
    pouchdb.get( currentTest._id ).then(function(doc) {
        currentTest._rev = doc._rev
      return pouchdb.put( currentTest );
        }).then(function(response) {
            console.log(response);
        $('#saveData').html("Data saved OK").addClass('btn-success').delay(2000)
        .queue(function(n) {
               $(this).html("Save Data");
               $(this).removeClass('btn-success')
               n();
           })

    }).catch(function (err) {
      console.log(err);
    });


}

function loadData(){

    $('input').each(function(){
        if(!$(this).val() && $(this).attr('name')){
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

function processData(data, callback) {
    //console.log(currentTest)
    plot_raw(data)
    plot_stroke(data)
    calculate_barrelling()
    plot_strain(data)
    calcStrain()
    plot_sr(data)
    calcStrainRate()
    plot_stress()
    calcStress()
    calcFricCorrStress()
    calcIsoStress()
    plot_temp(data)
    callback()
}


function calculate_barrelling(){
    var dimensions = currentTest.sample.dimensions
    var diameter_end = dimensions.av_d_final
    var diameter_mid = dimensions.av_d_mid_final
    var barrel_ratio = (dimensions.av_h_final * ( dimensions.av_d_final ** 2))/(dimensions.av_h_initial * ( dimensions.av_d_initial ** 2))
    $('#barrel_ratio').val(barrel_ratio)
        console.log(barrel_ratio)
}

function prepareDownload(){
    var isoDataPoints = chart_4.options.data[2].dataPoints
    var fricDataPoints = chart_4.options.data[1].dataPoints
    var rawDataPoints = chart_4.options.data[0].dataPoints
    //console.log(dataPoints)
    var data = []
    data[0] = "True Strain (mm), Raw Stress (MPa),Fric Corr Stress (MPa), True Iso Stress (MPa)\r\n"
    console.log("Data length = " + isoDataPoints.length + ",  " + fricDataPoints.length+ ",  " + rawDataPoints.length)
    for(var i=0; i<fricDataPoints.length; i++){
        var isoPoint = isoDataPoints[i]
        var fricPoint = fricDataPoints[i]
        var rawPoint = rawDataPoints[i]
        if(rawPoint.x && rawPoint.y && fricPoint.y && rawPoint.x > 0.0){
            data.push(rawPoint.x + "," + rawPoint.y + "," + fricPoint.y + "," + isoPoint.y + "\r\n")
    //        console.log(point)
        }
    }
    console.log("Data to download")
    console.log(data)
    data.join()

    var blob = new Blob(data, {type: "text/.txt"});
    var url = URL.createObjectURL(blob);
    export_SS.attr('href', url )
    export_SS.attr('download', currentTest._id + "_analysed_data.txt" )

}

$('#sampling_period').on("input", function(){
    smoothRawData($(this).val())
})













function smoothRawData(period){
    console.log(period)
    currentTest.sampling = []

    for(var i=0; i< currentTest.measurements.length;i+=parseInt(period) ){
        console.log(i)
            currentTest.sampling.push(currentTest.measurements[i])
    }

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











    console.log(currentTest.sampling)
    processData(currentTest.sampling, prepareDownload)

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

    console.log("Friction mu_0 = " + currentTest.mu_0 )
    chart_4.options.data[1].dataPoints = heights.map(function(d, i){
        var factor = 1 / ( 1 + ( ( 2 * currentTest.mu_0  * radii[i] )  / ( d.x  * Math.sqrt(3) * 3  ) ))
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
    /*
    panel.parent().find(".panel").each(function(){
        var panel_body = $(this).find(".panel-body").hide(50);
        var panel_heading = $(this).find(".panel-heading i.fa")
        panel_heading.addClass("fa-caret-down");
        panel_heading.removeClass("fa-caret-up");
    })
    */
    var body = panel.find('.panel-body');
    //console.log(body)
    body.toggle(50)
    //panel.find('panel-heading i.fa').addClass("fa-caret-up");

})



function plot_raw(data) {
    console.log('Plotting load stroke graph');
    console.log(data)
     chart_1 = new CanvasJS.Chart("graph_1",
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
            text: "Load - Sample Height",
            fontColor: "#000",
            fontfamily: "Arial",
            fontSize: 20,
            padding: 8
        },
        legend: { fontSize: 14,
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
         lineThickness: 1
     },
        data:[
        {
            connectNullData: false,
            type: "line",
            showInLegend: true,
            name: "Raw Data",
            color: "#333",
            toolTipContent: "Height: {x} mm, Load: {y} kN",
            dataPoints: data.map(function(d){
                if(!d.displacement){
                    d.displacement = 0.0
                    d.load = null
                }
                return {"x": d.displacement , "y": -d.load, "label": "Raw" }
            })
        }]
    });

    chart_1.render();

   }


   function plot_sr(data) {
       console.log('Plotting load stroke graph');

        chart_sr = new CanvasJS.Chart("graph_sr",
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
               text: "Strain rate - Sample Height",
               fontColor: "#000",
               fontfamily: "Arial",
               fontSize: 20,
               padding: 8
           },
           legend: { fontSize: 14,
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
            lineThickness: 1,
            viewportMinimum: 0.0,
            viewportMaximum: currentTest.strainrate * 5
        },
           data:[
           {
               connectNullData: false,
               type: "line",
               showInLegend: true,
               name: "Raw Data",
               color: "#333",
               toolTipContent: "Height: {x} mm, Strain rate: {y} /s",
               dataPoints: data.map(function(d){

                   return {"x": d.displacement , "y": d.strainrate, "label": "Raw" }
               })
           }]
       });

       chart_sr.render();

      }



   function plot_stroke(data) {
       console.log('Plotting load stroke graph');

        chart_2 = new CanvasJS.Chart("graph_2",
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
               text: "Load - Stroke",
               fontColor: "#000",
               fontfamily: "Arial",
               fontSize: 20,
               padding: 8
           },
           legend: { fontSize: 14,
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
               title: "Stroke (mm)",
               fontColor: "#000",
               fontfamily: "Arial",
               titleFontSize: 20,
               labelFontSize: 12,
               lineColor: "#000",
               tickColor: "#000",
               labelFontColor: "#000",
               titleFontColor: "#000",
               lineThickness: 1,
               gridThickness: 1,
               gridDashType: "solid",
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
           data:[
           {
               connectNullData: false,
               type: "line",
               showInLegend: true,
               name: "Raw Data",
               color: "#333",
               toolTipContent: "Height: {x} mm, Load: {y} kN",
               dataPoints: data.map(function(d){
                   return {"x": currentTest.sample.dimensions.av_h_initial - d.displacement , "y": d.load, "label": "Stroke" }
               })
           },
           {
               connectNullData: false,
               type: "line",
               showInLegend: true,
               name: "Zero offset",
               color: "#d34",
               toolTipContent: "Stroke: {x} mm, Load: {y} kN",
               dataPoints: data.map(function(d){
                   return {"x": currentTest.sample.dimensions.av_h_initial - d.displacement - currentTest.zero_offset , "y": d.load - currentTest.load_offset, "label": "Stroke-offset" }
               })
           }

       ]
       });

       chart_2.render();

      }



      function plot_strain(data) {
          console.log('Plotting load strain graph');

           chart_3 = new CanvasJS.Chart("graph_3",
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
                  text: "Load - Strain",
                  fontColor: "#000",
                  fontfamily: "Arial",
                  fontSize: 20,
                  padding: 8
              },
              legend: { fontSize: 14,
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
                  title: "Strain (mm/mm)",
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
                  viewportMaximum : -Math.log(( currentTest.sample.dimensions.av_h_final / currentTest.sample.dimensions.av_h_initial )) + 0.3
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
               viewportMaximum: 0.0,
               reversed:  true
           },
              data:[
              {
                  type: "line",
                  showInLegend: true,
                  name: "Calc Data",
                  color: "#d34",
                  toolTipContent: "True strain: {x} mm, Load: {y} kN",
                  dataPoints: []
              }
          ]
          });

          chart_3.render();

         }


function plot_stress(data) {

    export_SS.show(200)


             console.log('Plotting stress strain graph');

              chart_4 = new CanvasJS.Chart("graph_4",
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
                     text: "True Stress - True Strain",
                     fontColor: "#000",
                     fontfamily: "Arial",
                     fontSize: 20,
                     padding: 8
                 },
                 legend: { fontSize: 14,
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
                     title: "True Strain (mm/mm)",
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
                     viewportMaximum: -Math.log(( currentTest.sample.dimensions.av_h_final / currentTest.sample.dimensions.av_h_initial )) + 0.3
             },
             axisY:
                {
                  title: "True Stress (MPa)",
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
                 data:[
                 {
                     type: "line",
                     showInLegend: true,
                     name: "Raw Stress",
                     color: "#d34",
                     toolTipContent: "True strain: {x}, Raw Stress: {y} MPa",
                     dataPoints: []
                 },
                 {
                     type: "line",
                     showInLegend: true,
                     name: "Fric. Corr. Stress",
                     color: "#3d4",
                     toolTipContent: "True strain: {x}, Fric. Corr. Stress: {y} MPa",
                     dataPoints: []
                 },
                 {
                     type: "line",
                     showInLegend: true,
                     name: "Isothermal Stress",
                     color: "#34d",
                     toolTipContent: "True strain: {x}, Isothermal Stress: {y} MPa",
                     dataPoints: []
                 },
                 {
                     type: "line",
                     name: "Yield alignment",
                     color: "#ee3",
                     toolTipContent: "Yield alignment",
                     dataPoints: []
                 },
                 {
                     type: "line",
                     name: "Yield calculation line",
                     color: "#3cd",
                     toolTipContent: "Yield calculation line",
                     dataPoints: [{x:0.02, y:0}]
                 }
             ]
             });

             chart_4.render();



            }

            function plot_temp(data) {
                currentTest.analysed = true;

                         console.log('Plotting temp strain graph');

                          chart_5 = new CanvasJS.Chart("graph_temp",
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
                                 text: "Temperature - True Strain",
                                 fontColor: "#000",
                                 fontfamily: "Arial",
                                 fontSize: 20,
                                 padding: 8
                             },
                             legend: { fontSize: 14,
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
                                 title: "True Strain (mm/mm)",
                                 fontColor: "#000",
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
                              lineThickness: 1,
                              viewportMinimum: currentTest.temperature - 100,
                              viewportMaximum :currentTest.temperature + 100,
                          },
                             data:[
                                 {
                                     connectNullData: false,
                                     type: "line",
                                     showInLegend: true,
                                     name: "Zero offset",
                                     color: "#d34",
                                     toolTipContent: "Stroke: {x} mm, Load: {y} kN",
                                     dataPoints: data.map(function(d, i){

                                            var strain = chart_4.options.data[1].dataPoints[i].x

                                            var temperature = d.sample_temp_2_centre
                                            if(!temperature){
                                                var temperature = 20.0
                                            }
                                            //console.log(strain , temperature)
                                            if(isNaN(strain)){
                                                strain = 0.0
                                                temperature = null
                                            }


                                         return {"x": strain , "y": temperature, "label": "Temperature" }
                                     })
                                 }
                         ]
                         });

                         chart_5.render();



                        }




function parseData(data, x_name, y_name, label){
    //console.log(label)
       var parsed_data = data.map(function(d){
           return {"x": d[x_name]  , "y": d[y_name], "label": label }
       })
       //console.log(parsed_data)
       return parsed_data
}
