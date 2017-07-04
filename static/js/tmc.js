var currentTestTable = $('#currentTests');
var tableBody = currentTestTable.find("tbody")
var addNewTest_btn = $("#addNewTest_btn")
var test_start = $("#test_start")
var test_start = $("#test_end")
var uploaded_start = $("#uploaded_start")
var uploaded_end = $("#uploaded_end")
var samples = $("#samples")
var temp_min = $("#temp_min")
var temp_max = $("#temp_max")
var sr_min = $("#sr_min")
var sr_max = $("#sr_max")
var matrix_chart = ""
//setup the in-memory database to save the uploaded flow stress data and saved fitted parameters


var test_db = new PouchDB('flowstress')
test_db.info().then(function (info) {
  console.log(info);
})

$(document).ready(function(){
    initialiseSearch()
    getAllTests()

    addNewTest_btn.on('click',function(){
        newTestForm()
    })


    $(".fa-caret-up").on('click', function(){
        $(this).closest(".panel").find(".panel-body").toggle();
        $(this).toggleClass("fa-caret-up");
        $(this).toggleClass("fa-caret-down");
    })

    $(".fa-times").on('click', function(){
        $(this).parent().closest(".panel").hide(200);
    })

    $("#searchBoxToggle").on('click', function(){
        $('#testSearchBox').toggle(500);
    })





})


function initialiseSearch(){
    samples.find('option').remove();
    test_db.allDocs({
            include_docs : true
            })
            .then(function(result){
                if(result.rows.length > 0){

                    for(i=0; i<result.rows.length; i++){
                        var doc = result.rows[i].doc;
                            //console.log(doc);
                            var option = $("<option></option>");
                            option
                                .html(doc.sample.name.user_defined)
                                .val(doc.sample.name.user_defined)
                            samples.append(option)
                            }

                        }
                        else{
                            $('#test_status').show()

                        }

            }).catch(
                    console.log("Couldn't retrieve data from the database")
            )


}

function getAllTests(){
    samples.find('option:selected').removeAttr("selected");
    var allTests = [];
    tableBody.html("");

    //  Query the test_db database
    test_db.allDocs({
                include_docs : true
            })
            .then(function(result){
                console.log(result.rows)
                        if(result.rows.length > 0){
                            $('#num_tests').find('span').html(result.rows.length)

                            $('#test_status').hide()
                            for(i=0; i<result.rows.length; i++){
                                var doc = result.rows[i].doc;
                                var test_id = result.rows[i].id
                                //console.log(doc)
                                var row = $('<tr></tr>')
                                row.attr("name", test_id)
                                var id_cell = row.append( $('<td></td>').html(test_id) )
                                if(doc.sample.name.user_defined){
                                    var sample_name = doc.sample.name.user_defined
                                }else if(doc.sample.name.musfile_defined){
                                    var sample_name = doc.sample.name.musfile_defined
                                }else{
                                        var sample_name = 'N/A'
                                }
                                var sample_cell = row.append( $('<td></td>').html(sample_name) )

                                $('#matrixSampleChoice').append("<option value = >")
                                var temp_cell = row.append( $('<td></td>').html(+doc.temperature) )
                                var sr_cell = row.append( $('<td></td>').html(+doc.strainrate) )
                                var datapoints_cell = row.append( $('<td></td>').html(doc.measurements.length) )
                                var testdate_cell = row.append( $('<td></td>').html( doc.testdate ) )
                                var created_cell = row.append( $('<td></td>').html(doc.created) )
                                var analyse_cell =  $('<td></td>')


                                analyse_cell.html("<a href='/tests/tmc/process?_id="+test_id+"'><i class='fa fa-table fa-2x'></i></a>")
                                row.append( analyse_cell )

                                var checkbox = $('<input class="form-control" type="checkbox" />').attr('name', test_id ).attr('id', test_id)
                                var compareCell = $('<td></td>').append(checkbox)
                                if(doc.analysed == true){
                                    analyse_cell.find('i').css('color', 'green')

                                }
                                else(
                                    analyse_cell.find('i').css('color', 'red')
                                )

                                row.append( compareCell )
                                var edit_cell =  row.append($('<td></td>').html("<a href='/tests/tmc/edit?_id="+test_id+"'><i class='fa fa-edit fa-2x'></i></a>"))


                                var trash_cell = row.append( $('<td></td>').html("<i class='fa fa-trash fa-2x'></i>") )
                                tableBody.append(row)
                            }


                        tableBody.find("i.fa-trash").on('click', function(){
                            var test_id = $(this).closest('tr').attr('name');
                            console.log("Deleting test " + test_id)
                            //var response = confirm("Are you sure you want to delete test: "+ test_id)
                            var response = true
                            if( response == true){
                                removeTest(test_id);
                            }
                        })

                        tableBody.find('input[type="checkbox"]').on('change', function(){
                            var tests_to_compare = [];
                            tableBody.find('input[type="checkbox"]').each(function(){
                                if( $(this)[0].checked ){
                                    tests_to_compare.push( $(this).attr('name') );
                                }
                            })

                            if( tests_to_compare.length >= 2 ){
                                var testString = ""
                                for(var i=0;i<tests_to_compare.length;i++){
                                    testString += "_id_"+ i+ "=" + tests_to_compare[i]
                                    if(i<tests_to_compare.length-1){
                                        testString += "&";
                                    }
                                }
                                console.log(testString)
                                $('#compareTests').html("<a href='/tests/tmc/compare?"+ testString +"'><div class='btn btn-md btn-primary'>Compare tests</div>")

                                //console.log("Tests to compare: " + tests_to_compare);
                            }
                            else{
                                $('#compareTests').html("")
                                console.log("Need two or more tests to compare" );
                            }
                        })




                        }
                        else{
                            $('#test_status').show()

                        }
                        initialiseSearch()

            }).catch(
                    console.log("Couldn't retrieve data from the database")
            ) //  End of query and response to query



}


function getSearchedTests(){
    var allTests = [];
    tableBody.html("");
    var allSamples = []
    samples.find('option:selected').each(function(){
        allSamples.push( $(this).val() );
    })

    console.log(allSamples)
    if(allSamples.length == 0){

    }

    test_db.find(
        { selector: {
                        sample: { "$in": allSamples } ,
                        temperature: { "$gte" : temp_min.val() },
                        temperature: { "$lte" : temp_max.val() },
                        strainrate: { "$gte" : sr_min.val() },
                        strainrate: { "$lte" : sr_max.val() }
                    }
        })
            .then(function(result){
                console.log(result);
                var number_of_tests = result.docs.length
                    $('#num_tests').find('span').html(number_of_tests)
                        if(number_of_tests > 0){
                            $('#test_status').hide()
                            for(i=0; i<number_of_tests; i++){
                                var doc = result.docs[i];
                                var test_id = doc._id
                                //console.log(doc)
                                var row = $('<tr></tr>')
                                row.attr("name", test_id)
                                var id_cell = row.append( $('<td></td>').html(test_id) )
                                if(doc.sample.name.user_defined){
                                    var sample_name = doc.sample.name.user_defined
                                }else if(doc.sample.name.musfile_defined){
                                    var sample_name = doc.sample.name.musfile_defined
                                }else{
                                        var sample_name = 'N/A'
                                }

                                var sample_cell = row.append( $('<td></td>').html(sample_name) )
                                var temp_cell = row.append( $('<td></td>').html(doc.temperature) )
                                var sr_cell = row.append( $('<td></td>').html(doc.strainrate) )
                                var datapoints_cell = row.append( $('<td></td>').html(doc.measurements.length) )
                                var testdate_cell = row.append( $('<td></td>').html(doc.testdate ) )
                                var created_cell = row.append( $('<td></td>').html(doc.created) )
                                var analyse_cell =  $('<td></td>')
                                analyse_cell.html("<a href='/process/test?_id="+test_id+"'><i class='fa fa-table fa-2x'></i></a>")
                                row.append( analyse_cell )
                                var compareCell = $('<td></td>').append(checkbox)
                                if( doc.analysed == true){
                                    var checkbox = $('<input class="form-control" type="checkbox" />').attr('name', test_id ).attr('id', test_id)
                                    var compareCell = $('<td></td>').append(checkbox)

                                }
                                else{
                                    compareCell.html("N/A")
                                }
                                row.append( compareCell )
                                var trash_cell = row.append( $('<td></td>').html("<i class='fa fa-trash fa-2x'></i>") )
                                tableBody.append(row)
                            }

                            tableBody.find("i.fa-trash").on('click', function(){
                                var test_id = $(this).closest('tr').attr('name');
                                console.log("Deleting test " + test_id)
                                var response = confirm("Are you sure you want to delete test: "+ test_id)
                                if( response == true){
                                    removeTest(test_id);
                                }
                            })

                        tableBody.find('input[type="checkbox"]').on('change', function(){
                            var tests_to_compare = [];
                            tableBody.find('input[type="checkbox"]').each(function(){
                                if( $(this)[0].checked ){
                                    tests_to_compare.push( $(this).attr('name') );
                                }
                            })

                            if( tests_to_compare.length >= 2 ){
                                var testString = ""
                                for(var i=0;i<tests_to_compare.length;i++){
                                    testString += "_id_"+ i+ "=" + tests_to_compare[i]
                                    if(i<tests_to_compare.length-1){
                                        testString += "&";
                                    }
                                }
                                console.log(testString)
                                $('#compareTests').html("<a href='/compare?"+ testString +"'><div class='btn btn-md btn-primary'>Compare tests</div>")

                                //console.log("Tests to compare: " + tests_to_compare);
                            }
                            else{
                                $('#compareTests').html("")
                                console.log("Need two or more tests to compare" );
                            }
                        })



                        }
                        else{
                            $('#test_status').show()

                        }

            }).catch(
                    console.log("Couldn't retrieve data from the database")
            )




}



function newTestForm(){
    $('#dataInput').show()
    var panel_body = $('#dataInput').find('div.panel-body').html('');


    var dataInputForm = "<form id='testForm'><h3>Upload musfile</h3><div class='form-group'><div class='input-group col-md-12' id='typeDiv' hidden><label for='test_type'>Test type</label><select class='form-control' name='test_type'><option value='axi'>Axi compression</option><option value='powder'>Powder compression</option><option value='psc'>Plane strain compression</option></select></div><div class='input-group col-md-12' id='sampleDiv' hidden><label for='sample_name'>Sample name</label><input type='test' class='form-control' name='sample_name' placeholder='Sample name'/></div><div class='form-group'><div class='input-group col-md-12' id='musfileDiv' hidden><label for='musfile'>Upload musfile</label><input type='file' class='form-control' name='musfile' placeholder='MUSfile' accept='text/*,.MUS'/></div><div class='form-group' ><div class='input-group'><div class='btn btn-md btn-default' id='newTest' onclick='newTestForm()' ><i class='fa fa-reset'></i> Reset</div><div class='btn btn-md btn-success' id='saveTest' onclick='saveTest()' hidden><i class='fa fa-save'></i> Save data</div><div class='alert' id='alert' hidden></div></div></div></form>"




    panel_body.append(dataInputForm);

    var testType = $('select[name="test_type"]')

    testType.on('change', function(){
        var sampleName =  $('input[name="sample_name"]')
        switch( $(this).val() ){
            case "axi":
                sampleName.show(200);
                sampleName.on('input', function(){
                        $('#musfileDiv').show(200);
                        $('#musfileDiv').on('input', function(){
                            $('#saveTest').show(200);
                        })
                    })
            break;
            case "powder":
                sampleName.hide();
                var powders = getPowders();
                var powderSelect = $("<select name='sample_name'></select>")
                powderSelect.before('<label for="sample_name">Sample name</label>')
                //testType.after()
                for(var i=-1; i<powders.length;i++){
                    if(i<0){
                        powderSelect.append('<option disabled>Select powder</option>')
                    }
                    var powder = powders[i]
                    var option = $('<option value="' + powder.id + '">'+ powder.name +'</option>')
                    powderSelect.append(option)
                }

                powderSelect.on('change', function(){
                        $('#musfileDiv').show(200)
                        $('#musfileDiv').on('input', function(){
                            $('#saveTest').show(200)
                        })
                })
            break;
            case "psc":
                sampleName.show()
                sampleName.on('input', function(){
                        $('#musfileDiv').show(200)
                        $('#musfileDiv').on('input', function(){
                            $('#saveTest').show(200)
                        })
                    })
            break;
        }


    })





    var fileupload = $('input[name="musfile"]')
    fileupload.on("load", function(){
        console.log(reader.result)
    })

}





function saveTest(){
    var form = $('#testForm');
    var test = {}
    var label = form.find("#alert")
    var musfile = form.find('input[name="musfile"]')[0].files[0];
    if(musfile){
        var reader = new FileReader();
        reader.readAsText(musfile);
        var data = "";
        reader.onloadend = function(event){
            data = event.target.result
            console.log(typeof(data))
            test = parseMusfile(data);

            test.created = new Date();
            test.sample.name.user_defined = form.find('input[name="sample_name"]').val();
            test.type = form.find('select[name="test_type"]').val();

            test.tools = {
                "top": {},
                "middle": {},
                "bottom": {}
            }
            test.musfile.file = data

            switch(test.type){
                case "axi":
                    test.hardness = {}
                    test.sample.type = "solid"
                break;
                case "powder":
                    test.sample.type = "powder"
                break;
                case "psc":
                    test.hardness = {}
                    test.sample.type = "solid"
                break;
            }


            test_db.put( test )
                .then(function(result){
                    console.log(result)
                    label
                        .removeClass("alert-danger")
                        .addClass("alert-success")
                        .html("Saved test: <b> " + test._id + "</b>")
                        .show(200)
                        .delay(2000)
                        .hide(200)
                        getAllTests();
                    })
                    .catch(function(err){
                        console.log(err)
                        label
                            .removeClass("alert-success")
                            .addClass("alert-danger")
                            .html("Error: "+ err.name)
                            .show(200)
                            .delay(2000)
                            .hide(200);
                    })

        }
    }
    else{
        label
            .removeClass("alert-success")
            .addClass("alert-danger")
            .html("Data missing")
            .show(200)
            .delay(2000)
            .hide(200);
    }

}





function removeTest(test_id){
    test_db.get( test_id )
            .then(function(doc){
                return test_db.remove( doc );
            }).then(function(result){
                console.log("Test removed: " + result)
                getAllTests();
            }).catch(function(err){
                console.log(err)
            })
}



function parseMusfile(data){
       var testData = {};

       var sections = data.split("\n[");
       testData.measurements = {};
       testData.analysed = false;
       testData.headers = sections[1].split('\n').splice(0);
       testData.syspar = sections[2].split('\n').splice(0);
       testData.muspar = sections[3].split('\n').splice(0);
       testData.batchinfo = sections[4].split('\n').splice(0);
       testData.conf_segs = sections[5].split('\n').splice(0);
       testData.segments = {};
       testData.temperature = 20.0
       for(i=6;i<sections.length-2;i++){
           var segment = {}
           var segment_rows = sections[i].split("]")[1].split("\n")
           for(j=1;j<segment_rows.length-1;j++){
               var name = segment_rows[j].split('=')[0]
               var text = segment_rows[j].split('=')[1].replace('/\s/',"")
               var value = text.split('\t')[1]
               var units = text.split('\t')[2]
               segment[name] = text
               if(name == "Strain rate"){
                   testData.strainrate = +value;
               }

           }
           testData.segments[ i-6 ] = segment
           console.log(segment["Position"])
           if(segment["Start temperature"] && segment["End temperature"]){
               if(segment["Start temperature"] == segment["End temperature"] ){
                       var temperature = segment["End temperature"].split(' ')[0]
                       console.log(segment["End temperature"].split(' ')[0])
                        testData.temperature = +temperature;
                   }
               }
       }

       var alarms = sections[sections.length-2 ].split("\n").splice(0)
       testData.alarms = {};
       for(j=2;j<alarms.length-1;j++){
           var alarm = {}
           alarm.type = alarms[j].split("=")[0]
           alarm.message = alarms[j].split("=")[1]
           testData.alarms[j] = alarm
       }

       var rows = data.split('\n');

       testData.location = rows[0].split('\t')[0]
       testData.test_config = testData.headers[2].split("=")[1].replace(/\s/g, "")
       testData.system_part = testData.headers[1].split("=")[1].replace(/\s/g, "")
       testData.operator = testData.headers[5].split("=")[1].replace(/\s/g, "")
       var musfile = rows[0].split('\t')[2]
       testData._id = musfile


       testData.musfile = {}
       testData.musfile.name = musfile

       var sample = {}
       sample.dimensions = {}
       sample.name= {}
       sample.name.musfile_defined = testData.headers[3].split("=")[1].replace(/\s/g, "")
       sample.type = testData.headers[12].split("=")[1].replace(/\s/g, "")
       sample.material = testData.headers[13].split("=")[1].replace(/\s/g, "")

       sample.elastic_modulus = testData.headers[14].split("=")[1].split(" ")[0].replace(/\s/g, "")
       sample.thermal_expansion = testData.headers[15].split("=")[1].split(" ")[0].replace(/\s/g, "")
       testData.sample = sample

       var testdate = {};
       var datetime = rows[1].split('\t')[0].split(' ')
       var day = datetime[0];
       var month = datetime[1];
       var year = datetime[2];
       var time = datetime[3].split(":")
       var time = time
       var hours = time[0]
       var minutes = time[1]
       var seconds = time[2]
       testData.testdate = day + " " + month + ", " + year + " " + hours + ":" + minutes + ":" + seconds

       var test = sections[0].split('\n')
       var columnHeaders = test[5].split('\t');
       //console.log(columnHeaders)
       for(i=0;i<columnHeaders.length;i++){
            var name = columnHeaders[i].toString()
                                        .split("[")[0]
            columnHeaders[i] = name.toString()
                                .split("(")[0]
                                .replace(/\s/g, "")
                                .replace(/\./g, "")
                                .toLowerCase()
                                .toString()
        //    console.log(columnHeaders[i])
      }
      var headerLine = columnHeaders.join("\t")
      //console.log(columnHeaders)
      test.pop();
      //console.log(test)
      test[5] = headerLine
      //console.log(test)
      var allData = test.splice(5).join("\n")
      //console.log(allData)
      //test[0] = columnHeaders

      //console.log(testData)
      var measurements = []
      Papa.parse( allData ,  {
                  complete: function(results) {
                            console.log("File parsed successfully");
                            //console.log(results)
                            testData.measurements = results.data;
                            //console.log(results.data)
                        },
                   error: function(err, file){
                           console.log(err, file);
                       },
                   header: true,
                   skipEmptyLines: true,
                   dynamicTyping: true
               } ); // end of Papa.parse()

    //check certain data and return null if over or under certain limits

     measurements = testData.measurements.map(function(d){
         //console.log(d)
         if(d.load < -1000.0 ||  d.load > 1000.0){
             d.load = null
         }
         if(d.displacement < -1000.0 ||  d.displacement > 1000.0){
             d.displacement = null
         }
         if(d.sample_temp_2_centre < -2000.0 ||  d.sample_temp_2_centre > 2000.0){
             d.sample_temp_2_centre = null
         }
         if(d.velocity_ < -10000.0 ||  d.velocity_ > 10000.0){
             d.velocity_ = null
         }

         return d
    })
    testData.measurements = measurements

   return testData
}



function testMatrix(){

    matrix_chart = new CanvasJS.Chart("matrix",
   {
       height: 600,
       width: 600,
       animationEnabled: true,
       exportEnabled: true,
       exportFileName: "Test matrix",
       title: {
           text: "Test Matrix",
           fontColor: "#000",
           fontfamily: "Arial",
           fontSize: 24,
           padding: 8
       },
   axisX:{
           title: "Strain rate (/s)",
           fontColor: "#000",
           fontfamily: "Arial",
           titleFontSize: 30,
           labelFontSize: 24,
           labelFontColor: "#000",
           titleFontColor: "#000",
           lineThickness: 0,
           logarithmic:  true
   },
   axisY:
      {
        title: "Temperature (ºC)",
        fontfamily: "Arial",
        titleFontSize: 30,
        labelFontSize: 24,
        labelFontColor: "#000",
        titleFontColor: "#000",
        lineThickness: 0
    },
       data:[
           {
               type:"scatter",
               dataPoints: [],
               markerType: "square",
               markerColor: "steelblue",
               markerSize: 100
           }
       ]
   });




  // matrix_chart.render();


}



$('#matrixSampleChoice').on('input', function(){
    var sample = $(this).find('option:selected').val()
    showMaterialTests(sample)

})



function showMaterialTests(sample){

    testMatrix()

    test_db.allDocs({include_docs: true}

    ).then(function(results){
        for(i=0; i<result.rows.length; i++){
            var doc = result.rows[i].doc;
            console.log(doc)
            plotMaterialTest(doc)
        }
    })
    .catch(function(err){
        console.log("Cannot find tests related to this powder")
    })


}



function plotMaterialTest(test){
    console.log("HEllo plotting")
    matrix_chart.options.data[0].dataPoints.push({
        x : test.strainrate ,
        y : test.temperture,
        label : test.sample.name.user_defined

    })
    matrix_chart.render()


}
