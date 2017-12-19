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
var samplingNum = $("#sampingNum");

var settingsDiv = $('#settingsDiv');

var displacement_offset = $('#displacement_offset');
var displacement_offset_range = $('#displacement_offset_range');
var load_offset = $('#load_offset');
var load_offset_range = $('#load_offset_range');
var zero_offset = $('#zero_offset');
var load_offset = $('#load_offset');
var export_SS = $("#export_SS");

var chart_raw = "";
var chart_stroke = "";
var chart_3 = "";
var chart_stress = "";
var chart_sr = "";



var currentTest = "";
var vol_cold = 0.0;
var vol_hot = 0.0;

var changesMade = false;

//setup the in-memory database to save the uploaded flow stress data and saved fitted parameters


var pouchdb = new PouchDB('flowstress')
pouchdb.info().then(function (info) {
  console.log(info);
})


    displacement_offset.on('input', function(){
        scrollTo('graph_2')
        var value = $(this).val();
        displacement_offset_range.val(value)
        currentTest.zero_offset = value;
        calcDispOffset()
        changesMade = true
    })

    displacement_offset_range.on('input', function(){
        scrollTo('graph_2')
        var value = $(this).val();
        displacement_offset.val(value)
        currentTest.zero_offset = value;
        calcDispOffset()
        changesMade = true
    })

    load_offset.on('input', function(){
        scrollTo('graph_1')
        var value = $(this).val();
        load_offset_range.val(value)
        currentTest.load_offset = value;
        calcLoadOffset(chart_raw.options.data[1].dataPoints) // Use the stiffness corrected raw data
        changesMade = true


    })

    load_offset_range.on('input', function(){
        scrollTo('graph_1')
        var value = $(this).val();
        load_offset.val(value)
        currentTest.load_offset = value;
        calcLoadOffset(chart_raw.options.data[1].dataPoints) // Use the stiffness corrected raw data
        changesMade = true
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





})


$('#startLinear').on('click', function(){
    scrollTo('graph_2')
    startLinearCalculation()
})

$('#stopLinear').on('click', function(){
    stopLinearCalculation()
})


$('#startYield').on('click', function(){
    scrollTo('graph_4')
    startYieldCalculation()
})

$('#stopYield').on('click', function(){
    stopYieldCalculation()
})




function stopYieldCalculation(){
    $('#stopYield').attr("disabled", true)
    $('#startYield').attr("disabled", false)
    $('#yieldCalcMsg').html('Yield calculation finished');
    processData(currentTest.measurements)

}





function startYieldCalculation(){

    $('#stopYield').attr("disabled", false)
    $('#startYield').attr("disabled", true)
    $('#yieldCalcMsg').html('Click at end of elastic region on <span style="color:lightgreen">green</span> line');
    console.log(chart_stress)
    var chart_options = chart_stress.options;
    var ss_points = chart_options.data[0].dataPoints;



    chart_stress.options.axisX.viewportMinimum = 0.0
    chart_stress.options.axisX.viewportMaximum = 0.1
    chart_stress.render()



    chart_options.data[1].click  = function(e){
            console.log(e)
        chart_options.data[3].dataPoints = [{x:0,y:0}]
        chart_options.data[4].dataPoints = [{x:0.002,y:0}]
        chart_options.data[3].dataPoints.push({ x: e.dataPoint.x , y: e.dataPoint.y })

        var m = (chart_options.data[3].dataPoints[1].y - chart_options.data[3].dataPoints[0].y)/ (chart_options.data[3].dataPoints[1].x - chart_options.data[3].dataPoints[0].x)
        console.log("Youngs modulus = " + ( m / 1000.0 ) + "GPa")
        currentTest.young_mod_gpa = (m / 1000.0).toFixed(2)
        //console.log()

        var y =  e.dataPoint.y * 2.0
        var x =  (y / m) + 0.002

        chart_options.data[4].dataPoints.push( { "x": x , "y": y})

        var stresses = Array.from( chart_options.data[1].dataPoints, d => +d.y || 0.0 )
        console.log( stresses )
        currentTest.compressive_strength = Math.max(stresses)




        chart_stress.render()
        $('#yieldCalcMsg').html('Click at the point the <span style="color:lightblue">blue</span> line crosses the <span style="color:lightgreen">green</span> line');
        chart_options.data[1].click  = function(e){
            console.log("Yield Stress = " + e.dataPoint.y + " MPa" )
            currentTest.yield_strength_02_mpa = e.dataPoint.y.toFixed(2)
            chart_options.data[1].click  = null
            stopYieldCalculation()
            $('#yieldCalcMsg').html('Yield calculation finished<br>Youngs Modulus:  ' + (m / 1000.0).toFixed(2) + ' GPa<br>Yield stress:  ' + (e.dataPoint.y).toFixed(2) + ' MPa<br>Ultimate compressive strength:  ' + currentTest.compressive_strength + ' MPa')
        }


    }


    //chart_options.data[1].click = null


}

function startLinearCalculation(){

    $('#stopLinear').attr("disabled", false)
    $('#startLinear').attr("disabled", true)
    chart_stroke.options.data[1].visible = false;
    chart_stroke.options.axisX.viewportMinimum = -1.0
    chart_stroke.options.axisX.viewportMaximum = 1.0

    $('#linearCalcMsg').html('Click at start of linear region on the black line');
    console.log(chart_stroke)
    var chart_options = chart_stroke.options;
    chart_options.data[2] = {
        name: 'Linear fit',
        color: '#292',
        type: 'line',
        dataPoints: []
    };
    chart_stroke.render()

    var clicks = 0;


    chart_options.data[0].click  = function(e){
        clicks += 1
        if(clicks < 2){//First click
            console.log(e)
            chart_options.data[2].dataPoints.push({ x: e.dataPoint.x , y: e.dataPoint.y })
            $('#linearCalcMsg').html("Click at the end of the linear region")
            chart_stroke.render()
        }
        else if(clicks == 2){//Second click
            console.log(e)
            chart_options.data[2].dataPoints.push({ x: e.dataPoint.x , y: e.dataPoint.y })
            $('#linearCalcMsg').html("Fitting straight line!")
            var m = (chart_options.data[2].dataPoints[1].y - chart_options.data[2].dataPoints[0].y)/ (chart_options.data[2].dataPoints[1].x - chart_options.data[2].dataPoints[0].x)
            var intercept = chart_options.data[2].dataPoints[1].y - (m * chart_options.data[2].dataPoints[1].x)

            currentTest.zero_offset = - intercept / m
            //Plot the fitted line
            chart_options.data[3] = {
                name: 'Linear fit',
                color: '#229',
                type: 'line',
                dataPoints: [   {"x":0, "y":0},
                                {"x":0.5  , "y": ((m * 0.5) + intercept)   }  ]
            };
            chart_stroke.render()

            if(confirm("Are you happy with the fitted line?")){
                chart_stroke.options.data[1].visible = true;


                chart_stroke.render()
                $('#displacement_offset').val(currentTest.zero_offset.toFixed(3))
                $('#displacement_offset_range').val(currentTest.zero_offset.toFixed(3))
                $('#linearCalcMsg').html("Line has equation:  Y = " + m.toFixed(3) + " X + " + intercept.toFixed(3) +"<br /><br />Data has been offset by " + currentTest.zero_offset.toFixed(3) + " mm")
                stopLinearCalculation()
                calcDispOffset()

            }
            else {
                stopLinearCalculation()
            }


        }




    }


    chart_options.data[1].click = null

}

function stopLinearCalculation(){
    $('#stopLinear').attr("disabled", true)
    $('#startLinear').attr("disabled", false)
    //$('#linearCalcMsg').html('Offset calculation finished');
    processData(currentTest.measurements)
}




function getSingleTest(){
    tableBody.html("");
    pouchdb.get( currentTest , { attachments : true } )
            .then(function(doc){
                currentTest = doc; // Load the data into the variable 'currentTest' to be used for all subsquent analysis work
                console.log(doc)
                tableBody.append("<tr name='"+ doc._id +"'><td>"+ doc._id  +"</td>\
                <td ><input class='form-control header_input' name='sample_user' type='text' /></td>\
                <td name='sample_musfile'>"+  doc.sample.name.musfile_defined +"</td>\
                <td > <input class='form-control header_input' name='temperature' type='number' /></td>\
                <td > <input class='form-control header_input' name='strainrate' type='number' /></td></tr>")
                if(doc.yield_strength_02_mpa && doc.young_mod_gpa){
                    $('#yieldCalcMsg').html('Yield calculation already completed.<br>Click START to recalculate.<br><br><b>Youngs Modulus</b>:  ' + doc.yield_strength_02_mpa + ' GPa<br><b>Yield stress:</b>  ' + doc.young_mod_gpa + ' MPa')
                }

                // Load compliance values one by one into the dropdown box $("#stiffness")
                $.each(compliance_json, (function(key, val){
                    //console.log(key, val)
                    $('#stiffness').append("<option value='"+ key +"'>"+ val.name +" : "+ val.value + " " + val.units +"</option>")
                    })
                )


                $("#test_status").hide()
                return doc
            }).then(function(){
                    loadData()

                    if(currentTest.analysed == true){
                        processData(currentTest.measurements, prepareDownload)}
                    else{
                        processData(currentTest.measurements)
                    }
                    checkCompliance()
            }).catch(function(err){
                    console.log(err)
                    $('#test_status').show()
            })
}





function plotData(measurements){
    processData(measurements)
/*
    plot_raw(measurements)
    plot_temp(measurements)
    plot_sr(measurements)
    plot_stroke(measurements)
    calculate_barrelling()
    plot_stress()
    */
}



function saveData(){

    $('input').each(function(){
        if($(this).attr('name')){
            var name = $(this).attr('name')
            var value = $(this).val()
            if($(this).attr('type') == "number"){
                 value =  +$(this).val()
                 //console.log(name, value)

            }
            else if( name.includes("h_") || name.includes("d_") && !name.includes("load")){
                //console.log(name, value)
                currentTest.sample.dimensions[name] = value;
            }
            else if (name == "sample_user"){
                currentTest.sample.name.user_defined = value
            }
            else{
                //console.log($(this).attr('name'), $(this).val())
                localStorage[name] = value;
                currentTest[name] = value;
            }
        }
    })



        var measurements = currentTest.measurements.map(function(d,i){
            var disp_corr = chart_stroke.options.data[2].dataPoints[i].x || null
            var load_corr = chart_raw.options.data[1].dataPoints[i].y || null
            var strainrate = chart_sr.options.data[0].dataPoints[i].y || null
            var strain = chart_stress.options.data[2].dataPoints[i].x || null
            var fricStress = chart_stress.options.data[1].dataPoints[i].y || null
            var isoStress = chart_stress.options.data[2].dataPoints[i].y || null
            d.disp_corr = disp_corr
            d.load_corr = load_corr
            d.strain = strain
            d.strainrate = strainrate
            d.fricStress = fricStress
            d.isoStress = isoStress
            if(d.disp_corr && d.load_corr && d.strain && d.strainrate && d.fricStress){
                console.log("Your test has been analysed fully. Well done!")
                currentTest.analysed = true;
            }

            return d

        })

    console.log("Saved data")
    //console.log(currentTest)

    pouchdb.get( currentTest._id ).then(function(doc) {
            currentTest._rev = doc._rev
            //console.log(currentTest)
            return pouchdb.put( currentTest );
        }).then(function(response) {
            console.log(response);
        $('#saveData').html("Data saved OK").addClass('btn-success').delay(2000)
        .queue(function(n) {
               $(this).html("Save Data");
               $(this).removeClass('btn-success')
               n();
           })

    }).then(function(result){
        if(currentTest.analysed == true){
            processData(currentTest.measurements, prepareDownload)
        }
        else{
            processData(currentTest.measurements)
        }
    }).catch(function (err) {
      console.log(err);
    });




}

function loadData(){

    $('input').each(function(){
        if( $(this).attr('name') && !$(this).val()){
            var name = $(this).attr('name')
            if( name.includes("h_") || name.includes("d_") && !name.includes("load")){
                $(this).val(currentTest.sample.dimensions[name]);
                //console.log(name + ": " + currentTest.sample.dimensions[name])
            }
            else if (name == "sample_user"){
                $(this).val(currentTest.sample.name.user_defined);
            }
            else {
                $(this).val(currentTest[name]);
            }
            //console.log($(this).attr('id'), currentTest[name])
        }


        if( currentTest.thermal_expansion ){
            //Check if the test has a saved CTE value and use that if it does
            $('#thermal_expansion').val(currentTest.thermal_expansion)
        }
        else{
            //Use a default value for CTE if one is not saved
            $('#thermal_expansion').val(0.0000128)
        }

        if( currentTest.deformation_temperature ){
            //Check to see if there is an existing user defined deformation temperature and use it if so
            $('#deformation_temperature').val(currentTest.deformation_temperature)
        }
        else{
            $('#deformation_temperature').val(currentTest.temperature)
        }

        if( currentTest.zero_offset ){
            //Check to see if there is an existing user defined deformation temperature and use it if so
            $('#displacement_offset').val(currentTest.zero_offset)
        }
        else{
            $('#displacement_offset').val(0.0)
        }

        if( currentTest.load_offset){
            //Check to see if there is an existing user defined deformation temperature and use it if so
            $('#load_offset').val(currentTest.load_offset)
        }
        else{
            $('#load_offset').val(0.0)
        }





    })






    console.log("Loaded data")
    $('#loadData').html("Data loaded").delay(1000).html("Load data")
}


$("input[name^='h_initial_']").on('change', function(){
        var sum = 0.0;
        var num_inputs = 0;
        $("input[name^='h_initial_'").each(function(){
            //console.log($(this))
            if($(this).val() > 0.0){
                sum += parseFloat( $(this).val() )
                num_inputs++
                //console.log("sum of sample initial heights = " + sum)
            }
        })
        var av_height_initial = sum / (num_inputs)
        //console.log("Average sample height = " + av_height_initial, num_inputs)
        $('#av_h_initial').val(av_height_initial)
        currentTest.sample.dimensions.av_h_initial = +av_height_initial
        console.log(currentTest)
        calculateDimensions()
        calcDispOffset()

})

$("input[name^='h_final_']").on('change', function(){
        var sum = 0.0;
        var num_inputs = 0;
        $("input[name^='h_final_'").each(function(){
            //console.log($(this).val())
            if($(this).val() > 0.0){
                sum += parseFloat( $(this).val() )
                num_inputs++
                //console.log("sum of sample final heights = " + sum)
            }
        })
        var av_height_final = sum / (num_inputs)
        //console.log("Average sample height = " + av_height_final)
        $('#av_h_final').val(av_height_final)
        currentTest.sample.dimensions.av_h_final = +av_height_final
        calculateDimensions()

})

$("input[name^='d_initial_']").on('change', function(){
    var sum = 0.0;
    var num_inputs = 0;
    $("input[name^='d_initial_'").each(function(){
        //console.log($(this).val())
        if($(this).val() > 0.0){
            sum += parseFloat( $(this).val() )
            num_inputs++
            //console.log("sum of sample initial diameters = " + sum)
        }
    })
    var av_diameter_initial = sum / (num_inputs)
    //console.log("Average sample diameter = " + av_diameter_initial)
    $('#av_d_initial').val(av_diameter_initial)
    currentTest.sample.dimensions.av_d_initial = +av_diameter_initial
    calculateDimensions()
    calculate_barrelling()

})
$("input[name^='d_final_']").on('change', function(){
    var sum = 0.0;
    var num_inputs = 0;
    $("input[name^='d_final_'").each(function(){
        //console.log($(this).val())
        if($(this).val() > 0.0){
            sum += parseFloat( $(this).val() )
            num_inputs++
            //console.log("sum of sample final diameters = " + sum)
        }
    })
    var av_diameter_final = sum / (num_inputs)
    //console.log("Average sample diameter = " + av_diameter_final)
    $('#av_d_final').val(av_diameter_final)
    currentTest.sample.dimensions.av_d_final = +av_diameter_final
    calculateDimensions()
    calculate_barrelling()
})






function hot_dimension(dimension, cte, temp, ref_temp){
    var size = dimension + (cte * dimension * ( temp - ref_temp))
    //console.log(size)
    return size
}



function calculateDimensions(){
    var therm_ex_coeff = parseFloat($('#thermal_expansion').val());
    if( $('#deformation_temperature').val() > 0.0 ){
        //User suppiled deformation temperature
        var def_temp = parseFloat($('#deformation_temperature').val());
    }
    else{
        //Use default deformation tempeature found in FTTU section in musfile
        var def_temp = parseFloat(currentTest.temperature);
    }
    vol_cold = currentTest.sample.dimensions.av_h_initial * Math.PI * (currentTest.sample.dimensions.av_d_initial/2) **2
    currentTest.sample.dimensions.vol_cold = vol_cold


    if(currentTest.sample.dimensions.av_h_initial){
        currentTest.sample.dimensions.h_hot_initial = hot_dimension(currentTest.sample.dimensions.av_h_initial, therm_ex_coeff, def_temp, 20)
        $('#h_hot_initial').val(currentTest.sample.dimensions.h_hot_initial.toFixed(3) )
    }
    if(currentTest.sample.dimensions.av_h_final){
        currentTest.sample.dimensions.h_hot_final = hot_dimension(currentTest.sample.dimensions.av_h_final, therm_ex_coeff, def_temp, 20)
        $('#h_hot_final').val(currentTest.sample.dimensions.h_hot_final.toFixed(3) )
    }
    if(currentTest.sample.dimensions.av_d_initial){
        currentTest.sample.dimensions.d_hot_initial = hot_dimension(currentTest.sample.dimensions.av_d_initial, therm_ex_coeff, def_temp, 20)
        $('#d_hot_initial').val(currentTest.sample.dimensions.d_hot_initial.toFixed(3) )
    }
    if(currentTest.sample.dimensions.av_d_final){
        currentTest.sample.dimensions.d_hot_final = hot_dimension(currentTest.sample.dimensions.av_d_final, therm_ex_coeff, def_temp, 20)
        $('#d_hot_final').val(currentTest.sample.dimensions.d_hot_final.toFixed(3) )
    }
    if(currentTest.sample.dimensions.h_hot_initial && currentTest.sample.dimensions.d_hot_initial){
        vol_hot = currentTest.sample.dimensions.h_hot_initial * Math.PI * (currentTest.sample.dimensions.d_hot_initial/2) **2
        currentTest.sample.dimensions.vol_hot = vol_hot
    }

    changesMade = true
}


$('#thermal_expansion, #deformation_temperature, input[name^="h_"], input[name^="d_"]').on('change', function(){
        calculateDimensions()
        processData(currentTest.measurements)
        changesMade = true
})


$('#iso_period').on('input change', function(){
    $('#iso_period_value').html( $(this).val() )
})

$('#manualDisp').on('click', function(){
    scrollTo('graph_2')
    $('#manualDiv').toggle()
    $(this).find('i').toggleClass('fa-caret-down')
})

/*
$('#analysed').on('click', function(){
        console.log("Test set to 'Analysed'")
        currentTest.analysed = true
})
*/




function processData(data, callback) {
    plot_raw(data)
    checkCompliance()
    plot_stroke(data)
    plot_temp(data)
    calculate_barrelling()
    calcStrain()
    plot_sr(data)
    calcStrainRate()
    plot_stress()
    calcStress()
    calcFricCorrStress()
    calcIsoStress()


    if( typeof callback == 'function'){
        callback();
    }

}


function calculate_barrelling(){
    var dimensions = currentTest.sample.dimensions
    //console.log(dimensions)

    if( dimensions.av_d_initial && dimensions.av_h_initial && dimensions.av_d_final && dimensions.av_h_final  ){
            var barrel_ratio = (dimensions.av_h_final * ( dimensions.av_d_final ** 2))/(dimensions.av_h_initial * ( dimensions.av_d_initial ** 2))


            $('#barrel_ratio').val(barrel_ratio.toFixed(2))
            if(barrel_ratio <= 1.1){
                $('#barrel_ratio').css('background-color','#292')
                $('#test_validity').html('Valid test')
            }
            else if( barrel_ratio > 1.1 ){
                $('#barrel_ratio').css('background-color','#922')
                $('#test_validity').html('Invalid test')
            }
        }
    //console.log("Barrelling ratio = " + barrel_ratio)
}


function prepareDownload(){
    console.log("Preparing download. Please wait...")
    var isoDataPoints = chart_stress.options.data[2].dataPoints
    var fricDataPoints = chart_stress.options.data[1].dataPoints
    var rawDataPoints = chart_stress.options.data[0].dataPoints
    //console.log(dataPoints)
    var data = []
    data[0] = "True Strain (mm), True Stress (MPa), True Friction Corrected Stress (MPa), True Isothermal Stress (MPa)\r\n"
    //console.log("Data length = " + isoDataPoints.length + ",  " + fricDataPoints.length+ ",  " + rawDataPoints.length)

    for(var i=0; i<fricDataPoints.length; i++){
        var isoPoint = isoDataPoints[i]
        var fricPoint = fricDataPoints[i]
        var rawPoint = rawDataPoints[i]
        if(rawPoint.x && rawPoint.y >= 0.0 && fricPoint.y >= 0.0 && rawPoint.x >= 0.0){
            data.push(rawPoint.x + "," + rawPoint.y + "," + fricPoint.y + "," + isoPoint.y + "\r\n")
    //        console.log(point)
        }
    }

    data.join()

    var blob = new Blob(data, {type: "text/.txt"});
    var url = URL.createObjectURL(blob);
    export_SS.attr('href', url )
    export_SS.attr('download', currentTest._id + "_analysed_data.txt" )
    console.log("Download is ready!")



}






$('#sampling_period').on("change", function(){
    smoothRawData($(this).val());
    samplingNum.html($(this).val + ' samples');
})
















function smoothRawData(period){
    console.log(period)
    currentTest.sampling = [];

    for(var i=0; i< currentTest.measurements.length;i+=parseInt(period) ){
        console.log(i)
            currentTest.sampling.push(currentTest.measurements[i])
    }

    //console.log(currentTest.sampling)
    processData(currentTest.sampling, prepareDownload)

}



function calcLoadOffset(dataPoints){
    var delta_load = load_offset.val()

    chart_raw.options.data[2].dataPoints = dataPoints.map(function(d, i){
        currentTest.measurements[i].load_corr = d.y - delta_load
        return { "x": d.x, "y": d.y - delta_load , "label": d.label}
    })


    chart_raw.render()
    calcDispOffset()
}







function calcDispOffset(){
    var dataPoints_uncorr = chart_stroke.options.data[1].dataPoints
    var dataPoints_corr = chart_stroke.options.data[2].dataPoints
    var delta_stroke = displacement_offset.val()
    var delta_load = load_offset.val()
    // Find the maximum value of displacement in the valid portion of the test data (typically at max load but check for excessive load cell noise in the raw data (zoom in on the graph!))
    var d_0_max = 0.0;
    var load_max = 0.0
    //console.log(dataPoints)
    for(var i=0; i<dataPoints_corr.length;i++){
        var this_disp = dataPoints_corr[i].x;
        //console.log(this_load)
        // If the latest load is higher than the currently stored on replace it
        if(this_disp > d_0_max && dataPoints_corr[i].y < 0.0 ){
            d_0_max = this_disp
        }
    }
    //console.log('d_0_max = '  +  d_0_max)
    currentTest.d_0_max = d_0_max

    chart_stroke.options.data[2].dataPoints = dataPoints_corr.map(function(d, i){

        var d_corr = ( d.x ) * ( ( currentTest.sample.dimensions.h_hot_initial - currentTest.sample.dimensions.h_hot_final   )  / ( (d_0_max) ) )
        currentTest.measurements[i].disp_corr = d_corr
        return { "x": d_corr, "y": d.y , "label": d.label}
    })
    chart_stroke.render()
}









function calcStrain(){
    var heights = chart_stroke.options.data[2].dataPoints
    heights.map(function(d, i){
        var strain = -Math.log(parseFloat(currentTest.sample.dimensions.h_hot_initial - d.x ) / currentTest.sample.dimensions.h_hot_initial )
        currentTest.measurements[i].strain = strain
        if(isNaN(strain)){
            strain = 0.0
        }
    })
}

function calcStrainRate(){
    var heights = chart_stroke.options.data[2].dataPoints
    chart_sr.options.data[0].dataPoints = heights.map(function(d, i){
        var height =  currentTest.sample.dimensions.h_hot_initial - d.x
        var velocity = currentTest.measurements[i].velocity_
        var strainrate = velocity / height
        return { "x": height, "y": strainrate, "label": "Strain rate"}
    })
    graph_sr_Parent.show()
    chart_sr.render()
}




function calcStress(){
    var area_0 = Math.PI * ((parseFloat(currentTest.sample.dimensions.d_hot_initial)/2)**2)

    var strokes = chart_stroke.options.data[2].dataPoints
    var max_strain = 0.0
    chart_stress.options.data[0].dataPoints = strokes.map(function(d, i){
        var strain = currentTest.measurements[i].strain
        if(strain > max_strain){
            max_strain = strain
        }
        //console.log(strain)
        var h_i_hot = currentTest.sample.dimensions.h_hot_initial - d.x
        //console.log(h_i_hot)
        var d_i_hot = Math.sqrt(( 4 * currentTest.sample.dimensions.vol_hot ) / ( Math.PI * h_i_hot))
        //console.log(d_i_hot)
        var area_i_hot = Math.PI * ( ( d_i_hot / 2 ) ** 2 )
        var stress = - ( d.y / area_i_hot ) * 1000.0

        if( strain >= 0.0 && strain <= max_strain ){
            return { "x": strain, "y": stress, "label": "Strain"}
        }
        else{
            return { "x": strain, "y": null, "label": "Strain"}
        }
    })
    //chart_stress.render()
}





function calcFricCorrStress(){

    // HOT heights!!!!!!
    var heights = chart_stroke.options.data[2].dataPoints.map(function(d, i){
            var h_inst =  currentTest.sample.dimensions.h_hot_initial - d.x

        return { "x": h_inst, "y": d.y }
    })

    //True stress uncorrected for friction
    var stresses = chart_stress.options.data[0].dataPoints
    var radii = heights.map(function(d){
         return Math.sqrt(( currentTest.sample.dimensions.vol_hot ) / ( Math.PI * d.x  ))
    })
    //console.log(heights, stresses, radii)

    var friction_type = $('input[name="optradio"]:checked').attr('box')
    console.log("Friction type = " + friction_type)

    switch(friction_type){
        case "linear_fric":
        console.log("Using linear friction correction")
            linearFric(heights, radii, stresses)
            chart_stress.render()
            break
        case "bilinear_fric":
            console.log("Using bilinear friction correction")
            bilinearFric(heights, radii, stresses)
            chart_stress.render()
            break
        case "pressure_fric":
            console.log("Using pressure dependant friction correction")
            pressureFric(heights, radii, stresses)
            chart_stress.render()
            break
        default:
            console.log("No friction correction")
            chart_stress.render()
        break
    }

}








function linearFric(heights, radii, stresses){
    $('#pc_corrected').html('0.0 %')
    $('#pc_corrected').show()
    var m_bar = $('#m_bar').val()

    //Set the friction correction type and value(s) for the test
    currentTest.friction_correction = {
        "type" : "linear",
        "m_bar" : m_bar
    }
    chart_stress.options.data[1].dataPoints = heights.map(function(d, i){
        var percent = ( i * 100 / heights.length)
        //console.log("% of test corrected = " + percent.toFixed(1) + " %")
        $('#pc_corrected').html(percent.toFixed(1) + " %")
        var factor = 1 / ( 1 + ( ( 2 * m_bar  * radii[i] )  / ( d.x  * Math.sqrt(3) * 3  ) ))
        var stress_fric_corr = stresses[i].y * factor
        var strain = stresses[i].x
        return { "x": strain, "y": stress_fric_corr, "label": "Fric Corr Stress 1"}
    })
    console.log("Finished friction correction")
    $('#pc_corrected').hide()
}










function bilinearFric(heights, radii, stresses){
    $('#pc_corrected').html('0.0 %')
    $('#pc_corrected').show()
    var m_bar_1 = $('#m_bar_1').val()
    var m_bar_2 = $('#m_bar_2').val()
    var m_bar_3 = $('#m_bar_3').val()
    var pc_test = $('#pc_test').val()
    //Set the friction correction type and value(s) for the test
    currentTest.friction_correction = {
        "type" : "bilinear",
        "m_bar_1" : m_bar_1,
        "m_bar_2" : m_bar_2,
        "m_bar_3" : m_bar_3,
        "pc_test" : pc_test
    }
    chart_stress.options.data[1].dataPoints = heights.map(function(d, i){
        var percent = ( i * 100 / heights.length)
        //console.log("% of test corrected = " + percent.toFixed(1) + " %")

        //$('#pc_corrected').html(percent.toFixed(1) + " %")
        var gradient_1 = parseFloat( (m_bar_2 - m_bar_1)/( pc_test ) )
        var intercept_1 = parseFloat (m_bar_1 )
        var gradient_2 = parseFloat( (m_bar_3 - m_bar_2)/( 100 - pc_test ) )
        var intercept_2 = parseFloat( m_bar_2 - (gradient_2 * pc_test) )

        if(percent <= pc_test ){

            var m_bar = (gradient_1 * percent) + intercept_1;
            //console.log("Using m_bar = " + m_bar.toFixed(3) + ": % of test corrected = " + ( i * 100 / heights.length).toFixed(1) + " %" )
        }
        else{
            var m_bar = (gradient_2 * percent) + intercept_2
            //console.log("Using m_bar = " + m_bar.toFixed(3) + ": % of test corrected = " + ( i * 100 / heights.length).toFixed(1) + " %" )
        }
        var factor = 1 / ( 1 + ( ( 2 * m_bar  * radii[i] )  / ( d.x  * Math.sqrt(3) * 3  ) ))
        var stress_fric_corr = stresses[i].y * factor
        var strain = stresses[i].x
        return { "x": strain, "y": stress_fric_corr, "label": "Fric Corr Stress 1"}
    })
    console.log("Finished friction correction")

    $('#pc_corrected').hide()
}









function calcIsoStress(){
    var fric_corr_stress = chart_stress.options.data[1].dataPoints
    var temps = currentTest.measurements

    var factors = []

    var factors = fric_corr_stress.map(function(d, i){
        return { "T": temps[i].sample_temp_2_centre, "fric_corr_stress": d.y, "strain": d.x}
    })


    chart_stress.options.data[2].dataPoints = factors.map(function(d, i ){
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


    //chart_stress.render()
}




$(".panel-heading").not('.testData').on('click', function(){
    var panel = $(this).parent()
    if (panel.html().includes("Friction") || panel.html().includes("Yield")){
        scrollTo('graph_4')
    }
    $(".panel-default").not(".heading").find(".panel-body")
         .hide(200)

    panel.children(":hidden")
         .show(200)

    if(changesMade){
        processData(currentTest.measurements)
        changesMade = false
    }




})





function plot_raw(data) {
    //console.log('Plotting load displacement graph');
     chart_raw = new CanvasJS.Chart("graph_1",
    {
        animationEnabled: false,
        zoomEnabled: true,
        zoomType: "xy",
        exportEnabled: true,
        exportFileName: currentTest._id + " - Load displacement graph",
        toolTip: {
                enabled: true,
                shared: true
        },
        title: {
            text: "Load - Displacement",
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
            title: "Displacement (mm)",
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
        data:[{
            connectNullData: false,
            type: "line",
            showInLegend: true,
            name: "Non-compliance corrected",
            color: "#333",
            toolTipContent: "Displacement: {x} mm, Load: {y} kN",
            dataPoints: data.map(function(d){
                if(!d.displacement){
                    d.displacement = 0.0
                    d.load = null
                }
                if(d.load_corr){
                    var load = d.load_corr
                }
                else{
                    var load = d.load
                }
                return {"x": d.displacement , "y": load , "label": "Raw" }
            })
        },
        {
            connectNullData: false,
            type: "line",
            showInLegend: true,
            name: "Compliance corrected",
            color: "#f33",
            toolTipContent: "Displacement: {x} mm, Load: {y} kN",
            dataPoints: data.map(function(d){
                //console.log(d)

                if(!d.displacement){
                    d.displacement = 0.0
                    d.load = null
                }
                return {"x": d.displacement , "y": d.load , "label": "Compliance corrected" }
            })
        },
        {
            connectNullData: false,
            type: "line",
            showInLegend: true,
            name: "Zero load corrected",
            color: "#3f3",
            toolTipContent: "Displacement: {x} mm, Load: {y} kN",
            dataPoints: data.map(function(d){
                if(!d.displacement){
                    d.displacement = 0.0
                    d.load = null
                }
                if(d.load_corr){
                    var load = d.load_corr
                }
                else{
                    var load = d.load
                }
                return {"x": d.displacement , "y": load , "label": "Load corrected" }
            })
        }



    ]
    });

    chart_raw.render();

   }


   function plot_sr(data) {
       //console.log('Plotting strain rate graph');

        chart_sr = new CanvasJS.Chart("graph_sr",
       {
           animationEnabled: false,
           zoomEnabled: true,
           zoomType: "xy",
           exportEnabled: true,
           exportFileName: currentTest._id + " - Strain rate graph" ,
           toolTip: {
                   enabled: true,
                   shared: true
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
       //console.log('Plotting load stroke graph');

        chart_stroke = new CanvasJS.Chart("graph_2",
       {
           animationEnabled: false,
           zoomEnabled: true,
           zoomType: "xy",
           exportEnabled: true,
           exportFileName: currentTest._id + " - Load-Stroke graph",
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
               viewportMinimum: 0.0,
               minimum: -1.0
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
               toolTipContent: "Stroke: {x} mm, Load: {y} kN",
               dataPoints: data.map(function(d){
                   if(d.load_corr){
                       var load = d.load_corr
                   }
                   else{
                       var load = d.load
                   }

                   return {"x": currentTest.sample.dimensions.h_hot_initial - d.displacement , "y": load, "label": "Stroke" }
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
                   if(d.load_corr){
                       var load = d.load_corr
                   }
                   else{
                       var load = 0
                   }

                   return {"x": currentTest.sample.dimensions.h_hot_initial - d.displacement - currentTest.zero_offset , "y": load, "label": "Stroke-offset" }
               })
           },
           {
               connectNullData: false,
               type: "line",
               showInLegend: true,
               name: "Full corrected",
               color: "#3d4",
               toolTipContent: "Stroke: {x} mm, Load: {y} kN",
               dataPoints: data.map(function(d){
                   if(d.load_corr){
                       var load = d.load_corr
                   }
                   else{
                       var load = 0
                   }
                   if(d.disp_corr){
                       var disp_corr  = d.disp_corr
                   }
                   else{
                       var disp_corr = currentTest.sample.dimensions.h_hot_initial - d.displacement - currentTest.zero_offset
                   }

                   return {"x": disp_corr , "y": load, "label": "Stroke-offset" }
               })
           }

       ]
       });

       chart_stroke.render();

      }




function plot_stress() {

             //console.log('Plotting stress strain graph');

              chart_stress = new CanvasJS.Chart("graph_4",
             {
                 animationEnabled: false,
                 zoomEnabled: true,
                 zoomType: "xy",
                 exportEnabled: true,
                 exportFileName: currentTest._id + " - Stress-Strain",
                 toolTip: {
                         enabled: true,
                         shared: true,
                 },
                 title: {
                     text: "True Stress - True Strain",
                     fontColor: "#000",
                     fontfamily: "serif",
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
                     fontfamily: "serif",
                     titleFontSize: 20,
                     labelFontSize: 12,
                     lineColor: "#000",
                     tickColor: "#000",
                     labelFontColor: "#000",
                     titleFontColor: "#000",
                     lineThickness: 1,
                     viewportMinimum: 0.0,
                     viewportMaximum: -Math.log(( currentTest.sample.dimensions.h_hot_final / currentTest.sample.dimensions.h_hot_initial )) + 0.3
             },
             axisY:
                {
                  title: "True Stress (MPa)",
                  fontfamily: "serif",
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
                     dataPoints: [{x:0, y:0},{x:1, y:0}]
                 },
                 {
                     type: "line",
                     showInLegend: true,
                     name: "Fric. Corr. Stress",
                     color: "#3d4",
                     toolTipContent: "True strain: {x}, Fric. Corr. Stress: {y} MPa",
                     dataPoints: [{x:0, y:0},{x:1, y:0}]
                 },
                 {
                     type: "line",
                     showInLegend: true,
                     name: "Isothermal Stress",
                     color: "#34d",
                     toolTipContent: "True strain: {x}, Isothermal Stress: {y} MPa",
                     dataPoints: [{x:0, y:0},{x:1, y:0}]
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
                     dataPoints: [{x:0.002, y:0}]
                 }
             ]
             });

             chart_stress.render();
             export_SS.show(200)


            }

            function plot_temp(data) {
                         //console.log('Plotting temp time graph');

                          chart_5 = new CanvasJS.Chart("graph_temp",
                         {
                             animationEnabled: false,
                             zoomEnabled: true,
                             zoomType: "xy",
                             exportEnabled: true,
                             exportFileName: currentTest.id + " - Temp-time graph",

                             toolTip: {
                                     enabled: true,
                                     shared: true,
                             },
                             title: {
                                 text: "Temperature - Time",
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
                             data:[
                                 {
                                     connectNullData: false,
                                     type: "line",
                                     showInLegend: true,
                                     name: "Sample temperature",
                                     color: "#d34",
                                     toolTipContent: "Time: {x} s, Temperature: {y} ºC",
                                     dataPoints: parseData(currentTest.measurements, 'time',
                                                            'sample_temp_2_centre', 'Temperature' )
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



$('input[type="radio"], input[name^="m_bar"], #pc_test ').on('change', function(){
    var divName = $(this).attr('box');
    if(divName){
        $('.fricDiv').hide();
        $('#' + divName).show()
    }
    calcFricCorrStress()

})


$('#stiffness').on('change', function(){

    var type = $(this).find(":selected").val()
    console.log("Changed to user defined stiffness correction with correction: " + type)
    currentTest.mus_params.corrected.tmc = false;
    currentTest.mus_params.corrected.user = true;
    currentTest.compliance = compliance_json[type]
    console.log(compliance_json[type] )
    checkCompliance()



    var data = compliance_json[type]
    console.log(data)
    calcNonComplianceLoad(data)
})



function scrollTo(div){
    console.log("Scrolling to: "+ div)
    var element = $('#' + div )
     $('html,body').animate({scrollTop: element.offset().top - 180},'fast');
     var parent = element.parent() // div.well
     parent.css("background-color", "#f33").delay(2000)
                     .queue(function(n) {
                            $(this).css("background-color", "#eee");
                            n();
                        })

}

function checkCompliance(){

console.log("Checking for machine stiffness correction")
    if(currentTest.mus_params.corrected.tmc == true){
        //console.log("Test is auto corrected for machine stiffness")
        $('#stiffness_corr').html("Test auto-corrected for machine compliance by TMC at runtime.<br><br>Using stiffness of " + currentTest.mus_params.stiffness.value + " " + currentTest.mus_params.stiffness.units )
        currentTest.compliance = compliance_json.default
        //console.log(compliance_json.default)
        $('#stiffness').val(currentTest.compliance.id)
        calcNonComplianceLoad(currentTest.compliance)

    }
    else if(currentTest.mus_params.corrected.tmc == false && !currentTest.compliance){
        //console.log("Test is not corrected for machine stiffness")
        $('#stiffness_corr').html("Test NOT auto-corrected by TMC! Please select a suitable correction factor above.")
        $('#stiffness').val("default")
        calcComplianceLoad(compliance_json.default)


    }
    else if(currentTest.mus_params.corrected.user == true && currentTest.compliance ){
        //console.log("Test is corrected for machine stiffness by user defined value")
        $('#stiffness_corr').html("Test has been corrected for machine stiffness by the user!<br><br>Using stiffness of " + currentTest.compliance.value + " " + currentTest.compliance.units )
        $('#stiffness').val(currentTest.compliance.id)
        calcNonComplianceLoad(currentTest.compliance)


    }




}


function calcNonComplianceLoad(compliance_data){
    //console.log("Using compliance data: ", compliance_data)
    var stiffness = compliance_data.value
    var loads = currentTest.measurements.map((d, i) => {
        var disp = d.displacement  - ( d.load / stiffness)
        return {"x": disp , "y": d.load}
        })
    chart_raw.options.data[0].dataPoints = loads
    chart_raw.render()

}

function calcComplianceLoad(compliance_data){
    //console.log("Using compliance data: ", compliance_data)
    var stiffness = compliance_data.value
    var non_loads = currentTest.measurements.map((d, i) => {
        var disp = d.displacement  + ( d.load / stiffness)
        return {"x": disp , "y": d.load}
        })
    chart_raw.options.data[1].dataPoints = non_loads
    chart_raw.render()

}



var compliance_json = {
    default : {
        id: "default",
        name : "TMC default",
        value : -475,
        units : "kN/mm"
     },
     linear_1 : {
         id: "linear_1",
         name : "Linear 1 ",
         value : -20,
         units : "kN/mm"
      }
}


function setPublicationQuality(chart){


}
