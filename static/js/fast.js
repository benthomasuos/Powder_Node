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
var sync_status = $("#sync_status")
var powder_name = $("#powder_name")
var powder_samples = $("#powder_samples")
var pressure = $("#pressure")
var load = $("#load")
var mould_diameter = $("#mould_diameter")


//setup the in-memory database to save the uploaded flow stress data and saved fitted parameters


var fast_db_local = new PouchDB('fast')
fast_db_local.info().then(function (info) {
  console.log(info);
})

var fast_db_remote = new PouchDB('http://143.167.48.53:5984/fast')
fast_db_remote.info().then(function (info) {
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
    fast_db_local.sync(fast_db_remote).on('complete', function () {

            sync_status.html("Sync with remote database<br>Success @ " + time)
            sync_status.css("background-color", "#3d4")
          console.log("Database sync between local and remote Success @ " + time)
        }).on('error', function (err) {

            sync_status.html("Database sync between local and remote<br>Failed @ " + time)
            sync_status.css("background-color", "#d34")
          console.log("Database sync between local and remote Failed @ " + time)
        });


        $("#mould_diameter").on('input', function(){
            calculatePressure()
        })
        $("#load").on('input', function(){
            calculatePressure()
        })



        getAllTests()


    /*initialiseSearch()




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

*/
    addNewTest_btn.on('click', function(){
        newTestForm()
    })




})


function calculatePressure(){
    var area =  Math.PI * ( mould_diameter.val() / 2 ) ** 2
    var stress = (load.val() * 1000 / area)
    pressure.val(stress.toFixed(1))

}


function initialiseSearch(){
    samples.find('option').remove();
    fast_db_local.allDocs({
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
    powder_samples.find('option:selected').removeAttr("selected");
    var allTests = [];
    tableBody.html("");

    //  Query the fast_db_local database
    fast_db_local.allDocs({
                include_docs : true
            })
            .then(function(result){
                console.log(result.rows)
                if(result.rows.length > 0){
                    $('#num_tests').find('span').html(result.rows.length)
                    $('#test_status').hide()
                    return result
                    }
                    else{
                        $('#test_status').show()
                    }
                }).then(function(result){
                    console.log(result)
                        for(i=0; i<result.rows.length; i++){
                            var doc = result.rows[i].doc
                        var powder = powders_db_local.get( doc.powder_id )
                                var powder_cell = $('<td></td>')
                                console.log("Powder = " + JSON.stringify(powder))
                                var test_id = doc._id
                                var row = $('<tr></tr>')
                                row.attr("name", test_id)
                                console.log(doc.powder_id)
                                //var id_cell = row.append( $('<td></td>').html(test_id) )
                                powder_cell.html(powder.name)
                                row.append( powder_cell )
                                var mould_cell = row.append( $('<td></td>').html(doc.mould_diameter) )
                                var load_cell = row.append( $('<td></td>').html(doc.load) )
                                var temp_ramp_cell = row.append( $('<td></td>').html(doc.temperature_ramp_rate) )
                                var hold_temp_cell = row.append( $('<td></td>').html(doc.hold_temperature) )
                                var hold_time_cell = row.append( $('<td></td>').html(doc.hold_time) )
                                var cooling_rate_cell = row.append( $('<td></td>').html(doc.cooling_rate) )
                                var datafile_cell = row.append( $('<td></td>').html(doc.data_file) )
                                var testdate_cell = row.append( $('<td></td>').html(doc.created) )




                                //var analyse_cell =  $('<td></td>')
                                //analyse_cell.html("<a href='/tests/fast/process?_id="+test_id+"'><i class='fa fa-table fa-2x'></i></a>")
                                //row.append( analyse_cell )
                                var edit_cell =  row.append($('<td></td>').html("<a href='/tests/fast/edit?_id="+test_id+"'><i class='fa fa-edit fa-2x'></i></a>"))

                                /*
                                if(doc.analysed == true){
                                    analyse_cell.find('i').css('color', 'green')
                                }
                                else(
                                    analyse_cell.find('i').css('color', 'red')
                                )
                                */

                                var trash_cell = row.append( $('<td></td>').html("<i class='fa fa-trash fa-2x'></i>") )
                                tableBody.append(row)

                        }
                    }).then(function(){

                        currentTestTable.DataTable()



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
                                $('#compareTests').html("<a href='/tests/fast/compare?"+ testString +"'><div class='btn btn-md btn-primary'>Compare tests</div>")

                                //console.log("Tests to compare: " + tests_to_compare);
                            }
                            else{
                                $('#compareTests').html("")
                                console.log("Need two or more tests to compare" );
                            }
                        })




                            //initialiseSearch()

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

    fast_db_local.find(
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
    $('#newTestForm').show(500);

    var allPowders = []

    powders_db_local.allDocs({include_docs: true})
        .then(function(result){
            console.log(result)
            if(result.rows.length > 0){
                for(i=0; i<result.rows.length; i++){
                    var powder = result.rows[i].doc;
                    var option = $("<option></option>")
                    option.val(powder._id)
                    option.html(powder.name + " " + powder.morphology+ " " + powder.psd_min + "-" +powder.psd_max + "µm" + " "+powder.supplier  )
                    powder_name.append(option)
                    console.log(powder.name)
            }
        }

        }).catch(function(err){
            console.log(err)


        })


    var fileupload = $('input[name="data_file"]')
    fileupload.on("load", function(){
        console.log(reader.result)
    })

}






function saveTest(){
    $('#saveTest').addClass("btn-default")
    $('#saveTest').attr('disabled', true).find('i').addClass("fa-spinner fa-spin")
    var form = $('#testForm');
    var test = {}
    var label = form.find("#alert")
    var data_file = form.find('input[name="data_file"]')[0].files[0];
    console.log(data_file)
    if(data_file){
        var reader = new FileReader();
        reader.readAsText(data_file);
        var data = "";
        reader.onloadend = function(event){
            data = event.target.result
            console.log(typeof(data))
            test.testData = parseDatafile(data);

            test.created = new Date();
            test.modified = new Date();

            test.machine = form.find('#machine option:selected').val();
            var powder_id = form.find('#powder_name option:selected').val();
            console.log(powder_id)
            test.mould_diameter = $('input[name="mould_diameter"]').val();
            test.load = $('input[name="load"]').val();
            test.temperature_ramp_rate = $('input[name="temperature_ramp_rate"]').val();
            test.cooling_rate = $('input[name="cooling_rate"]').val();
            test.hold_temperature = $('input[name="hold_temperature"]').val();
            test.hold_time = $('input[name="hold_time"]').val();



            test.powder_id = powder_id
            var file = {}
            file.name = data_file.name
            file.file = data
            test.data_file = file
            test.raw_num_samples = test.testData.length


            console.log(test)

            test._id = 'fast_' + new Date().getTime().toString()


            fast_db_local.put( test )
                .then(function(result){
                    console.log(result)
                    label
                        .removeClass("alert-danger")
                        .addClass("alert-success")
                        .html("Saved test: <b> " + test._id + "</b>")
                        .show(200)
                        .delay(2000)
                        .hide(200)

                        $('#saveTest').removeClass("btn-default")
                        $('#saveTest').attr('disabled', false).find('i').removeClass("fa-spinner fa-spin")
                        getAllTests();
                    })
                    .catch(function(err){
                        console.log(err)
                        label
                            .removeClass("alert-success")
                            .addClass("alert-danger")
                            .html("Error: "+ err)
                            .show(200)
                            .delay(2000)
                            .hide(200);
                            $('#saveTest').removeClass("btn-default")
                            $('#saveTest').attr('disabled', false).find('i').removeClass("fa-spinner fa-spin")
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
            $('#saveTest').removeClass("btn-default")
            $('#saveTest').attr('disabled', false).find('i').removeClass("fa-spinner fa-spin")
    }

}





function removeTest(test_id){
    fast_db_local.get( test_id )
            .then(function(doc){
                return fast_db_local.remove( doc );
            }).then(function(result){
                console.log("Test removed: " + result)
                getAllTests();
            }).catch(function(err){
                console.log(err)
            })
}



function parseDatafile(data){
     var testData = ""
     var testData = data.split('\r\n')
     var headerLine = testData[0]
     var headers = headerLine.split(',')

     for(i=0;i< headers.length;i++){
          var name = headers[i].toString()
          headers[i] = name.replace(/\s/g, "")
                              .replace(/\./g, "")
                              .toLowerCase()
                              .toString()
        console.log(headers[i])
    }
    var headerLine = headers.join(",")
    console.log(headerLine)
    testData[0] = headerLine

    data = testData.join('\r\n')



     Papa.parse( data ,  {
                  complete: function(results) {
                            console.log("File parsed successfully");
                            testData = results.data.splice(1);
                        },
                   error: function(err, file){
                           console.log(err, file);
                       },
                   header: true,
                   skipEmptyLines: true,
                   dynamicTyping: true
               } ); // end of Papa.parse()
                console.log(testData)
                testData = testData.slice(0)
   return testData
}
