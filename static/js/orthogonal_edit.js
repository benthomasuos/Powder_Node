'use strict';

/* jshint globalstrict: true */
/* global dc,d3,crossfilter,colorbrewer */

var allGraphDivs = $('.graphDiv');
var allControls = $('.controls');
var plotAllTests = $('#plotAll');
var currentTestTable = $('#currentTests');
var tableBody = currentTestTable.find("tbody")

var chart_LS = ""
var chart_TS = ""
var chart_VS = ""
var chart_SRS = ""
var chart_SS = ""


var previewBox = $('#uploadImagesPreview')
var imageUpload = $('#imageUpload')
var testImages = $('#testImages');
var NH_K_slider = $('#NH_K_slider');
var NH_n_slider = $('#NH_n_slider');
var NH_m_slider = $('#NH_m_slider');
var NH_beta_slider = $('#NH_beta_slider');
var NH_temps = $('#NH_temperature');
var NH_strainrates = $('#NH_strainrate');

var currentTest = ""
var originalMusfile = ""

var form_groupDiv = $("<div class='form-group'></div>")
var input_groupDiv = $("<div class='input-group'></div>")
var formDiv = $("<form class='form'></form>")



//setup the in-browser database to save the uploaded flow stress data and saved fitted parameters
var pouchdb = new PouchDB('flowstress')
pouchdb.info().then(function (info) {
  console.log(info);
})












$(document).ready(function(){

    currentTest = window.location.href.split("?")[1].split("=")[1];
    if(currentTest){
        $('.page-header').find("span").html("<b>" + currentTest + "</b>")


        console.log("Processing test: "+ currentTest)
        getSingleTest()
        plotSingleTest(currentTest)


    }else{
        console.log("No test chosen")
        getAllTests()

    }


    $('#imageUpload').on("change", function(){
        var images = imageUpload[0].files;
        console.log(images)
        previewImages(images)

    })

    $('#uploadImages').on("click", function(){
        uploadImages(currentTest)

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

/*

    $("body").on("contextmenu","img", function(e) {
        console.log(e)
        $contextMenu.show()
            $contextMenu.css({
              display: "block",
              left: e.pageX,
              top: e.pageY
            });
            return false;
    });


    $("body").on('click', function(){
        $contextMenu.hide()
    })

    $contextMenu.on("click", "a", function() {
        $contextMenu.show();
    });

*/



})


function resetImagePreview(){
    previewBox.html("")
}


function readFile(file, progress){
    var reader = new FileReader();
    //console.log(file);
        reader.readAsDataURL(file);
        reader.onloadend = function(event){
            var data = event.target.result
            //console.log(event.target)
            var imgDiv = $('<div class="panel panel-default imgBox" name="' + file.name +'"></div>')


            var imagePreview = $('<img name="'+ file.name +'"/>')

            imagePreview.attr('src', data)
                        .attr('alt', file.name)
                        .width("50%")
                        .addClass('img-thumbnail')

            imgDiv.append(imagePreview);
            imgDiv.append("<h5 name='filename'>"+ file.name +" </h5> ")
            var inputGroup = $('<div class="container-fluid col-md-6"></div>')
            var positionInput =$('<input class="form-control" name="position" placeholder="Position" />')
            var strainInput =$('<input class="form-control" name="strain" placeholder="Strain" />')
            inputGroup.append( positionInput )
            inputGroup.append( strainInput )
            imgDiv.append( inputGroup )
            previewBox.append(imgDiv)
            previewBox.find('progress').val(progress)

        }
}

function previewImages(files){
    var previewProgress = $('<progress value=0 max=100 ></progress>')
    previewBox.prepend( previewProgress )
    resetImagePreview()
    for(var i=0;i<files.length;i++){
        var currentProgress = Math.ceil(i / files.length) * 100;

                    readFile(files[i], currentProgress)
            }
        previewProgress.hide(200)

    }




function uploadImages(test_id){
    var images = previewBox.find('.imgBox')
    console.log(test_id)

    images.each(function(){
        var image = $(this)
        //console.log(image)
        var img = image.find('img')
        //console.log(img)
        var type = img[0].src.split(";")[0].split(":")[0]
        var img_name = img.attr('name').split(".")[0].replace(/\s/g, "")
        //console.log(img_name)
        var position = image.find('input[name="position"]')
        var strain = image.find('input[name="strain"]')
        console.log('Uploading image: ' + img)
        var attachment = img[0].src.split(";")[1].split('base64,')[1]
        //attachment.position = position;
        //attachment.strain = strain;

        pouchdb.get( test_id ).then(function(doc){
                return pouchdb.putAttachment(test_id, img_name, doc._rev, attachment, type)
                    }).then(function(response) {
                       console.log(response)
                       image.remove()
                    }).catch(function (err) {
                      console.log(err);
                    });



        })

            getSingleTest(test_id)


}




function getAllTests(){
    //var allTests = tests_coll.find({});
    var allTests = [];
    tableBody.html("");
    testImages.html("");
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

function getSingleTest(){
    tableBody.html("");
    testImages.html("");
    pouchdb.get( currentTest , { attachments : true } )
            .then(function(doc){
                populateTestForm(doc)

                console.log(doc)
                tableBody.append("<tr name='"+ doc._id +"'><td>"+ doc._id  +"</td><td name='sample'>"+ doc.sample.name.user_defined +"</td><td name='temperature'>"+ doc.temperature +"</td><td name='strainrate'>"+ doc.strainrate +"</td></tr>")

                //loadData(doc);
                var images = doc._attachments
                    for( var key in images ){
                            console.log(key + " -> " + images[key]);

                            pouchdb.getAttachment(doc._id, key )
                                    .then(function(blob){
                                        var div = $('<div class="container-fluid col-md-12">'+ key +'</div>')
                                        var posDiv = $('<div class="container-fluid col-md-6">'+ images[key] +'</div>')
                                        var strainDiv = $('<div class="container-fluid col-md-6"></div>')
                                            var img = $('<img />')
                                            img.width('50%')
                                            img.addClass('img-thumbnail')
                                                img[0].src = URL.createObjectURL(blob)
                                                //console.log(img[0].src)
                                                div.append(img)
                                                div.append(posDiv)
                                                div.append(strainDiv)
                                                testImages.append(div)
                                            })
                        }
                    }).catch(function(err){
                    console.log(err)
                    $('#test_status').show()
            })



}








function plotSingleTest(test_id){


    pouchdb.get( test_id )
            .then(function(result){
                var data = result.measurements
                plotData(data)


            }).catch(function(err){
                console.log(err)

            })


}


function populateTestForm(doc){

    var form = $('#testForm');
    var inputs = form.find('input');
    var segmentsDiv = $('div[name="segments"]')

    console.log(doc)

    $("input[name='user_defined']").val(doc.sample.name.user_defined)
    $("input[name='musfile_defined']").val(doc.sample.name.musfile_defined)
    $("input[name='material']").val(doc.sample.material)
    $("input[name='thermal_expansion']").val(doc.sample.thermal_expansion)
    $("input[name='elastic_modulus']").val(doc.sample.elastic_modulus)
    $("input[name='operator']").val(doc.operator)
    $("input[name='system_part']").val(doc.system_part)
    $("input[name='test_config']").val(doc.test_config)
    $("input[name='musfile']").val(doc.musfile)
    $("input[name='temperature']").val(doc.temperature)
    $("input[name='strainrate']").val(doc.strainrate)
    $("input[name='location']").val(doc.location)
    $("input[name='musfile_name']").val(doc.musfile.name)
    $("input[name='num_readings']").val(doc.measurements.length)
    $("input[name='testdate']").val( new Date(doc.testdate).toISOString().split('T')[0] )
    $("input[name='testtime']").val( doc.testdate.split(' ')[3] )

    $.each(doc.segments, function(i, val){
        var segment = $('<div class="input-group"></div>')
        var segment_num = $('<div class="input-group-addon"></div>')
        var segment_text = $('<textarea class="form-control" rows=10 disabled></textarea>')
        segment_num.html("<h5>" + i +"</h5>")
        console.log(val)

        segment_text.val( JSON.stringify(val, null, 3) )
        segment.append(segment_num).append(segment_text)
        segmentsDiv.append(segment)
    });

    var blob = new Blob([doc.musfile.file], {type: "text/.tsv"});
    var url = URL.createObjectURL(blob);
    $("#exportMusfile").attr('href', url )
    $("#exportMusfile").attr('download', currentTest + ".MUS" )
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

/*
function plot_LS(data){
    var plotData = []

  console.log(data)

    var graphDiv = d3.select('#graphLS').append('svg');

    var margin = {top:"40", bottom:"40", left:"40", right:"40"}
    var width = 600;
        width = width - margin.left - margin.right
    var height = 400;

    graphDiv
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var legendRectSize = 12;
    var legendSpacing = 4;

    var legend = graphDiv.selectAll('.legend')
                  .data([data])
                  .enter()
                  .append('g')
                  .attr('class', 'legend')
                  .attr('transform', function(d, i) {
                    var height = legendRectSize + legendSpacing;
                    var offset =  height * 1 / 2;
                    var horz = -2 * legendRectSize;
                    var vert = i * height - offset;
                    return 'translate(' + (width - 100) + ',' + 10 + ')';
                  });
    legend.append('rect')
                .attr('width', legendRectSize)
                .attr('height', legendRectSize)
                .style('fill', 'steelblue')
                .style('stroke', 'steelblue');
    legend.append('text')
              .attr('x', legendRectSize + legendSpacing)
              .attr('y', legendRectSize - legendSpacing)
              .text( currentTest );

    var xScale = d3.scaleLinear().domain(d3.extent(data, function(d) { return d.sample_thickness; })).range([0, width])
    var yScale = d3.scaleLinear().domain(d3.extent(data, function(d) { return d.load })).range([0, height])

    var xAxis = d3.axisBottom(xScale).ticks(10)

    var yAxis = d3.axisLeft(yScale).ticks(10)


    var line = d3.line()
        .curve(d3.curveBasis)
        .x(function(d) { return xScale(d.sample_thickness); })
        .y(function(d) { return yScale(d.load); });

    var toolTip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);


    graphDiv.append("path")
                  .data([data])
                  .attr("d", line)
                  .attr("fill", "none")
                  .attr("stroke", "steelblue")
                  .attr("transform", "translate( 50 ,0 )")
                  .on("mouseover", function(d) {
                           toolTip.transition()
                               .duration(100)
                               .style("opacity", .9);
                           toolTip.html( d.displacement + " (mm) - "  + d.sample_thickness + " (kN)")
                               .style("left", (d3.event.pageX) + "px")
                               .style("top", (d3.event.pageY - 28) + "px");
                           })
                       .on("mouseout", function(d) {
                           toolTip.transition()
                               .duration(200)
                               .style("opacity", 0);
                       });;



    graphDiv.append("g")
                      .attr("transform", "translate(50," + height + ")")
                      .call(xAxis);
    graphDiv.append("g")
                      .attr("transform", "translate( 50, 0 )")
                      .call(yAxis);


      graphDiv.append('text')
                .attr("transform", "translate(" + (width / 2) + " ," + (height + 35) + ")")
                .style("text-anchor", "middle")
                .text("Displacement (mm)");

      graphDiv.append("text")
              .attr("transform", "rotate(-90)")
              .attr("y", 4)
              .attr("x", 0 - (height / 2))
              .attr("dy", "1em")
              .style("text-anchor", "middle")
              .text("Load (kN)");


}
*/



function plotData(data) {
    console.log('Plotting graphs for test');

     chart_LS = new CanvasJS.Chart("graphLS",
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
        data:[
        {
            type: "line",
            toolTipContent: "Height: {x} mm, Load: {y} kN",
            dataPoints: parseData(data, "displacement", "load", "")
        }]
    });

    chart_LS.render();

    chart_TS = new CanvasJS.Chart("graphTS",
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
           text: "Temperature - Stroke",
           fontColor: "#000",
           fontfamily: "Arial",
           fontSize: 20,
           padding: 8
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
       data:[
       {
         type: "line",
         toolTipContent: "Height: {x} mm, Temp: {y} ºC",
         dataPoints: parseData(data, "displacement", "sample_temp_2_centre", "")
     }]
   });





chart_TS.render();



chart_VS = new CanvasJS.Chart("graphVS",
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
       text: "Velocity - Stroke",
       fontColor: "#000",
       fontfamily: "Arial",
       fontSize: 20,
       padding: 8
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
   data:[
   {
     type: "line",
     toolTipContent: "Height: {x} mm, Velocity: {y} mm/s",
     dataPoints: parseData(data, "displacement", "velocity_", "")
 }]
});


chart_VS.render();


chart_SRS = new CanvasJS.Chart("graphSRS",
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
       text: "Strain rate",
       fontColor: "#000",
       fontfamily: "Arial",
       fontSize: 20,
       padding: 8
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
   data:[
   {
     type: "line",
     toolTipContent: "Strain: {x}, Stress: {y} MPa",
     dataPoints: parseData(data, "displacement", "strain_rate", "")
 }]
});





chart_SRS.render();


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
       reversed:  true
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
    lineThickness: 1
 },
   data:[
   {
     type: "line",
     toolTipContent: "Strain: {x}, Stress: {y} MPa",
     dataPoints: parseData(data, "trrue_strain", "true_stress", "")
 }]
});





chart_SS.render();





   }



   function parseData(data, x_name, y_name, label){
        //console.log(label)
           var parsed_data = data.map(function(d){
               return {"x": d[x_name]  , "y": d[y_name], "label": label }
           })
           //console.log(parsed_data)
           return parsed_data
   }
