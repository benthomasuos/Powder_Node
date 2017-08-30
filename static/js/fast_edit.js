'use strict';

/* jshint globalstrict: true */
/* global dc,d3,crossfilter,colorbrewer */

var allGraphDivs = $('.graphDiv');
var allControls = $('.controls');
var plotAllTests = $('#plotAll');
var recipe_table = $('#recipe_table');

var chart_main = ""
var chart_resistance = ""
var chart_density = ""
var chart_consolidation = ""

var previewBox = $('#uploadImagesPreview')
var imageUpload = $('#imageUpload')
var testImages = $('#testImages');
var noteModal = $('#noteModal');
var currentTest = ""
var originalDatafile = ""

var form_groupDiv = $("<div class='form-group'></div>")
var input_groupDiv = $("<div class='input-group'></div>")
var formDiv = $("<form class='form'></form>")

var trialNote = $("#trialNote")

var sample = ""

//setup the in-browser database to save the uploaded flow stress data and saved fitted parameters
var pouchdb = new PouchDB('fast')
pouchdb.info().then(function (info) {
  console.log(info);
})

var powderdb = new PouchDB('powders')
powderdb.info().then(function (info) {
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
    testImages.html("");
    pouchdb.get( currentTest , { attachments : true } )
            .then(function(doc){
                currentTest = doc
                console.log(currentTest.testData)
                powderdb.get( currentTest.powder_id )
                        .then(function(powder){
                            console.log(powder)
                            sample = powder
                            populateTestForm(currentTest)
                            plotData()

                        })



                    })
    .catch(function(err){
        console.log(err)
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
            text: "RAW FAST machine data",
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
         title: "Force (kN)",
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
        title: "Relative Velocity (mm/min)",
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
       title: "Relative Position (mm)",
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
       title: "Current RMS (kA)",
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
      title: "Voltage RMS (V)",
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
    title: "Resistance (Ohms)",
    fontfamily: "Arial",
    titleFontSize: 20,
    labelFontSize: 12,
    lineColor: "#000",
    tickColor: "#000",
    labelFontColor: "#000",
    titleFontColor: "#000",
    lineThickness: 1
 }

      ],
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
          xValueType: "dateTime",
          showInLegend: true,
          name: "Av Pyro",
          legendText: "Av Pyro",
          axisYIndex: 0,
          dataPoints: parseData( currentTest.testData, "ptime", "avpyrometer")

          },
          {
            type: "line",
            xValueType: "dateTime",
            showInLegend: true,
            name: "AV Force",
            legendText: "AV Force",
            axisYIndex: 1,
            dataPoints: parseData( currentTest.testData, "ptime", "avforce")
        },
        {
          type: "line",
          xValueType: "dateTime",
          showInLegend: true,
          name: "Av Rel. Piston Travel",
          legendText: "Av Rel. Piston Travel",
          axisYIndex: 3,
          dataPoints: parseData( currentTest.testData, "ptime", "avrelpistont")

          },
          {
            type: "line",
            xValueType: "dateTime",
            showInLegend: true,
            name: "AV Speed",
            legendText: "AV Speed",
            axisYIndex: 2,
            dataPoints: parseData( currentTest.testData, "ptime", "avspeed")
        },
        {
          type: "line",
          xValueType: "dateTime",
          showInLegend: true,
          name: "I RMS",
          legendText: "I RMS",
          axisYIndex: 4,
          dataPoints: parseData( currentTest.testData, "ptime", "irms")

          },
          {
            type: "line",
            xValueType: "dateTime",
            showInLegend: true,
            name: "U RMS",
            legendText: "U RMS",
            axisYIndex: 5,
            dataPoints: parseData( currentTest.testData, "ptime", "urms")
        },
        {
          type: "line",
          xValueType: "dateTime",
          showInLegend: true,
          name: "Resistance",
          legendText: "Resistance",
          axisYIndex: 6,
          dataPoints: currentTest.testData.map(function(d){
              //console.log(d["urms"]  / (d["irms"]* 1000))
              return {"x": moment( d["ptime"], "HH:mm:ss"  ).toDate(), "y": d["urms"]  / (d["irms"]* 1000)}
          })
        }
        ]
    });

    chart_main.render();

    chart_resistance = new CanvasJS.Chart("resistanceGraph",
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
         text: "Process resistance",
         fontColor: "#008B8B",
         fontfamily: "Arial",
         fontSize: 20,
         padding: 8
     },
    axisX:{
         title: "Temperature (ºC)",
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
              title: "Resistance (Ohms)",
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
       name: "Resistance",
       legendText: "Resistance",
       axisYIndex: 0,
       dataPoints: currentTest.testData.map(function(d){
           //console.log(d["urms"]  / (d["irms"]* 1000))
           return {"x": d["avpyrometer"], "y": d["urms"]  / (d["irms"]* 1000)}
       })
       }]
    });

chart_resistance.render();

chart_density = new CanvasJS.Chart("densityGraph",
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
     text: "Density",
     fontColor: "#008B8B",
     fontfamily: "Arial",
     fontSize: 20,
     padding: 8
 },
axisX:{
     title: "Temperature (ºC)",
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
          title: "Relative Density",
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
   name: "Relative density",
   legendText: "Relative density",
   axisYIndex: 0,
   dataPoints: currentTest.testData.map(function(d){
       //console.log(d["urms"]  / (d["irms"]* 1000))
       var volume = Math.PI * (currentTest.mould_diameter / 2) * (currentTest.mould_diameter / 2) * d["avrelpistont"]
       var density = currentTest.sample_mass * 1000 / ( volume * sample.density.solid )
       return {"x": d["avpyrometer"], "y":  density }
   })
   }]
});

chart_density.render();



chart_consolidation = new CanvasJS.Chart("consolidationGraph",
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
     text: "Consolidation Rate",
     fontColor: "#008B8B",
     fontfamily: "Arial",
     fontSize: 20,
     padding: 8
 },
axisX:{
     title: "Temperature (ºC)",
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
          title: "Consolidation Rate (mm/s)",
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
   name: "Resistance",
   legendText: "Resistance",
   axisYIndex: 0,
   dataPoints: currentTest.testData.map(function(d){
       return {"x": d["avpyrometer"], "y": d["avspeed"] }
   })
   }]
});

chart_consolidation.render();















   }



   function parseData(data, x_name, y_name){
           var parsed_data = data.map(function(d){
               //console.log(moment( d[x_name], "HH:mm:ss" ).toDate(), d[y_name] )
               return {"x": moment( d[x_name], "HH:mm:ss"  ).toDate(), "y": d[ y_name ] }
           })
           return parsed_data
   }



   function syncHandler(e) {
       var charts = [chart_main, chart_groove]
       //console.log(charts)
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
