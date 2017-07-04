'use strict';

/* jshint globalstrict: true */
/* global dc,d3,crossfilter,colorbrewer */

var allGraphDivs = $('.graphDiv');
var allControls = $('.controls');
var plotAllTests = $('#plotAll');
var currentPowderTable = $('#currentPowders');
var tableBody = currentPowderTable.find("tbody")
var label = $('#alert');

var graphSS = ""
var chemistryDisplay = $("#chemistryDisplay")



var previewBox = $('#uploadImagesPreview')
var imageUpload = $('#imageUpload')
var powderImages = $('#powderImages');
var NH_K_slider = $('#NH_K_slider');
var NH_n_slider = $('#NH_n_slider');
var NH_m_slider = $('#NH_m_slider');
var NH_beta_slider = $('#NH_beta_slider');
var NH_temps = $('#NH_temperature');
var NH_strainrates = $('#NH_strainrate');

var sync_status = $("#sync_status")
//var psd_graph = $("#psd_graph")
//var tapDensity_graph = $("#tapDensity_graph")

var currentPowder_id = ""
var currentPowder = ""
var cumulative_pc = 0

//var $contextMenu = $("#contextMenu");


//setup the in-browser database to save the uploaded flow stress data and saved fitted parameters
var axi_db = new PouchDB('flowstress')
axi_db.info().then(function (info) {
  console.log(info);
})

var aspshear_db = new PouchDB('aspshear')
aspshear_db.info().then(function (info) {
  console.log(info);
})

var powders_db_local = new PouchDB('powders')
powders_db_local.info().then(function (info) {
  console.log(info);
})

var powders_db_remote = new PouchDB('http://143.167.48.53:5984/powders')
powders_db_remote.info().then(function (info) {
  console.log(info);
})


$(document).ready(function(){
    var sync_time = new Date()
    var time =  sync_time.getHours() + ":" + sync_time.getMinutes() + ":" + sync_time.getSeconds() +  " "+sync_time.getDate() + "-" + sync_time.getMonth() + "-" + sync_time.getFullYear()
    powders_db_local.sync(powders_db_remote).on('complete', function () {

            sync_status.html("Sync with remote database<br>Success @ " + time)
            sync_status.css("background-color", "#3d4")
          console.log("Database sync between local and remote Failed @ " + time)
        }).on('error', function (err) {

            sync_status.html("Database sync between local and remote<br>Failed @ " + time)
            sync_status.css("background-color", "#d34")
          console.log("Database sync between local and remote Failed @ " + time)
        });




    currentPowder_id = window.location.href.split("?")[1].split("=")[1];
    if(currentPowder_id){
        $('.page_header').find("span").html(currentPowder_id)


        console.log("Processing test: "+ currentPowder_id)
        getSinglePowder(currentPowder_id)

        //plotSingleTest(currentPowder)

    }else{
        console.log("No test chosen")
        getAllPowders()

    }


    $('#imageUpload').on("change", function(){
        var images = imageUpload[0].files;
        console.log(images)
        previewImages(images)

    })

    $('#uploadImages').on("click", function(){
        uploadImages(currentPowder_id)

    })


    $('#psd_file_input').on('change', function(){
        parsePSDFile()
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
            var typeInput =$('<input class="form-control" name="type" placeholder="Type" />')
            var magInput =$('<input class="form-control" name="mag" placeholder="Magnification" />')
            inputGroup.append( typeInput )
            inputGroup.append( magInput )
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




function uploadImages(powder_id){
    var images = previewBox.find('.imgBox')
    console.log(powder_id)

    images.each(function(){
        var image = $(this)
        //console.log(image)
        var img = image.find('img')
        //console.log(img)
        var type = img[0].src.split(";")[0].split(":")[0]
        var img_name = img.attr('name').split(".")[0].replace(/\s/g, "")
        //console.log(img_name)
        var img_type = image.find('input[name="type"]')
        var mag = image.find('input[name="mag"]')
        console.log('Uploading image: ' + img)
        var attachment = img[0].src.split(";")[1].split('base64,')[1]
        //attachment.position = position;
        //attachment.strain = strain;

        powders_db_local.get( powder_id ).then(function(doc){
                return powders_db_local.putAttachment(powder_id, img_name, doc._rev, attachment, type)
                    }).then(function(response) {
                       console.log(response)
                       image.remove()
                       getSingleTest( powder_id )
                    }).catch(function (err) {
                      console.log(err);
                    });



        })

            getSinglePowder(currentPowder)


}





function getSinglePowder(){
    tableBody.html("");
    powderImages.html("");
    powders_db_local.get( currentPowder_id, { attachments : true } )
            .then(function(doc){
                currentPowder = doc
                populatePowderForm()
                //loadData(doc);
                var images = doc._attachments
                    for( var key in images ){
                            console.log(key + " -> " + images[key]);

                            powders_db_local.getAttachment(doc._id, key )
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

                    }).then(function(){
                        displayElements()
                }).then(function(){
                        return aspshear_db.find( { selector: {  powder_id : currentPowder._id } } )
                    }).then(function(asptests){
                        $("#aspshear_tests").append("<span class='badge'>" + asptests.docs.length + "</span>" )
                        console.log(asptests.docs)
                    }).then(function(){
                        return axi_db.find( { selector: { powder_id : currentPowder._id } } )
                    }).then(function(axi_tests){
                        $("#axi_tests").append("<span class='badge'>" + axi_tests.docs.length + "</span>" )
                        console.log(axi_tests.docs)


                    }).then(function(){
                        console.log(currentPowder)
                        plotPSD(currentPowder)
                        plotTapDensity(currentPowder)

                    }).catch(function(err){

                    console.log(err)
                    $('#powder_status').show()

                    })



}





function displayElements(){

    $.getJSON("/data/elements.json", function(elements){
        console.log(elements[2])

        elements.forEach(function(element){

            //console.log(element)
            var box = $("<div class='thumbnail tile tile-small'></div>")
            box.append("<span style='float:left;font-size:0.65em'>" + element.atomicNumber + "</span>")
            box.append("<span style='float:right;font-size:0.65em'>" + element.atomicMass + "</span>")
            box.append("<h4 class='tile-text' style='color:black' >" + element.symbol + "</h4>")
            box.append("<span style='float:right;font-size:0.65em'><em>T<sub>m</sub></em>  " + (element.meltingPoint-273) + " ºC</span>")
            box.css("background-color", "#" + element.cpkHexColor )
            box.css("color", "#222" )
            var inputDiv = $("<div></div>")
            var wt_pc_input = $("<input class='wt_pc_input' placeholder='wt. %' name='"+element.name+"' type='number' min='0' id='" + element.name + "wt_pc_input' hidden/>")
            inputDiv.append(wt_pc_input)
            box.append(inputDiv)

            box.on('click', function(event){
                var input = $(this).find('.wt_pc_input')
                $(this).off()
                input.show('fast')

            })
            chemistryDisplay.append(box)
        })

        if(currentPowder.chemistry){
            for(var d in currentPowder.chemistry){
                if(currentPowder.chemistry[d].wt_pc > 0.0){
                    $("input[name=" + d + "]").show()
                    $("input[name=" + d + "]").val(currentPowder.chemistry[d].wt_pc)
            }
        }

    }
    })


}



function plotPSD(){

    if(currentPowder.psd){

     var psd_graph = new CanvasJS.Chart("psd_graph",
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
             text: "PSD for " + currentPowder.name,
             fontColor: "#000",
             fontfamily: "Arial",
             fontSize: 20,
             padding: 8
         },
     axisX:{
             title: "Particle diameter (µm)",
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
          title: "Vol. %",
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
        title: "Cumulative Vol.",
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
             name: "Mastersizer PSD",
             axisYindex: 0,
             color: "#333",
             toolTipContent: "Bin: {x} µm, % : {y}%",
             dataPoints: currentPowder.psd.data.map(function(d){
                 return {"x": d.size , "y": d.vol_pc }
             })
         },
         {
             name: "Cumulative",
             axisYType: "secondary",
             color: "#333",
             type: "line",
             toolTipContent: "Size: {x} µm, % : {y}%",
             dataPoints: currentPowder.psd.data.map(function(d){
                 cumulative_pc += d.vol_pc
                 return {"x": d.size , "y": cumulative_pc }
             })
         }]
     });

     psd_graph.render();

    }else{
        $("#psd_graph").html("<div class='well'><h4>No PSD data to plot</h4></div>")
    }

}




function plotTapDensity(){

    if(currentPowder.tapDensity){


     var tapDensity_graph = new CanvasJS.Chart("tapDensity_graph",
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
             text: "Tap density for " + currentPowder.name,
             fontColor: "#000",
             fontfamily: "Arial",
             fontSize: 20,
             padding: 8
         },
     axisX:{
             title: "Taps (#)",
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
          title: "Density (g/cm3)",
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
             name: "",
             color: "#333",
             type: 'line',
             toolTipContent: "Tap: {x} , Density : {y} g/cm3",
             dataPoints: currentPowder.tapDensity.data.map(function(d){
                 return {"x": d.tap , "y": d.density }
             })
         }]
     });

     tapDensity_graph.render();

    }else{
        $("#tapDensity_graph").html("<div class='well'><h4>No tap density data to plot</h4></div>")
    }

}



function populatePowderForm(){
    $("input[name='sample_id']").val(currentPowder._id)
    $("input[name='name']").val(currentPowder.name)
    $("input[name='alloy']").val(currentPowder.alloy)
    $("input[name='base_metal']").val(currentPowder.base_metal)
    $("input[name='supplier']").val(currentPowder.supplier)
    $("#morphology").val(currentPowder.morphology)
    $("input[name='created']").val( currentPowder.created.split("T")[1].split(".")[0] + " " + currentPowder.created.split("T")[0] )
    $("input[name='modified']").val( currentPowder.modified.split("T")[1].split(".")[0] + " " + currentPowder.modified.split("T")[0] )
    $("input[name='psd_min']").val(currentPowder.psd_min)
    $("input[name='psd_max']").val(currentPowder.psd_max)
    if(currentPowder.psd){
        $("#psd_update").addClass("btn-success")
        $("input[name='d_10']").val(currentPowder.psd.d_10)
        $("input[name='d_50']").val(currentPowder.psd.d_50)
        $("input[name='d_90']").val(currentPowder.psd.d_90)
    }
    $("input[name='av_particle_porosity']").val(currentPowder.av_particle_porosity)
    $("input[name='surface_area_ratio']").val(currentPowder.surface_area_ratio)
    if(currentPowder.hall_flow){
        $("input[name='hall_flow_time']").val(currentPowder.hall_flow.time)
        $("input[name='hall_flow_orifice']").val(currentPowder.hall_flow.orifice)
        $("input[name='hall_flow_mass']").val(currentPowder.hall_flow.mass)
    }else{
        $("#psd_update").addClass("btn-danger")
    }
    if(currentPowder.AoR){
        $("input[name='AoR_static']").val(currentPowder.AoR.static)
        $("input[name='AoR_dynamic']").val(currentPowder.AoR.dynamic)
    }
    if(currentPowder.density){
        $("input[name='solid_density']").val(currentPowder.density.solid)
        $("input[name='bulk_density']").val(currentPowder.density.bulk)
    }
    currentPowder.carr_index = $("input[name='carr_index']").val()
    currentPowder.hausner_ratio = $("input[name='hausner_ratio']").val()


}





function savePowder(){

    currentPowder.name = $("input[name='name']").val()
    currentPowder.alloy = $("input[name='alloy']").val()
    currentPowder.base_metal = $("input[name='base_metal']").val()
    currentPowder.supplier = $("input[name='supplier']").val()
    currentPowder.morphology = $("#morphology").val()
    if(!currentPowder.psd){
        currentPowder.psd = {}
    }
    currentPowder.psd.d_10 = $("input[name='d_10']").val()
    currentPowder.psd.d_50 = $("input[name='d_50']").val()
    currentPowder.psd.d_90 = $("input[name='d_90']").val()
    currentPowder.av_particle_porosity = $("input[name='av_particle_porosity']").val()
    currentPowder.surface_area_ratio = $("input[name='surface_area_ratio']").val()
    if(!currentPowder.hall_flow){
        currentPowder.hall_flow = {}
    }
    currentPowder.hall_flow.time = $("input[name='hall_flow_time']").val()
    currentPowder.hall_flow.orifice = $("input[name='hall_flow_orifice']").val()
    currentPowder.hall_flow.mass = $("input[name='hall_flow_mass']").val()
    if(!currentPowder.AoR){
        currentPowder.AoR = {}
    }
    currentPowder.AoR.static = $("input[name='AoR_static']").val()
    currentPowder.AoR.dynamic = $("input[name='AoR_dynamic']").val()
    if(!currentPowder.density){
        currentPowder.density = {}
    }
    currentPowder.density.solid = $("input[name='solid_density']").val()
    currentPowder.density.bulk = $("input[name='bulk_density']").val()
    currentPowder.carr_index = $("input[name='carr_index']").val()
    currentPowder.hausner_ratio = $("input[name='hausner_ratio']").val()


    if(!currentPowder.chemistry){
        currentPowder.chemistry = {}
    }
    var elements = $("#chemistryDisplay").find("input")

    elements.each(function(i, d){
        //console.log(d)
        currentPowder.chemistry[ d.name ] = {}
        currentPowder.chemistry[ d.name ].wt_pc = d.value
    })

    currentPowder.modified = new Date()

    powders_db_local.get( currentPowder._id )
            .then(function(doc){
                currentPowder._rev = doc._rev
                powders_db_local.put(currentPowder)
            }).then(function(result){
                label
                    .removeClass("alert-danger")
                    .addClass("alert-success")
                    .html("Successfully updated powder")
                    .show(200)
                    .delay(2000)
                    .hide(200)
            })
            .catch(function(err){
                console.log(err)
                label
                    .removeClass("alert-success")
                    .addClass("alert-danger")
                    .html("Failed to update powder: Error =  "+ err.name)
                    .show(200)
                    .delay(2000)
                    .hide(200);
            })


}



function parsePSDFile(){

    var psd_file = $("#psd_file_input")[0].files[0];
    if(psd_file){
        var reader = new FileReader();
        reader.readAsText(psd_file);
        var data = "";
        reader.onloadend = function(event){
            data = event.target.result
            console.log(typeof(data))
            console.log(data)
            data = data.split('\r')
            console.log(data)
            if(currentPowder.psd.data){
                var overwrite = confirm("PSD data already exists. Do you want to overwrite this data?")
                if(overwrite == true){
                    console.log("PSD data already exists and user DOES want to overwrite")
                        currentPowder.psd.sample_name = data[0]
                        currentPowder.psd.filename = psd_file.name
                        currentPowder.psd.lastModified = psd_file.lastModified
                        currentPowder.psd.data = []
                        for(var i=3; i< data.length; i++){
                            var reading = data[i]
                            currentPowder.psd.data.push( { "size": reading.split('\t')[0], "vol_pc": reading.split('\t')[1]  }  )
                        }

                }
                else{
                    console.log("PSD data already exists and user does NOT want to overwrite")
                }
            }else{
                console.log("PSD data doesn't already exist")
                currentPowder.psd = {}
                currentPowder.psd.sample_name = data[0]
                currentPowder.psd.filename = psd_file.name
                currentPowder.psd.lastModified = psd_file.lastModified
                currentPowder.psd.data = []
                for(var i=3; i< data.length; i++){
                    var reading = data[i]
                    currentPowder.psd.data.push( { "size": reading.split('\t')[0], "vol_pc": reading.split('\t')[1]  }  )
                }

            }
            plotPSD()
            console.log(currentPowder)

        }

    }






}
