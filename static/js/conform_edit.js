'use strict';

/* jshint globalstrict: true */
/* global dc,d3,crossfilter,colorbrewer */

var allGraphDivs = $('.graphDiv');
var allControls = $('.controls');
var plotAllTests = $('#plotAll');
var currentTestTable = $('#currentTests');
var tableBody = currentTestTable.find("tbody")
var mainGraphDiv = $('#mainGraph')


var chart_main = ""
var chart_groove = ""
var chart_abut = ""

var previewBox = $('#uploadImagesPreview');
var imageUpload = $('#imageUpload');
var testImages = $('#testImages');
var noteModal = $('#noteModal');
var currentTest = ""
var originalDatafile = ""

var form_groupDiv = $("<div class='form-group'></div>")
var input_groupDiv = $("<div class='input-group'></div>")
var formDiv = $("<form class='form'></form>")

var trialNote = $("#trialNote")


//setup the in-browser database to save the uploaded flow stress data and saved fitted parameters
var pouchdb = new PouchDB('http://143.167.48.53:5984/conform')
pouchdb.info().then(function (info) {
  console.log(info);
})












$(document).ready(function(){

    currentTest = window.location.href.split("?")[1].split("=")[1];
    if(currentTest){
        $('.page-header').find("span").html("<b>" + currentTest + "</b>")


        console.log("Processing test: "+ currentTest)
        getSingleTest()


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



function getSingleTest(){
    tableBody.html("");
    testImages.html("");
    pouchdb.get( currentTest , { attachments : true } )
            .then(function(doc){
                currentTest = doc
                console.log(currentTest)
                populateTestForm(currentTest)
                plotData()

                tableBody.append("<tr name='"+ doc._id +"'><td>"+ doc._id  +"</td><td name='sample'>"+ doc.feedstock.name.user_defined +"</td><td name='temperature'>"+ doc.temperature +"</td><td name='strainrate'>"+ doc.strainrate +"</td></tr>")

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
                        //console.log(err)
                    if(err.reason == "missing"){
                        console.log("Nothing to upload")
                    }

                    $('#test_status').show()
                    $('#test_status').show()
            })



}





function populateTestForm(currentTest){

    var form = $('#testForm');
    var inputs = form.find('input');
    var segmentsDiv = $('div[name="segments"]')

    //console.log(currentTest)
/*
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



    var blob = new Blob([doc.musfile.file], {type: "text/.tsv"});
    var url = URL.createObjectURL(blob);
    $("#exportMusfile").attr('href', url )
    $("#exportMusfile").attr('download', currentTest + ".MUS" )
    */
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


function plotData() {
    console.log('Plotting graphs for test');


     chart_main = new CanvasJS.Chart("mainGraph",
    {
        animationEnabled: true,
        zoomEnabled: true,
        height: 600,
        zoomType: "xy",
        toolTipContent: "x: {x}, y: {y[0]} ",
        exportEnabled: true,
        exportFileName: "graph",
        rangeChanged: syncHandler,
        toolTip: {
                enabled: true,
                shared: true,
        },
        title: {
            text: "Trial data",
            fontColor: "#008B8B",
            fontfamily: "Arial",
            fontSize: 20,
            padding: 8
        },
    axisX:{
            title: "Time",
            valueFormatString: "HH:mm:ss",
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
    axisY: [
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
      {
         title: "Stress (MPa)",
         fontfamily: "Arial",
         titleFontSize: 20,
         labelFontSize: 12,
         lineColor: "#000",
         tickColor: "#000",
         labelFontColor: "#000",
         titleFontColor: "#000",
         lineThickness: 1
     }],
     axisY2:[
      {
         title: "Wheel Speed (RPM)",
         fontfamily: "Arial",
         titleFontSize: 20,
         labelFontSize: 12,
         lineColor: "#000",
         tickColor: "#000",
         labelFontColor: "#000",
         titleFontColor: "#000",
         lineThickness: 1
     },
     {
        title: "Position (mm)",
        fontfamily: "Arial",
        titleFontSize: 20,
        labelFontSize: 12,
        lineColor: "#000",
        tickColor: "#000",
        labelFontColor: "#000",
        titleFontColor: "#000",
        lineThickness: 1
    }],
    legend: {
        cursor: "pointer",
        horizontalAlign: "center", // "center" , "right"
        verticalAlign: "top",  // "top" , "bottom"
        fontfamily: "Arial",
        fontSize: 16,
        itemclick: function(e){
            //console.log(e.dataSeries)
            if (typeof (e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
                    e.dataSeries.visible = false;
                } else {
                    e.dataSeries.visible = true;
                }
            e.chart.render();
            //alert( "Legend item clicked with type : " + e.dataSeries);
        }

    },
        data: [
        {
          type: "line",
          showInLegend: true,
          name: "Abutment Temp 1",
          legendText: "Abutment Temp 1",
          axisYIndex: 0,
          dataPoints: parseData( currentTest.rawData, "timestamp", "abutment_1_temperature_"),
          click: function(e){
                  addNote(e)
          }
          },
          {
            type: "line",
            showInLegend: true,
            name: "Wheel Temp 1",
            legendText: "Wheel Temp 1",
            axisYIndex: 0,
            dataPoints: parseData( currentTest.rawData, "timestamp", "wheel_temperature_1_"),
            click: function(e){
                    addNote(e)
            }
          },
          {
            type: "line",
            showInLegend: true,
            name: "Wheel Temp 2",
            legendText: "Wheel Temp 2",
            axisYIndex: 0,
            dataPoints: parseData( currentTest.rawData, "timestamp", "wheel_temperature_2_"),
            click: function(e){
                    addNote(e)
            }
          },
        {
          type: "line",
          showInLegend: true,
          name: "Wheel speed",
          legendText: "Wheel speed",
          axisYIndex: 0,
          dataPoints: parseData( currentTest.rawData, "timestamp", "conform_wheel_speed_"),
          click: function(e){
                  addNote(e)
          }
      },
      {
        type: "line",
        showInLegend: true,
        name: "Motor current",
        legendText: "Motor current",
        axisYIndex: 0,
        dataPoints: parseData( currentTest.rawData, "timestamp", "conform_motor_current_"),
        click: function(e){
                addNote(e)
        }
    },
    {
      type: "scatter",
      showInLegend: true,
      name: "Notes",
      legendText: "Notes",
      dataPoints:  currentTest.rawData.map(function(d){
          if( d["note"] ){
              return {"x": new Date(d["timestamp"])  , "y": 100, "label": d["note"] }
          }
          else{
              return {"x": new Date(currentTest.rawData[0].timestamp), "y": null}
          }
      }),
      mouseover: function(e){
              showNote(e)
      }
    }

        ]
    });

    //console.log(mainGraphDiv)
    mainGraphDiv.css('height', chart_main.get("height") + 80);
    chart_main.render();

/*
    chart_groove = new CanvasJS.Chart("grooveGraph",
    {
     animationEnabled: true,
     zoomEnabled: true,
     zoomType: "x",
     toolTipContent: "x: {x}, y: {y} ",
     exportEnabled: true,
     exportFileName: "graph",
     rangeChanged: syncHandler,
     toolTip: {
             enabled: true,
             shared: true,
     },
     title: {
         text: "Wheel groove data",
         fontColor: "#008B8B",
         fontfamily: "Arial",
         fontSize: 20,
         padding: 8
     },
    axisX:{
         title: "Time",
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
              title: "Groove depth and width (mm)",
              fontfamily: "Arial",
              titleFontSize: 20,
              labelFontSize: 12,
              lineColor: "#000",
              tickColor: "#000",
              labelFontColor: "#000",
              titleFontColor: "#000",
              lineThickness: 1
          },
    axisY2:
    {
      title: "Groove CSA (mm^2)",
      fontfamily: "Arial",
      titleFontSize: 20,
      labelFontSize: 12,
      lineColor: "#000",
      tickColor: "#000",
      labelFontColor: "#000",
      titleFontColor: "#000",
      lineThickness: 1
    },
    legend: {
     cursor: "pointer",
     horizontalAlign: "center", // "center" , "right"
     verticalAlign: "top",  // "top" , "bottom"
     fontfamily: "Arial",
     fontSize: 16,
     itemclick: function(e){
         console.log(e.dataSeries)
         if (typeof (e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
                 e.dataSeries.visible = false;
             } else {
                 e.dataSeries.visible = true;
             }
         e.chart.render();
         //alert( "Legend item clicked with type : " + e.dataSeries);
     }

    },
     data: [
     {
       type: "line",
       showInLegend: true,
       name: "grooveWidth",
       legendText: "Groove Width",
       axisYIndex: 0,
       dataPoints: parseData(currentTest.rawData, "time", "grooveWidth", "Groove Width")
       },
       {
         type: "line",
         showInLegend: true,
         name: "grooveDepth",
         legendText: "Groove Depth",
         axisYIndex: 0,
         dataPoints: parseData(currentTest.rawData, "time", "grooveDepth", "Groove Depth")
       },
       {
         type: "line",
         showInLegend: true,
         name: "grooveCSA",
         legendText: "Groove CSA",
         axisYType: "secondary",
         axisYIndex: 0,
         dataPoints: parseData(currentTest.rawData, "time", "grooveCSA", "Groove CSA")
     }]
    });




chart_groove.render();
*/

chart_abut = new CanvasJS.Chart("abutGraph",
{
 animationEnabled: true,
 zoomEnabled: true,
 height: 600,
 width: 600,
 zoomType: "x",
 toolTipContent: "x: {x}, y: {y} ",
 exportEnabled: true,
 exportFileName: "graph",
 rangeChanged: syncHandler,
 toolTip: {
         enabled: true,
         shared: true,
 },
 title: {
     text: "Abutment Stress data",
     fontColor: "#008B8B",
     fontfamily: "Arial",
     fontSize: 20,
     padding: 8
 },
axisX:{
     title: "Wheel Speed (RPM)",
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
          title: "Abutment Stress (MPa)",
          fontfamily: "Arial",
          titleFontSize: 20,
          labelFontSize: 12,
          lineColor: "#000",
          tickColor: "#000",
          labelFontColor: "#000",
          titleFontColor: "#000",
          lineThickness: 1
      },
 data: [
     {
       type: "scatter",
       markerSize: 10,
       markerColor: "rgba(0,0,0,0.3)",
       showInLegend: true,
       dataPoints: parseData(currentTest.rawData, "wheelSpeed", "abutStress", "Abutment Stress")
   }]
});




chart_abut.render();



   }



   function parseData(data, x_name, y_name){
           var parsed_data = data.map(function(d){
               return {"x": new Date(d[x_name])  , "y": d[y_name] }
           })
           //console.log(parsed_data)
           return parsed_data
   }



   function syncHandler(e) {
       var charts = [chart_main, chart_groove]
       console.log(charts)
       for (var i = 0; i < charts.length; i++) {
           var chart = charts[i];

           if (!chart.options.axisX)
   	    chart.options.axisX = {};

           if (!chart.options.axisY)
               chart.options.axisY = {};

           if (e.trigger === "reset") {

               chart.options.axisX.viewportMinimum = chart.options.axisX.viewportMaximum = null;
               chart.options.axisY.viewportMinimum = chart.options.axisY.viewportMaximum = null;

               chart.render();

           } else if (chart !== e.chart) {

               chart.options.axisX.viewportMinimum = e.axisX.viewportMinimum;
               chart.options.axisX.viewportMaximum = e.axisX.viewportMaximum;

               chart.options.axisY.viewportMinimum = e.axisY.viewportMinimum;
               chart.options.axisY.viewportMaximum = e.axisY.viewportMaximum;

               chart.render();

           }
       }
   }


 function addNote(e){
     //console.log(e)
     noteModal.show(200)
     noteModal.find(".btn").hide()
     var index = e.dataPointIndex
     var note_position = noteModal.find('p')
     note_position.html("<b>Data series:</b> " + e.dataSeries.name + "<br><b>Time: </b>" + e.dataPoint.x +" <br><b>Value: </b>" + e.dataPoint.y )
     var index = e.dataPointIndex

     trialNote.on('input', function(){
         if(trialNote.val().length > 0){
             noteModal.find(".btn-success").show(200)
         }
         else{
              noteModal.find(".btn-success").hide()
          }
     })

     noteModal.find(".btn").on('click', function(){
         currentTest.rawData[index].note = trialNote.val()
         trialNote.val("")
         noteModal.hide()
         // Save notes into the data base
         pouchdb.get( currentTest._id ).then(function(doc) {
             currentTest._rev = doc._rev
           return pouchdb.put( currentTest );
             }).then(function(response) {
                 console.log(response);
             }).catch(function (err) {
                 console.log(err);
             });

         plotData()
         console.log(currentTest.rawData[index])
     })
 }

 function showNote(e){
     //console.log(e)
     noteModal.show(200)
     noteModal.find(".btn-success").show()
     noteModal.find(".btn-danger").show()
     var index = e.dataPointIndex
     var note_position = noteModal.find('p')
     note_position.html("<b>Data series:</b> " + e.dataSeries.name + "<br><b>Time: </b>" + e.dataPoint.x +" <br><b>Value: </b>" + e.dataPoint.y )
     var index = e.dataPointIndex

     trialNote.val(currentTest.rawData[index].note)

     trialNote.on('input', function(){
         if(trialNote.val().length > 0){
             noteModal.find(".btn").show(200)
         }
         else{
              noteModal.find(".btn").hide()
          }
     })

     noteModal.find(".btn").on('click', function(){
         currentTest.rawData[index].note = trialNote.val()
         trialNote.val("")
         noteModal.hide()
         // Save notes into the database
         pouchdb.get( currentTest._id ).then(function(doc) {
             currentTest._rev = doc._rev
           return pouchdb.put( currentTest );
             }).then(function(response) {
                 console.log(response);
             }).catch(function (err) {
                 console.log(err);
             });

         plotData()
         console.log(currentTest.rawData[index])
     })


 }
