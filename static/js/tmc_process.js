var allGraphDivs = $('.graphDiv');
var allControls = $('.controls');
var plotAllTests = $('#plotAll');
var currentTestTable = $('#currentTests');
var currentPowder = "";

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

var currentlyScrollingTo = ""


var currentTest = "";
var vol_cold = 0.0;
var vol_hot = 0.0;

var changesMade = false;

//setup the in-memory database to save the uploaded flow stress data and saved fitted parameters


var test_db_local = new PouchDB('flowstress')
test_db_local.info().then(function (info) {
  console.log(info);
})
console.log(test_db_local)
var powder_db_local = new PouchDB('powders')
powder_db_local.info().then(function (info) {
  console.log(info);
})






    displacement_offset.on('input', function(){
        scrollTo('graph_2')
        var value = $(this).val();
        displacement_offset_range.val(value)
        currentTest.zero_offset = parseFloat( value );
        calcDispOffset()
        changesMade = true
    })

    displacement_offset_range.on('input', function(){
        scrollTo('graph_2')
        var value = $(this).val();
        displacement_offset.val(value)
        currentTest.zero_offset = parseFloat( value );
        calcDispOffset()
        changesMade = true
    })

    load_offset.on('input', function(){
        scrollTo('graph_1')
        var value = $(this).val();
        load_offset_range.val(value)
        currentTest.load_offset = parseFloat( value );
        calcLoadOffset() // Use the stiffness corrected raw data
        changesMade = true


    })

    load_offset_range.on('input', function(){
        scrollTo('graph_1')
        var value = $(this).val();
        load_offset.val(value)
        currentTest.load_offset = parseFloat( value );
        calcLoadOffset() // Use the stiffness corrected raw data
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

        var max_stress = 0.0
        var strain_at_max_stress = 0.0
        var stresses = chart_options.data[1].dataPoints.map( function(d, i){
            if( d.y > max_stress ){
                max_stress = d.y
                strain_at_max_stress = d.x
            }
        })

        currentTest.compressive_strength = max_stress.toFixed(1)
        chart_options.data[5] = {type:"scatter",dataPoints: [{ x: strain_at_max_stress, y: max_stress }]}

        //console.log(chart_options)



        chart_stress.render()
        $('#yieldCalcMsg').html('Click at the point the <span style="color:lightblue">blue</span> line crosses the <span style="color:lightgreen">green</span> line');
        chart_options.data[1].click  = function(e){
            console.log("Yield Stress = " + e.dataPoint.y + " MPa" )
            currentTest.yield_strength_02_mpa = e.dataPoint.y.toFixed(2)
            chart_options.data[1].click  = null
            stopYieldCalculation()
            $('#yieldCalcMsg').html('Yield calculation finished<br>Youngs Modulus:  ' + (m / 1000.0).toFixed(1) + ' GPa<br>Yield stress:  ' + (e.dataPoint.y).toFixed(1) + ' MPa<br>Ultimate compressive strength:  ' + currentTest.compressive_strength + ' MPa')
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
                                {"x":0.5  , "y": ((m * 0.6) + intercept)   }  ]
            };
            chart_options.data[3].visible = true;
            chart_stroke.render()

            if( confirm("Are you happy with the fitted line?") ){
                chart_options.data[1].visible = true;


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
    test_db_local.get( currentTest , { attachments : true } )
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
                    return test_db_local.allDocs()
            }).then(function(tests){
                    console.log(tests)
                for(var i=0; i< tests.rows.length; i++){
                    console.log(tests.rows[i].id, currentTest._id, i)
                    if(tests.rows[i].id == currentTest._id){
                        nextButtons(tests.rows, i)
                    }
                }

                    if(currentTest.type == "Powder"){
                        getPowder()
                    }

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


function getPowder(){
    powder_db_local.get( currentTest.sample.id )
            .then(function(powder){
                currentPowder = powder; // Load the data into the variable 'currentTest' to be used for all subsquent analysis work
                console.log(powder)
            }).then(function(){
                loadPowder()

            }).catch(function(err){
                    console.log(err)
                    $('#test_status').show()
            })
}


function loadPowder(){
    $("#solid_density").val(currentPowder.density.solid)
    $("#bulk_density").val(currentPowder.density.bulk)
}


/*
$("#ram_diameter, #sample_mass").on("change", function(){
    var area = Math.PI * ( $("#ram_diameter").val() / 2) ** 2
    var start_vol = $("#bulk_density")

})
*/



function saveData(){
    $('textarea').each(function(){
        if( $(this).attr('name')){
            currentTest[$(this).attr('name')] = $(this).val();
        }
    })



    $('input').each(function(){
        if($(this).attr('name')){
            var name = $(this).attr('name')
            var value = $(this).val()
            if($(this).attr('type') == "number" && !name.includes("h_") && !name.includes("d_")){
                 //console.log("currentTest", name, value)
                 currentTest[name] = parseFloat( value )
            }
            else if( name.includes("h_") || name.includes("d_") && !name.includes("load")){
                //console.log("sample dimensions",name, value)
                currentTest.sample.dimensions[name] = value;
            }
            else if(name.includes("load")){
                //console.log("currentTest",name, value)
                currentTest[name] = parseFloat( value )
            }
            if (name == "sample_user"){
                currentTest.sample.name.user_defined = value
            }
                localStorage[name] = value;
                currentTest[name] = value;

        }
    })

         var measurements = []
         var j = 0
         console.log(chart_stress.options.data[0].dataPoints.length)
         console.log(chart_stress.options.data[1].dataPoints.length)

         for(var i=0; i< currentTest.measurements.length; i++){
                    var d = currentTest.measurements[i]
                    d.stroke_corr = chart_stroke.options.data[2].dataPoints[i].x || null
                    d.zero_corr = chart_stroke.options.data[1].dataPoints[i].x || null
                    d.disp_corr = chart_stroke.options.data[2].dataPoints[i].x || null
                    d.load_corr = chart_raw.options.data[2].dataPoints[i].y || null
                    d.strainrate = chart_sr.options.data[0].dataPoints[i].y || null

                    d.strain = chart_stress.options.data[0].dataPoints[i].x || null

                    if(d.strain > 0.0 && chart_stress.options.data[1].dataPoints[j]){
                        d.fricStress = chart_stress.options.data[1].dataPoints[j].y
                        j++

                    }
                    else{
                        d.fricStress = 0.0
                    }

                    d.trueStress = chart_stress.options.data[0].dataPoints[i].y || null

                    if(d.stroke_corr && d.zero_corr && d.disp_corr && d.load_corr && d.strain && d.trueStress && d.fricStress){
                        //console.log("Your test has been analysed fully. Well done!")
                        currentTest.analysed = true;
                    }
                        measurements.push(d)
    }

    currentTest.measurements = measurements

    console.log("Saved data")
    //console.log(currentTest)

    test_db_local.get( currentTest._id ).then(function(doc) {
            currentTest._rev = doc._rev
            //console.log(currentTest)
            return test_db_local.put( currentTest );
        }).then(function(response) {
            console.log(response);
        $('#saveData').html("Data saved OK").addClass('btn-success').delay(2000)
        .queue(function(n) {
               $(this).html("<i class='fa fa-save'></i>  Save Data");
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

$('#defaultDimensions').on('click', function(){
    populateSampleDimensions()

})


$('#sampDimensions').on('input', function(){
    var data = $(this).val()
    populateSampleDimensions(data)

})

function populateSampleDimensions(text){
    var e = jQuery.Event("");
    console.log(e)

    if(!text){
        $('#h_initial_1').val(11.1)
        $('#h_initial_2').val(11.1)
        $('#h_initial_3').val(11.1)
        $('#h_initial_4').val(11.1)

        $('#d_initial_1').val(7.4)
        $('#d_initial_2').val(7.4)
        $('#d_initial_3').val(7.4)
        $('#d_initial_4').val(7.4)


        $('#h_final_5').val(5.6)
        $('#h_final_6').val(5.6)
        $('#h_final_7').val(5.6)
        $('#h_final_8').val(5.6)

        $('#d_final_5').val(10.3)
        $('#d_final_6').val(10.3)
        $('#d_final_7').val(10.3)
        $('#d_final_8').val(10.3)

    }
    else{
        var values = text.split('\t')
        //console.log(values)

        $('#h_initial_1').val(values[1])
        $('#h_initial_2').val(values[2])
        $('#h_initial_3').val(values[3])
        $('#h_initial_4').val(values[4])

        $('#d_initial_1').val(values[6])
        $('#d_initial_2').val(values[7])
        $('#d_initial_3').val(values[8])
        $('#d_initial_4').val(values[9])

        $('#h_final_1').val(values[19])
        $('#h_final_2').val(values[20])
        $('#h_final_3').val(values[21])
        $('#h_final_4').val(values[22])

        $('#d_final_1').val(values[24])
        $('#d_final_2').val(values[25])
        $('#d_final_3').val(values[26])
        $('#d_final_4').val(values[27])
    }

        $('#h_initial_4').trigger('change')
        $('#d_initial_4').trigger('change')
        $('#h_final_8').trigger('change')
        $('#d_final_8').trigger('change')


}



function loadData(){
    $('textarea').each(function(){
        if( $(this).attr('name') && !$(this).text() ){
            $(this).text(currentTest[$(this).attr('name')]);
        }
    })

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




function nextButtons(tests, index){
    console.log(tests, index)
    console.log("Adding extra test to buttons")
    var this_test = tests[index]
    if(tests[ index - 1 ] && !tests[ index - 1 ].id.includes("_design") ){
        $('#previousTest').attr('href','/tests/tmc/process?_id=' + tests[ index - 1 ].id)
    }
    else{
        $('#previousTest').attr('href','')
        $('#previousTest').attr('disabled', 'disabled')
    }
    if(tests[ index + 1 ] && !tests[ index + 1 ].id.includes("_design") ){
        $('#nextTest').attr('href','/tests/tmc/process?_id=' + tests[ index + 1 ].id)
    }
    else{
        $('#nextTest').attr('href','')
        $('#nextTest').attr('disabled', 'disabled')
    }


}



function hot_dimension(dimension, cte, temp, ref_temp){
    var size = parseFloat(dimension) + (cte * dimension * ( temp - ref_temp))
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
        $('#h_hot_initial').val(currentTest.sample.dimensions.h_hot_initial.toFixed(3) || null)
    }
    if(currentTest.sample.dimensions.av_h_final){
        currentTest.sample.dimensions.h_hot_final = hot_dimension(currentTest.sample.dimensions.av_h_final, therm_ex_coeff, def_temp, 20)
        $('#h_hot_final').val(currentTest.sample.dimensions.h_hot_final.toFixed(3) || null )
    }
    if(currentTest.sample.dimensions.av_d_initial){
        currentTest.sample.dimensions.d_hot_initial = hot_dimension(currentTest.sample.dimensions.av_d_initial, therm_ex_coeff, def_temp, 20)
        $('#d_hot_initial').val(currentTest.sample.dimensions.d_hot_initial.toFixed(3)  || null)
    }
    if(currentTest.sample.dimensions.av_d_final){
        currentTest.sample.dimensions.d_hot_final = hot_dimension(currentTest.sample.dimensions.av_d_final, therm_ex_coeff, def_temp, 20)
        $('#d_hot_final').val(currentTest.sample.dimensions.d_hot_final.toFixed(3) || null )
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

    if( currentTest.analysed == true){
        $('#analysed_indicator').html("Test analysed")
        $('#analysed_indicator').show()
    }
    else{
        $('#analysed_indicator').hide()
    }


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
        //drawSample()
    //console.log("Barrelling ratio = " + barrel_ratio)
}


function prepareDownload(){

    var test = currentTest
    console.log("Preparing download for test " + test._id + ". Please wait...")
    let data = []
    data[0] = "Displacement (mm), Corrected Stroke (mm), Corrected Load (kN), Temperature (ºC), True Strain (mm/mm), True Stress (MPa), True Friction Corrected Stress (MPa), True Isothermal Stress (MPa)\r\n"

        for(var i=0; i<test.measurements.length; i++){
            var point = test.measurements[i]

                if(point.strain > 0){
                    data.push(point.disp_corr + "," + point.stroke_corr + "," + point.load_corr + ","+ point.sample_temp_2_centre + "," + point.strain + "," + point.trueStress + "," + point.fricStress + "," + point.isoStress + "\r\n")
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







function drawSample(){
    const cntxt = document.getElementById('sampleDrawing').getContext('2d')
    var scale = 10
    var initial = {x: 10, y: 10 }
    cntxt.strokeRect(initial.x, initial.y , currentTest.sample.dimensions.d_hot_initial * scale , currentTest.sample.dimensions.h_hot_initial * scale )

    var final = {x: initial.x + currentTest.sample.dimensions.d_hot_initial * scale , y: initial.y + currentTest.sample.dimensions.h_hot_initial * scale }
    cntxt.beginPath();
    cntxt.moveTo(final.x, final.y )


    cntxt.lineTo(final.x + 20 * scale, final.y + 200  )
    cntxt.arc()


    cntxt.closePath()
    cntxt.stroke()

}








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



function calcLoadOffset(){
    chart_raw.options.data[2].dataPoints = chart_raw.options.data[1].dataPoints.map(function(d, i){
        currentTest.measurements[i].load_corr = d.y - currentTest.load_offset
        return { "x": d.x, "y": d.y - currentTest.load_offset , "label": d.label}
    })


    chart_raw.render()
    calcDispOffset()
}







function calcDispOffset(){
    var dataPoints_uncorr = chart_stroke.options.data[0].dataPoints
    // Calculate the zero offset displacements
    var dataPoints_zero = dataPoints_uncorr.map(function(d, i){
        var d_zero = d.x - currentTest.zero_offset
        currentTest.measurements[i].zero_corr = d_zero
        return { "x": d_zero, "y": d.y , "label": d.label}
    })
    // Find the maximum value of displacement in the valid portion of the test data (typically at max load but check for excessive load cell noise in the raw data (zoom in on the graph!))
    var d_0_max = 0.0;
    var load_max = 0.0
    //console.log(dataPoints)
    for(var i=0; i<dataPoints_zero.length;i++){
        var this_disp = dataPoints_zero[i].x;
        //var load_max = dataPoints_zero[i].y;
        // If the latest load is higher than the currently stored on replace it. Double check that any wierd outlying data doesn't mess up this automatic detection
        if(this_disp > d_0_max && this_disp < (currentTest.sample.dimensions.av_h_initial - currentTest.sample.dimensions.av_h_final) &&  dataPoints_zero[i].y < 0.0 ){
            d_0_max = this_disp
        }
    }
    console.log('d_0_max = '  +  d_0_max)
    currentTest.d_0_max = d_0_max

    chart_stroke.options.data[2].dataPoints = dataPoints_zero.map(function(d, i){
        var d_corr = ( d.x  ) * ( ( currentTest.sample.dimensions.h_hot_initial - currentTest.sample.dimensions.h_hot_final   )  / ( (d_0_max) ) )
        currentTest.measurements[i].disp_corr = d_corr
        return { "x": d_corr, "y": d.y , "label": d.label}
    })
    chart_stroke.render()
}









function calcStrain(){
    var heights = chart_stroke.options.data[2].dataPoints
    heights.map(function(d, i){
        var stroke = d.x
        if(stroke < 0.0 ){
            stroke = 0.0
        }
        //console.log( -Math.log( (parseFloat(currentTest.sample.dimensions.h_hot_initial) - stroke) / parseFloat(currentTest.sample.dimensions.h_hot_initial) )  )

        var strain = -Math.log( (parseFloat(currentTest.sample.dimensions.h_hot_initial) - stroke) / parseFloat(currentTest.sample.dimensions.h_hot_initial) )
        if(isNaN(strain) ){
            //console.log("NaN strain found in test " + currentTest._id + " at point # " + i)
            strain = 0.0
        }
        currentTest.measurements[i].strain = strain
    })
}

function calcStrainRate(){
    chart_sr.options.data[0].dataPoints = chart_stroke.options.data[2].dataPoints.map(function(d, i){
        var height =  currentTest.sample.dimensions.h_hot_initial - d.x
        var velocity = currentTest.measurements[i].velocity_
        var strainrate = velocity / height
        return { "x": height, "y": strainrate, "label": "Strain rate"}
    })
    graph_sr_Parent.show()
    chart_sr.render()
}


function average(values){
    return getSum(values)/values.length
}

function getSum(total, num){
    return total + number
}



function calcStress(){
    var area_0 = Math.PI * ((parseFloat(currentTest.sample.dimensions.d_hot_initial)/2)**2)




    var currentStress = 0

    var strokes = chart_stroke.options.data[2].dataPoints
    var max_strain = 0.0
    chart_stress.options.data[0].dataPoints = []

    for(var i=0; i< strokes.length;i++){
        var strain = currentTest.measurements[i].strain
        if(strain > max_strain){
            max_strain = strain
        }
        //console.log(strain)
        var h_i_hot = currentTest.sample.dimensions.h_hot_initial - strokes[i].x
        //console.log(h_i_hot)
        var d_i_hot = Math.sqrt(( 4 * currentTest.sample.dimensions.vol_hot ) / ( Math.PI * h_i_hot))
        //console.log(d_i_hot)
        var area_i_hot = Math.PI * ( ( d_i_hot / 2 ) ** 2 )
        var stress = - ( strokes[i].y / area_i_hot ) * 1000.0

        //console.log(currentStress/stress)
        //if(  currentStress/stress < 0.97 || currentStress/stress > 1.03 && stress > 0.0){

            if(strain > 0.1 && stress < 0.5  ){
                stress = null
                //break;
            }
            //    console.log("Failure detected at point " + i)
            //    stress = null
            //}
        //}

        //if( strain >= 0.0 && strain <= max_strain ){
            chart_stress.options.data[0].dataPoints.push({ "x": strain, "y": stress, "label": "Strain"})
        //}
        //else{
        //    chart_stress.options.data[0].dataPoints.push({ "x": strain, "y": null, "label": "Strain"})
        //}
        currentStress = - ( strokes[i].y / area_i_hot ) * 1000.0
    }
    //chart_stress.render()
}



function stopRKey(evt) {
  var evt = (evt) ? evt : ((event) ? event : null);
  var node = (evt.target) ? evt.target : ((evt.srcElement) ? evt.srcElement : null);
  if ((evt.keyCode == 13) && (node.type=="text") || (evt.keyCode == 13) && (node.type=="number") )  {return false;}
}
document.onkeypress = stopRKey;



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
    //console.log("Friction type = " + friction_type)

    switch(friction_type){
        case "linear_fric":
        //console.log("Using linear friction correction")
            linearFric(heights, radii, stresses)
            chart_stress.render()
            break
        case "bilinear_fric":
            //console.log("Using bilinear friction correction")
            bilinearFric(heights, radii, stresses)
            chart_stress.render()
            break
        case "pressure_fric":
            //console.log("Using pressure dependant friction correction")
            pressureFric(heights, radii, stresses)
            chart_stress.render()
            break
        default:
            //console.log("No friction correction")
            chart_stress.render()
        break
    }

}








function linearFric(heights, radii, stresses){
    //$('#pc_corrected').html('0.0 %')
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
        $('#pc_corrected').val(percent)
        var factor = 1 / ( 1 + ( ( 2 * m_bar  * radii[i] )  / ( d.x  * Math.sqrt(3) * 3  ) ))
        var stress_fric_corr = stresses[i].y * factor
        var strain = stresses[i].x
        return { "x": strain, "y": stress_fric_corr, "label": "Fric Corr Stress 1"}
    })
    //console.log("Finished friction correction")
    //$('#pc_corrected').hide()
}










function bilinearFric(heights, radii, stresses){
    $('#pc_corrected').val(0)
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

    var data = []
    var newHeights = []
    var newRadii = []
    //console.log(stresses)
    for(var i=0; i< heights.length;i++){
        if(stresses[i].x > 0 && stresses[i].y > 2){
            data.push( { "x": stresses[i].x, "y": stresses[i].y} )
            newRadii.push(radii[i])
            newHeights.push(heights[i])
        }
    }
    //console.log(data.length)
    //console.log(newRadii.length)
    //console.log(newHeights.length)

    //console.log("Number of points = " + data.length)
    chart_stress.options.data[1].dataPoints = data.map(function(d, i){
        var percent = ( i * 100 / data.length)

        //console.log("% of test corrected = " + percent.toFixed(1) + " %")

        //$('#pc_corrected').html(percent.toFixed(1) + " %")
        $('#pc_corrected').val(percent)
        var gradient_1 = parseFloat( (m_bar_2 - m_bar_1)/( pc_test ) )
        var intercept_1 = parseFloat (m_bar_1 )
        var gradient_2 = parseFloat( (m_bar_3 - m_bar_2)/( 100 - pc_test ) )
        var intercept_2 = parseFloat( m_bar_2 - (gradient_2 * pc_test) )

        if(percent <= pc_test ){
            var m_bar = (gradient_1 * percent) + intercept_1;
            //console.log("Using m_bar = " + m_bar.toFixed(3) + ": % of test corrected = " + ( i * 100 / data.length).toFixed(1) + " %" )
        }
        else{
            var m_bar = (gradient_2 * percent) + intercept_2
            //console.log("Using m_bar = " + m_bar.toFixed(3) + ": % of test corrected = " + ( i * 100 / data.length).toFixed(1) + " %" )
        }
        var factor = 1 / ( 1 + ( ( 2 * m_bar  * newRadii[i] )  / ( newHeights[i].x  * Math.sqrt(3) * 3  ) ))

        var stress_fric_corr = d.y * factor
        var strain = d.x
        return { "x": strain, "y": stress_fric_corr, "label": "Fric Corr Stress 1"}
    })
    //console.log("Finished friction correction")

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
         if(currentTest.type == "Axi"){
             $('div[name="Powder"]').hide()
         }
         else if(currentTest.type == "Powder"){
             $('div[name="Axi"]').hide()
         }

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
                    //console.log("using corrected load")
                }
                else{
                    var load = d.load
                    //console.log("using normal load")
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
               toolTipContent: "Displacement: {x} mm, Strain rate: {y} /s",
               dataPoints: data.map(function(d){
                   if(!d.disp_corr){
                       var disp = 0.0
                       d.strainrate = null
                   }
                   else{
                       var disp = d.displacement
                   }
                   if(d.strainrate < 0){
                       var strainrate = null
                   }
                   else{
                       var strainrate = d.strainrate
                   }
                   return {"x": disp , "y": strainrate, "label": "Strain rate" }
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
            reversed:  true,
            viewportMaximum: 0.0

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
                   if(d.disp_corr){
                       var zero_corr  = d.zero_corr
                   }
                   else{
                       var zero_corr = currentTest.sample.dimensions.h_hot_initial - d.displacement - currentTest.zero_offset
                   }

                   return {"x": zero_corr  , "y": load, "label": "Stroke-offset" }
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
    //console.log("Changed to user defined stiffness correction with correction: " + type)
    currentTest.mus_params.corrected.tmc = false;
    currentTest.mus_params.corrected.user = true;
    currentTest.compliance = compliance_json[type]
    //console.log(compliance_json[type] )
    checkCompliance()



    var data = compliance_json[type]
    //console.log(data)
    calcNonComplianceLoad(data)
})



function scrollTo(div){

    if( div != currentlyScrollingTo ){
        //console.log("Scrolling to: "+ div)
        currentlyScrollingTo = div

        var element = $('#' + div )
         $('html,body').animate({scrollTop: element.offset().top - 180},'fast');
         var parent = element.parent() // div.well
         parent.css("border", "#f33 solid 4px").delay(2000)
                         .queue(function(n) {
                                $(this).css("border", "none");
                                n();
                            })

    }
    else{
        //console.log("Already there... no need to scroll further")
    }


}

function checkCompliance(){

    //console.log("Checking for machine stiffness correction")
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
    var loads = currentTest.measurements.map((d, i) => {
        var disp = d.displacement  + ( d.load / stiffness)

        return {"x": disp , "y": d.load}
        })
    chart_raw.options.data[1].dataPoints = loads
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
