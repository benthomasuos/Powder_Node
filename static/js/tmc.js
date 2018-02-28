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
var tests_ids_compare = []
var data_to_compare = []
var interpolatedData = []
var chart = "";

var dataMatrix = []
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
                    //populateSearch(result.rows)
                        }
                        else{
                            $('#test_status').show()
                        }

            }).catch(
                    console.log("Couldn't retrieve data from the database")
            )

}



function populateSearch(tests){
    let samples = []
    let temperatures = []
    let strainrates = []
    let test_types = []
    let operator = []

    for(i=0; i<tests.length; i++){
            var doc = tests[i].doc;
            if(!doc.language){  // Don't include any index documents
                //console.log(doc);
                if(doc.sample.name.user_defined){
                    samples.push(doc.sample.name.user_defined)
                }
                else{
                    samples.push(doc.sample.name.musfile_defined)
                }
                temperatures.push(parseFloat(doc.temperature))
                strainrates.push(parseFloat(doc.strainrate))
                test_types.push(doc.type)
                operator.push(doc.operator)


            //    var option = $("<option></option>");
                //option
                //    .html(doc.sample.name.user_defined)
                //    .val(doc.sample.name.user_defined)
                //samples.append(option)
            }

        }
        samples = uniqueValues(samples)
        temperatures = uniqueValues(temperatures)
        strainrates = uniqueValues(strainrates)
        test_types = uniqueValues(test_types)
        operator = uniqueValues(operator)


        console.log(samples)
        console.log(temperatures)
        console.log(strainrates)
        console.log(test_types)
        console.log(operator)

        samples.forEach(function(d, i){
            var option = $("<option></option>");
                option
                    .html(d)
                    .val(d)
                $('#samples').append(option)
        })


}

function uniqueValues(SOURCE){
    let result = [];

    for (let index = 0; index < SOURCE.length; index++) {
          let el = SOURCE[index];
          if (result.indexOf(el) === -1) result.push(el);
    }
    return result
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
                                //console.log(doc)
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
                                if(doc.testNotes){
                                    var notes_cell = row.append( $('<td></td>').html( "<i class='fa fa-navicon fa-2x'><span name='notes' hidden> " + doc.testNotes + "</i>" ) )
                                }
                                else{
                                    var notes_cell = row.append( $('<td></td>').html(" ") )
                                }


                                var analyse_cell =  $('<td></td>')


                                analyse_icon = $("<a href='/tests/tmc/process?_id="+test_id+"'><i class='fa fa-edit fa-2x'></i></a>")
                                analyse_icon.css('float', 'left')




                                if(doc.analysed == true){
                                    analyse_icon.find('i').css('color', 'green')
                                    analyse_icon.attr('name' ,'analysed_true')
                                    var downloadLink = $("<a href='#'><i class='fa fa-download fa-2x'></i></a>")
                                    prepareDownload(doc, downloadLink)
                                    downloadLink.css('margin-left', '8px')
                                    analyse_cell.append( analyse_icon )
                                    analyse_cell.append( downloadLink )

                                }
                                else{
                                    analyse_icon.find('i').css('color', 'lightgray')
                                    analyse_icon.attr('name' ,'analysed_false')
                                    analyse_cell.append( analyse_icon )
                                }
                                row.append( analyse_cell )

                                var checkbox = $('<input class="form-control" type="checkbox" />').attr('name', test_id ).attr('id', test_id)
                                var compareCell = $('<td></td>').append( checkbox )
                                row.append( compareCell )
                                //var edit_cell =  row.append($('<td></td>').html("<a href='/tests/tmc/edit?_id="+test_id+"'><i class='fa fa-edit fa-2x'></i></a>"))


                                var trash_cell = row.append( $('<td></td>').html("<i class='fa fa-trash fa-2x'></i>") )
                                tableBody.append(row)
                            }

                        var datatable = currentTestTable.DataTable()
                        console.log(datatable)
                        tableEvents()
                        applyCheckboxEvent()
                        datatable.on('draw', function(){
                            console.log("State loaded")
                            tableEvents()
                            applyCheckboxEvent()
                            initialiseSearch()
                        })







                        }
                        else{
                            $('#test_status').show()

                        }



                        $('.fa-navicon').click( function(){
                            var note = $(this).find('span').html()
                            console.log(note)
                            $('#noteModal').find('p').html(note)
                            $('#noteModal').show()

                            $(window).click( function(event){
                                console.log(event)
                                if( event.target.nodeName == 'DIV' ){
                                    $('#noteModal').hide()
                                }

                            })

                        })



                        initialiseSearch()

            }).catch(
                    console.log("Couldn't retrieve data from the database")
            ) //  End of query and response to query



}




function applyCheckboxEvent(){
    $('input[type="checkbox"]').off('change')

    $('input[type="checkbox"]').on('change', function(){
        var thisCheckbox = $(this)
        tests_to_compare = []
        console.log($(this))
        var test_id = $(this).attr('id')
        var row = currentTestTable.find('tr[name="' + test_id + '"]');
        if( $(this)[0].checked ){
            tests_ids_compare.push( test_id )
            console.log("Test " + test_id + " added to compare IDs list")
            console.log("Comparing " + tests_ids_compare.length + " tests after test added to list")
            tests_ids_compare.forEach(function(test, i){
                //console.log(d, i)
                //row.css('color', '#fff')
                row.css('background-color', 'rgba(40, 190, 255, 0.2)')
                test_db.get(
                    test
                ).then(function(result){
                        //console.log(result)
                                data_to_compare.push( result );
                                if(tests_ids_compare.length == 2){
                                    initDeformMatrix()
                                }
                                else if(tests_ids_compare.length < 2){
                                    console.log("Need two or more tests to compare" );
                                    if(material_chart){
                                        material_chart.destroy()
                                        material_chart = null
                                    }
                                    //$('#materialMatrix').hide();
                                }
                                if( tests_ids_compare.length >= 2 ){
                                    //console.log(tests_ids_compare.length)
                                    //console.log(tests_to_compare.length)

                                    appendToMatrix(result, thisCheckbox)

                                    material_chart.render()
                                    console.log("Length = " + tests_ids_compare.length)

                                }
                                else{
                                    console.log("Need two or more tests to compare" );
                                }


                        })
                        .catch(function(err){
                            console.log(err)
                        })

            }) // end of forEach loop

        } // end of IF statement
        else{
            var id_index = tests_ids_compare.indexOf(test_id);
            if ( id_index > -1) {
                tests_ids_compare.splice(id_index, 1);
                console.log("Test " + test_id + " removed from compare IDs list")
                console.log("Comparing " + tests_ids_compare.length + " tests after test is removed")
            }
                row.css('background-color', '#fff')
            }
    })



}

function exportTests(){
    const exportDataString = ""
    const exportFileName = "exported_tests.json"
    var testToExport =  currentTestTable.find('input[type="checkbox"]')
    console.log(currentTestTable.DataTable().rows())

}

function importTests(){


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

                            tableEvents()



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


function tableEvents(){

    tableBody.find("i.fa-trash").on('click', function(){
        var test_id = $(this).closest('tr').attr('name');
        console.log("Deleting test " + test_id)
        var response = confirm("Are you sure you want to delete test: "+ test_id)
        if( response == true){
            removeTest(test_id);
        }
    })

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






function saveMultipleTests(files){


}



function saveTest(){
    var form = $('#testForm');
    var test = {}
    var label = form.find("#alert")
    var musfiles = form.find('input[name="musfile"]')[0].files;
    var num_files = form.find('input[name="musfile"]')[0].files.length

    if(musfiles){
        for(var i=0; i< musfiles.length; i++){
            label.stop()
                    var reader = new FileReader();
                    reader.readAsText(musfiles[i]);
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
                                //console.log(result)

                                label
                                    .removeClass("alert-danger")
                                    .addClass("alert-success")
                                    .html("Saved test: <b> " + result.id + "</b>")
                                    .fadeIn(200)

                                }).catch(function(err){
                                    console.log(err)
                                    switch(err.status){
                                    case 409:
                                        var error_text = "You have already uploaded a data file for test " + err.id + ". Try another file."
                                        break;
                                    default:
                                        var error_text = "Error: " + err.message
                                    }
                                    label
                                        .removeClass("alert-success")
                                        .addClass("alert-danger")
                                        .html(error_text)
                                        .fadeIn(200)

                                })

                    }
                }

            console.log(musfiles.length, i)
            if( i == musfiles.length - 1 ){

                label.fadeOut(200)
                getAllTests()
                label.hide()


            }
                }
                else{
                    label
                        .removeClass("alert-success")
                        .addClass("alert-danger")
                        .html("No Musfile(s) to upload")
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





function prepareDownload(test, downloadBtn){
    //console.log("Preparing download for test " + test._id + ". Please wait...")
    let data = []

    data[0] = "Displacement (mm), Corrected Stroke (mm), Corrected Load (kN), Temperature (ºC) True Strain (mm), True Stress (MPa), True Friction Corrected Stress (MPa), True Isothermal Stress (MPa)\r\n"

    for(var i=0; i<test.measurements.length; i++){
        var point = test.measurements[i]
            data.push(point.disp_corr + "," + point.stroke_corr + "," + point.load_corr + ","+ point.sample_temp_2_centre + "," + point.strain + "," + point.trueStress + "," + point.fricStress + "," + point.isoStress + "\r\n")
    }

    data.join()

    var blob = new Blob(data, {type: "text/.txt"});

    var url = URL.createObjectURL(blob);

    downloadBtn.attr('href', url )
    downloadBtn.attr('download', test._id + "_analysed_data.txt" )

    //console.log("Download is ready for test " + test._id)
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
       //testData.temperature = 20.0
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
                       console.log(previous_segment["End temperature"].split(' ')[0])
                        testData.temperature = +temperature;
                   }
                   else{
                       console.log("Using default temperature of 20ºC")
                       testData.temperature = 20.0
                   }

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
       sample.name.musfile_defined

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

       sample.name.musfile_defined = test[0].split('\t')[1]

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




function checkDEFORMTests(numTests){

    var totalUniqueTests = parseFloat(unique_strainrates.length) * parseFloat(unique_temperatures.length);
    console.log("Test check", totalUniqueTests, numTests)
    if (numTests == totalUniqueTests){
        return true;
    }
    else {
        return false;
    }
}



function initDeformMatrix(){
    initStressGraphs()
    console.log("Initialising DEFORM matrix");
    $('#matrix').html('');
    $('#materialMatrix').show();
    material_chart = new CanvasJS.Chart( "matrix",
        {
          title:{
           text: "Material data",
           fontColor: "#000",
           fontfamily: "Arial",
           fontSize: 20,
           padding: 8
          },
          axisX: {
              title: "Strain rate (/s)",
              logarithmic:  true,
              crosshair: {
			               enabled: true
                       },
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
          axisY: {
              title : "Temperature (ºC)",
              crosshair: {
			               enabled: true
		      },
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


function appendToMatrix(test, checkbox){
    var color = '#46f279';
    if(test.analysed == true){
        color = '#46f279';

        if(test.sample.name.user_defined) {
            material_chart.options.title.text = test.sample.name.user_defined
        }
        else{
            material_chart.options.title.text =  test.sample.name.musfile_defined
        }

        var data = {
            x : parseFloat(test.strainrate),
            y : parseFloat(test.temperature),
            z : 100,
            name : test._id + " : " + test.temperature + "ºC  " + test.strainrate + " s-1" ,
            markerColor : color,
            markerType : 'square',
            indexLabel : test.yield_strength_02_mpa + " MPa",
            indexLabelPlacement : "inside",
            indexLabelWrap : true,
            indexLabelFontSize: 14
        }

        material_chart.data[0].dataPoints.push(data)
        //console.log(data)




    }
    else{
        console.log(checkbox)
        checkbox.attr('checked', false)
        //alert("Test analysis hasn't been completed so data cannot be added to the DEFORM flow stress matrix. Please analyse the test fully")
        console.log("Test analysis hasn't been completed so data cannot be added to the DEFORM flow stress matrix. Please analyse the test fully")
    }




}



function getMaterialData(){
    //console.log(tests)
    initStressGraphs()
    var all_strainrates = []
    var all_temperatures = []
    unique_strains = $('#strain_points').val().split('\n');
    interpolatedData = []

    data_to_compare.forEach(function(d, i){
        all_strainrates.push (parseFloat(d.strainrate) )
        all_temperatures.push( parseFloat(d.temperature) )
    })

    unique_strainrates = uniqueValues(all_strainrates)
    unique_temperatures = uniqueValues(all_temperatures)
    console.log( unique_strainrates )
    console.log( unique_temperatures )

    unique_strainrates.sort(function(a, b){return a - b});
    unique_temperatures.sort(function(a, b){return a - b});
    console.log( unique_strainrates )
    console.log( unique_temperatures )


    dataMatrix = []

    for(var i=0; i < unique_strainrates.length; i++){

        for(var j=0; j < unique_temperatures.length; j++){
            dataMatrix.push( { strainrate :  unique_strainrates[i],
                                 temperature : unique_temperatures[j],
                                 flowstress : []
             })

        }
    }
    //console.log(dataMatrix)


        test_db.allDocs({
             keys: tests_ids_compare,
             include_docs: true
        }).then(function(result){
            console.log(result)
            if(result.rows.length > 0){
                result.rows.forEach(function(test, i){
                    if(test.doc.analysed){
                        var actualFlowStress = test.doc.measurements.map(function( d, i ){
                            if( d.strain != null && d.strain < 2.0 ){
                                //console.log(d.strain, d.fricStress)
                                return { x : d.strain, y : d.fricStress }
                            }
                            else{
                                return { x : 0.0, y : d.fricStress }
                            }
                        })
                        //console.log("Plotting actual flow stress for test " + test.id)
                        //console.log("Actual flow stress" , actualFlowStress)
                        plotDEFORMFlowStress(actualFlowStress, test.doc.temperature + " " + test.doc.strainrate)
                        dataMatrix.forEach(function(d, index){
                            //console.log(dataMatrix[index])
                            if( d.temperature == test.doc.temperature && d.strainrate == test.doc.strainrate ){
                                var data = interpolateFlowStress(test.doc)
                                dataMatrix[index].flowstress = data
                                var plotData = data.map(function(d,i){
                                    //console.log(parseFloat(unique_strains[i]) , d)
                                    return { x : parseFloat(unique_strains[i]) , y : d }
                                })
                                //console.log("Plotting interpolated data", plotData)
                                plotDEFORMFlowStress( plotData, test.doc.temperature + " " + test.doc.strainrate + " DEFORM")
                            }
                        })
                    }
                    else{
                        console.log("Test " + test.doc._id + " has not been analysed fully and will be skipped during the flow stress interpolation" )
                    }
                    //console.log(dataMatrix)
                })


            }

        }).then(function(){

            if( checkDEFORMTests( tests_ids_compare.length ) ){
                console.log(tests_ids_compare.length + " tests sent for interpolation.")
                console.log("All data successfully interpolated at strain values of: " + unique_strains)
                console.log("Unique strainrates : "  + unique_strainrates )
                console.log("Unique temperatures : "  + unique_temperatures )
                console.log("Interpolated data : " , dataMatrix )

                makeDEFORMFlowStress( dataMatrix )

            }
            else{
                console.log("Not enough unique tests to cover the whole test matrix. A valid DEFORM flow stress model cannot be created.")
                makeDEFORMFlowStress( dataMatrix )

            }


        }).catch(function(err){
            console.log(err)
        })




}




function interpolateFlowStress(test){
    console.log("Interpolating data for test: " + test._id)

    //Interpolation using Everpolate.js
    var flowstress = evaluateLinear(unique_strains, test)

    return flowstress
}


function plotDEFORMFlowStress(data, name){
    //console.log(data)
    chart.options.data.push({
        dataPoints: data,
        connectNullData: false,
        type: "line",
        showInLegend: true,
        name: name,
        toolTipContent: "Strain: {x}, FricCorrStress: {y} MPa",
    })
    console.log(chart)
    chart.render()

}


function prepFlowStressDownload(dataString, downloadBtn){
    console.log("Preparing download for material. Please wait...")
    downloadBtn.attr('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(dataString) )
    downloadBtn.attr('download', "flowStress.txt" )
    console.log(downloadBtn)
    console.log("Download is ready.")
    downloadBtn.show()
    downloadBtn.find('div').css("box-shadow", "#3f3 0px 0px 4px 4px").delay(2000)
                    .queue(function(n) {
                           $(this).css("box-shadow", "none");
                           n();
                       })
}



function initStressGraphs(){

        //console.log('Plotting load displacement graph');
         chart = new CanvasJS.Chart("chartCompare",
        {
            animationEnabled: false,
            zoomEnabled: true,
            zoomType: "xy",
            exportEnabled: true,
            exportFileName: "Stress - Strain comparison",
            toolTip: {
                    enabled: true,
                    shared: true
            },
            title: {
                text: "Test comparison",
                fontColor: "#000",
                fontfamily: "Arial",
                fontSize: 20,
                padding: 8
            },
            legend: { fontSize: 14,
                       horizontalAlign: "right", // left, center ,right
                       verticalAlign: "center",  // top, center, bottom
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
                title: "True strain (mm/mm)",
                fontColor: "#000",
                fontfamily: "Arial",
                titleFontSize: 20,
                labelFontSize: 12,
                lineColor: "#000",
                tickColor: "#000",
                labelFontColor: "#000",
                titleFontColor: "#000",
                lineThickness: 0
        },
        axisY:
           {
             title: "True Fric Corrected Stress (MPa)",
             fontfamily: "Arial",
             titleFontSize: 20,
             labelFontSize: 12,
             lineColor: "#000",
             tickColor: "#000",
             labelFontColor: "#000",
             titleFontColor: "#000",
             lineThickness: 0
         },
         data : []
        });

        chart.render();



}




// Modified from Everpolate.js / linear.js - https://github.com/BorisChumichev/everpolate
function evaluateLinear (points, test) {

    var pointsToEvaluate = points

      var functionValuesX = []
      var functionValuesY = []

      console.log(test.measurements)
      test.measurements.map(function(d, i){
          //console.log("Evaluate linear result: "+ d.strain, d.fricStress)
          functionValuesX.push( d.strain )
          functionValuesY.push( d.fricStress )
      })


      console.log(functionValuesX, functionValuesY)


      var results = []
      pointsToEvaluate.forEach(function (point, i) {
          console.log(point)
          if ( i != 0 && i < pointsToEvaluate.length - 1 ){ // miss out first and last strain points
                var index = findIntervalLeftBorderIndex(point, functionValuesX)
                if (index == functionValuesX.length - 1)
                  index--
                  console.log(point, functionValuesX[index], functionValuesY[index]
                    , functionValuesX[index + 1], functionValuesY[index + 1] )
                results.push(linearInterpolation(point, functionValuesX[index], functionValuesY[index]
                  , functionValuesX[index + 1], functionValuesY[index + 1]))
              }
      })
      console.log(results)
      //extrapolate from the second and third data points to find the stress at zero strain
      var zero_value = linearInterpolation(0.0, parseFloat( pointsToEvaluate[1]), results[0], parseFloat(pointsToEvaluate[2]), results[1])
      results.unshift(zero_value)
      var dataLength = pointsToEvaluate.length

      // Extrapolate from the last and last-but-one data points to find the stress at the final strain point.
      // This final strain value should be beyond the range of the measured data (ie 2.0-5.0)
      var final_value = linearInterpolation(pointsToEvaluate[dataLength - 1] , parseFloat( pointsToEvaluate[dataLength - 3 ]), results[results.length - 2 ], parseFloat(pointsToEvaluate[dataLength - 2 ]), results[results.length - 1 ])
      results.push(final_value)
      console.log(results)
      return results
}

// Modified from Everpolate.js / linear.js  - https://github.com/BorisChumichev/everpolate
function linearInterpolation (x, x0, y0, x1, y1) {
      //console.log(x, x0,x1,y0,y1)
      var a = (y1 - y0) / (x1 - x0)
      //console.log("Gradient = " + a)
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




function makeDEFORMFlowStress(data){

    /*
    # DEFORM Function data output
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
    #\
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
    # There cannot be any comments after this line
    */


    var dataString = "0    0   3\r\n" + unique_strains.length + "\t" + unique_strainrates.length + "\t" +unique_temperatures.length + "\r\n"
    dataString = dataString.concat("\r\n")
    unique_strains.forEach(function(d, i){
        dataString = dataString.concat( d + "\t")
    })
    dataString = dataString.concat("\r\n")

    unique_strainrates.forEach(function(d, i){
        dataString = dataString.concat( d + "\t")
    })
    dataString = dataString.concat("\r\n")

    unique_temperatures.forEach(function(d, i){
        dataString = dataString.concat( d + "\t")
    })
    dataString = dataString.concat("\r\n")

    dataMatrix.forEach(function(d, i){
        d.flowstress.forEach(function(d){
            dataString = dataString.concat( d.toFixed(2) + "\t")
            //console.log(dataString)
        })
        dataString = dataString.concat("\r\n")
    })
    dataString = dataString.concat("\r\n")

    console.log(typeof dataString)
    prepFlowStressDownload(dataString, $('#downloadFlowStress') )

    return dataString
}
