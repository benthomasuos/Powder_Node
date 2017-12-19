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
var material_chart = "";
var local_powders = ""
var remote_powders = ""
var materialData = []
var unique_strains = []
var unique_strainrates = []
var unique_temperatures = []
//setup the in-memory database to save the uploaded flow stress data and saved fitted parameters


var test_db = new PouchDB('flowstress')
test_db.info().then(function (info) {
  console.log(info);
})

/*
//Use this to delete indexes in the tmc database
test_db.getIndexes().then(function (indexesResult) {
  return test_db.deleteIndex(indexesResult.indexes[1]);
}).then(function (result) {
  console.log(result)
}).catch(function (err) {
  console.log(err);
});
*/

test_db.createIndex({
    index : {
        fields:['type', 'sample', 'strainrate', 'temperature'],
        name: "tmc_index"
    }
}).then(function (result) {
  console.log(result)
}).catch(function (err) {
  console.log(err);
});


var powders_db_local = new PouchDB('powders')
powders_db_local.info().then(function (info) {
  console.log(info);
  local_powders = info.doc_count
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
    }).then(function(result){
        console.log(result)
                if(result.rows.length > 0 ){

                    for(i=0; i<result.rows.length; i++){
                            var doc = result.rows[i].doc;
                            if(!doc.language){  // Don't include any index documents
                                //console.log(doc);
                                var option = $("<option></option>");
                                option
                                    .html(doc.sample.name.user_defined)
                                    .val(doc.sample.name.user_defined)
                                samples.append(option)
                            }

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
    test_db.find({
                selector : { type :{ $in : ["Axi", "Powder"]}  }
            })
            .then(function(result){
                //console.log(result)
                        if(result.docs.length > 0){
                            $('#num_tests').find('span').html(result.docs.length)

                            $('#test_status').hide()
                            for(i=0; i<result.docs.length; i++){
                                var doc = result.docs[i];
                                var test_id = doc._id
                                console.log(doc)
                                var row = $('<tr></tr>')
                                row.attr("name", test_id)
                                var id_cell = row.append( $('<td name="id"></td>').html(test_id) )
                                var type_cell = row.append( $('<td></td>').html(doc.type) )
                                if(doc.sample.name.user_defined){
                                    var sample_name = doc.sample.name.user_defined
                                }else if(doc.sample.name.musfile_defined){
                                    var sample_name = doc.sample.name.musfile_defined
                                }else{
                                        var sample_name = 'N/A'
                                }
                                var sample_cell = row.append( $('<td name="sample"></td>').html(sample_name) )

                                $('#matrixSampleChoice').append("<option value = >")
                                var temp_cell = row.append( $('<td name="temperature"></td>').html(+doc.temperature) )
                                var sr_cell = row.append( $('<td name="strainrate"></td>').html(+doc.strainrate) )
                                var datapoints_cell = row.append( $('<td></td>').html(doc.measurements.length) )
                                var testdate_cell = row.append( $('<td></td>').html( doc.testdate ) )
                                var created_cell = row.append( $('<td></td>').html(doc.created) )
                                var analyse_cell =  $('<td></td>')


                                analyse_cell.html("<a href='/tests/tmc/process?_id="+test_id+"'><i class='fa fa-edit fa-2x'></i></a>")
                                row.append( analyse_cell )

                                var checkbox = $('<input class="form-control" type="checkbox" />').attr('name', test_id ).attr('id', test_id)
                                var compareCell = $('<td></td>').append(checkbox)
                                if(doc.analysed == true){
                                    analyse_cell.find('i').css('color', 'green')
                                    analyse_cell.attr('name' ,'analysed_true')

                                }
                                else{
                                    analyse_cell.find('i').css('color', 'red')
                                    analyse_cell.attr('name' ,'analysed_false')
                                }

                                row.append( compareCell )
                                //var edit_cell =  row.append($('<td></td>').html("<a href='/tests/tmc/edit?_id="+test_id+"'><i class='fa fa-edit fa-2x'></i></a>"))


                                var trash_cell = row.append( $('<td></td>').html("<i class='fa fa-trash fa-2x'></i>") )
                                tableBody.append(row)
                            }
                            currentTestTable.DataTable()

                        tableBody.find("i.fa-trash").on('click', function(){
                            var test_id = $(this).closest('tr').attr('name');
                            console.log("Deleting test " + test_id)
                            var response = confirm("Are you sure you want to delete test: " + test_id)
                            //var response = true
                            if( response == true){
                                removeTest(test_id);
                            }
                        })

                        tableBody.find('input[type="checkbox"]').on('change', function(){
                            var tests_to_compare = [];
                            tableBody.find('input[type="checkbox"]').each(function(){
                                if( $(this)[0].checked ){
                                    var row = $(this).parent().parent();
                                    var analysed = row.find('td[name*="analysed_"]').attr('name').split('_')[1]
                                    console.log(analysed)

                                    console.log(row)
                                    tests_to_compare.push( {
                                        "id" : row.find('td[name="id"]').html(),
                                        "sample" : row.find('td[name="sample"]').html() ,
                                        "strainrate" : row.find('td[name="strainrate"]').html(),
                                        "temperature" : row.find('td[name="temperature"]').html(),
                                        "analysed" : analysed
                                    });

                                }
                            })







                            if(tests_to_compare.length == 2){
                                initDeformMatrix()
                            }
                            else if(tests_to_compare.length < 2){
                                $('#materialMatrix').hide(200);
                            }

                            if( tests_to_compare.length >= 2 ){
                                var testString = ""
                                for(var i=0;i<tests_to_compare.length;i++){
                                    var test = tests_to_compare[i];
                                    testString += "_id_"+ i+ "=" + test.id;
                                    console.log("Test data: " + test.id, test.sample, test.strainrate, test.temperature, test.analysed)
                                    appendToMatrix(test.id, test.sample, test.strainrate, test.temperature, test.analysed, test.yield_strength_02_mpa, test.ultimate_compressive_strength)
                                    if(i<tests_to_compare.length-1){
                                        testString += "&";
                                    }
                                }
                                console.log(testString)
                                $('#compareTests').html("<a href='/tests/tmc/compare?"+ testString +"'><div class='btn btn-md btn-primary'>Compare tests</div>")
                                var downloadMatBtn = $("<a class='btn btn-success btn-md' id ='downloadMat'><i class='fa fa-download'></i> DEFORM Material</a>")
                                $('#compareTests').append(downloadMatBtn);


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
                                var type_cell = row.append( $('<td></td>').html(doc.type) )
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
    $('#dataInputForm').show()
    $('#dataInputForm').find('input').val("")
    var testType = $('select[name="test_type"]')

    testType.on('change', function(){
        $('#powderSelect').remove()
        var sampleName =  $('input[name="sample_name"]')
        switch( $(this).val() ){
            case "Axi":
                sampleName.show(200);
                sampleName.on('input', function(){
                        $('#musfileDiv').show(200);
                        $('#musfileDiv').on('input', function(){
                            $('#saveTest').show(200);
                        })
                    })
            break;
            case "Powder":
                sampleName.hide();
                getPowders();
            break;
            case "PSC":
                $('#powderSelect').remove()
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


function getPowders(){
    powders_db_local.allDocs({
            include_docs : true
            })
            .then(function(result){
                if(result.rows.length > 0){
                    var powderSelect = $("<select name='powder_name' id='powderSelect' class='form-control'></select>")
                    for(var i=0; i<result.rows.length;i++){
                        if(i<0){
                            powderSelect.append('<option disabled>Select powder</option>')
                        }
                        var powder = result.rows[i].doc
                        //console.log(powder)
                        var option = $('<option value="' + powder._id + '">'+ powder.name + " " + powder.supplier + " " + powder.psd_min  + " - " + powder.psd_max + ' µm'+'</option>')
                        powderSelect.append(option)
                    }
                    powderSelect.on('change', function(){
                            $('#musfileDiv').show(200)
                            $('#musfileDiv').on('input', function(){
                                $('#saveTest').show(200)
                            })
                    })

                    $('#sampleDiv').append(powderSelect)

                    return result.rows
                }


            }).catch(function(err){
                    console.log(err)

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

            test.created = moment().format("HH:mm:ss DD/MM/YYYY");
            test.type = form.find('select[name="test_type"]').val();

            test.tools = {
                "top": {},
                "middle": {},
                "bottom": {}
            }
            test.musfile.file = data

            switch(test.type){
                case "Axi":
                    test.hardness = {}
                    test.sample.type = "Solid"
                    test.sample.name.user_defined = form.find('input[name="sample_name"]').val();
                break;
                case "Powder":
                    test.sample.type = "Powder"
                    test.sample.id = $('#powderSelect').val()
                    console.log($('#powderSelect'))
                    test.sample.name.user_defined = $('#powderSelect').find(':selected').text()
                break;
                case "PSC":
                    test.hardness = {}
                    test.sample.type = "Solid"
                    test.sample.name.user_defined = form.find('input[name="sample_name"]').val();
                break;
                default:
                    test.sample.type = "Solid"
                    test.sample.name.user_defined = form.find('input[name="sample_name"]').val();
                break;


            }


            test_db.put( test )
                .then(function(result){
                    console.log(result)
                    label
                        .removeClass("alert-danger")
                        .addClass("alert-success")
                        .html("Saved test: <b> " + test._id + "</b>")
                        .fadeToggle(200)
                        .delay(2000)
                        .fadeToggle(200)

                    }).then(function(){
                        getAllTests();
                    }).catch(function(err){
                        console.log(err)
                        switch(err.status){
                        case 409:
                            var error_text = "You have already uploaded this test. Try another file."
                            break;
                        default:
                            var error_text = "Error: " + err.message
                        }

                        label
                            .removeClass("alert-success")
                            .addClass("alert-danger")
                            .html(error_text)
                            .fadeToggle(200)
                            .delay(3000)
                            .fadeToggle(200);
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

           var segment_pos = parseInt(segment["Position"].split(';')[0])
           //console.log(segment)
           var previous_segment = testData.segments[ i-7 ]
           if(segment_pos == 6 && previous_segment){
              //console.log(previous_segment)
               if(previous_segment["Start temperature"] == previous_segment["End temperature"] ){
                       var temperature = previous_segment["End temperature"].split(' ')[0]
                       //console.log(previous_segment["End temperature"].split(' ')[0])
                        testData.temperature = +temperature;
                   }
               }
               else{
                   testData.temperature = 20.0
               }
       }

       var mus_params = sections[3].split("\n").splice(0)
       testData.mus_params = {}
       var corrected = parseFloat(mus_params[1].split('=')[1])
       var stiffness = mus_params[2].split('=')[1].split("\t")
       //console.log(corrected, stiffness)
       if( corrected < 0 ){ // Test data is already compliance corrected by TMC control system
           testData.mus_params.corrected = { "tmc": true, "user": false }
           testData.mus_params.stiffness = { "value": parseFloat(stiffness[1]), "units": stiffness[2]}
       }
       else{
           testData.mus_params.corrected = false
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
       var datetime = rows[1].split('\t')[0] ;
       try {
           //console.log("Trying to parse date")
           datetime = moment(datetime, ['DD MMM YYYY HH:mm:ss','DD-MM-YYYY HH:mm']);
           //console.log("Date parsed successfully")

       }
       catch(err){
           console.log(err)
       }

       testData.testdate = datetime.format("HH:mm:ss DD/MM/YYYY")

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








function initDeformMatrix(){
    $('#matrix').html('')
    $('#materialMatrix').show(200);
    material_chart = new CanvasJS.Chart("matrix",
        {
          title:{
           text: "Material data"
          },
          width: 500,
          height: 500,
          axisX: {
              title: "Strain rate (/s)",
              logarithmic:  true,
              crosshair: {
			               enabled: true
		                     }
          },
          axisY: {
              title : "Temperature (ºC)",
              crosshair: {
			               enabled: true
		      }
          },
          toolTip:{
               content:"Test: {name}" ,
             },
          data: [
          {
            type: "bubble",
            dataPoints: []
       }
       ]
     });

    material_chart.render();

}


function appendToMatrix(id, sample, strainrate, temperature, analysed, yieldStress, ucs){

    if(analysed == "true"){
        var color = '#46f279';
    }
    else{
        var color = '#e11';
    }

    var yieldStress = yieldStress + " MPa" || "N/A"
    var ucs = ucs + " MPa" || "N/A"


    var data = {
        x : parseFloat(strainrate),
        y : parseFloat(temperature),
        z : 100,
        name : id,
        markerColor : color,
        markerType : 'square',
        indexLabel : yieldStress,
        indexLabelPlacement : "inside",
        indexLabelWrap : true,
        indexLabelFontSize: 14
    }
    console.log(data)
    material_chart.data[0].dataPoints.push(data)

    material_chart.render();
}



function getMaterialData(){
    var tests = material_chart.data[0].dataPoints.map(function(d){
        return d.name
    })
    console.log(tests)
    unique_strainrates = []
    unique_temperatures = []
    unique_strains = $('#strain_points').val().split('\n');

    for(var i=0; i<tests.length; i++){
        test_db.get(tests[i]
        ).then(function(result){
            if(!unique_strainrates.find(result.strainrate)){
                unique_strainrates.push(result)
            }
            if(!unique_temperatures.find(result.temperatures)){
                unique_temperatures.push(result)
            }
            materialData.push(interpolateFlowStress(result))


        }).catch(function(err){
            console.log(err)
        })
    }



}


function generateMaterialData( strains, strainrates, temperatures, flowStressData){



}



function interpolateFlowStress(test){
    console.log("Interpolating data for test: " + test._id)

    var strains = []
    var stresses = []
    for(var i=0; i<test.measurements.length; i++){
        var dataPoint = test.measurements[i]
        if(dataPoint.strain > 0.0 && dataPoint.fricStress > 0.0){
            strains.push( parseFloat(dataPoint.strain) )
            stresses.push( parseFloat(dataPoint.fricStress) )
            }
        }

    //console.log("Stress strain data to interpolate" )

    // Linear interpolation setup occurs here

    //console.log("Strains = " + strains)
    //console.log("Stresses = " + stresses)

    //Interpolation using Everpolate.js
    var flowstress = evaluateLinear(unique_strains, strains, stresses)

    // Save interpolated data to an object
    var interpolatedData = {
            "strainrate" : test.strainrate,
            "temperature" : test.temperature,
            "flowstress" : flowstress

    }
    console.log(interpolatedData)
    return interpolatedData
}


function makeDEFORMFlowStress(){



}










// Modified from Everpolate.js / linear.js - https://github.com/BorisChumichev/everpolate
function evaluateLinear (pointsToEvaluate, functionValuesX, functionValuesY) {
        //console.log(pointsToEvaluate)
        //console.log(functionValuesX)
        //console.log(functionValuesY)
      var results = []
      pointsToEvaluate.forEach(function (point) {
        var index = findIntervalLeftBorderIndex(point, functionValuesX)
        if (index == functionValuesX.length - 1)
          index--
        results.push(linearInterpolation(point, functionValuesX[index], functionValuesY[index]
          , functionValuesX[index + 1], functionValuesY[index + 1]))
      })
      return results
}

// Modified from Everpolate.js / linear.js  - https://github.com/BorisChumichev/everpolate
function linearInterpolation (x, x0, y0, x1, y1) {
      var a = (y1 - y0) / (x1 - x0)
      var b = -a * x0 + y0
      return a * x + b
}

// Modified from Everpolate.js / help.js - https://github.com/BorisChumichev/everpolate
function findIntervalLeftBorderIndex(point, intervals) {
      //If point is beyond given intervals
      if (point < intervals[0])
        return 0
      if (point > intervals[intervals.length - 1])
        return intervals.length - 1
      //If point is inside interval
      //Start searching on a full range of intervals
      var indexOfNumberToCompare
        , leftBorderIndex = 0
        , rightBorderIndex = intervals.length - 1
      //Reduce searching range till it find an interval point belongs to using binary search
      while (rightBorderIndex - leftBorderIndex !== 1) {
        indexOfNumberToCompare = leftBorderIndex + Math.floor((rightBorderIndex - leftBorderIndex)/2)
        point >= intervals[indexOfNumberToCompare]
          ? leftBorderIndex = indexOfNumberToCompare
          : rightBorderIndex = indexOfNumberToCompare
      }
      return leftBorderIndex
}



/*
function makeDEFORMFlowStress(num_strain){

    var header = "# DEFORM Function data output
#
# Function Data (Y): Flow Stress
# Axis 1       (X1): Strain
# Axis 2       (X2): Strain Rate
# Axis 3       (X3): Temperature
#
# File Format :
#
# 0(Reserved)          0(Reserved)          3(Function dimension)
# No. of X1 values,    No. of X2 values,    No. of X3 values
# X1_1  ,...,  X1_n
# X2_1  ,...,  X2_n
# X3_1  ,...,  X3_n
# Y(1,1,1)  Y(2,1,1)  ...  Y(l,1,1)
# Y(1,2,1)  Y(2,2,1)  ...  Y(l,2,1)
# ...       ...       ...  ...
# Y(1,m,1)  Y(2,m,1)  ...  Y(l,m,1)
#
# Y(1,1,2)  Y(2,1,2)  ...  Y(l,1,2)
# Y(1,2,2)  Y(2,2,2)  ...  Y(l,2,2)
# ...       ...       ...  ...
# Y(1,m,2)  Y(2,m,2)  ...  Y(l,m,2)
#
# ...
#
# Y(1,1,n)  Y(2,1,n)  ...  Y(l,1,n)
# Y(1,2,n)  Y(2,2,n)  ...  Y(l,2,n)
# ...       ...      ...  ...
# Y(1,m,n)  Y(2,m,n)  ...  Y(l,m,n)
#
#
# There cannot be any comments after this line"








}
*/
