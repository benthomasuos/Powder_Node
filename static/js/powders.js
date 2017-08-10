var currentPowdersTable = $('#currentPowdersTable');
var tableBody = currentPowdersTable.find("tbody")
var addNewPowder_btn = $("#addNewPowder_btn")
var samples = $("#samples")
var temp_min = $("#temp_min")
var temp_max = $("#temp_max")
var sr_min = $("#sr_min")
var sr_max = $("#sr_max")
var newPowderForm = $("#newPowderForm")
var data_load = $("#data_load")
var sync_status = $("#sync_status")
var loading_progress = data_load.find('progress')
//setup the in-memory database to save the uploaded flow stress data and saved fitted parameters
var local_powders = 0
var remote_powders = 0

var powders_db_local = new PouchDB('powders')
powders_db_local.info().then(function (info) {
  console.log(info);
  local_powders = info.doc_count
})

var powders_db_remote = new PouchDB('http://143.167.48.53:5984/powders')
powders_db_remote.info().then(function (info) {
  console.log(info);
  remote_powders = info.doc_count
})


$(document).ready(function(){
    if(local_powders != remote_powders){
        console.log("Local and remote databases are out of sync. Please refresh page.")
    }


    var sync_time = new Date()
    var time =  sync_time.getHours() + ":" + sync_time.getMinutes() + ":" + sync_time.getSeconds() +  " "+sync_time.getDate() + "-" + sync_time.getMonth() + "-" + sync_time.getFullYear()
    powders_db_local.sync(powders_db_remote).on('complete', function () {

            sync_status.html("Sync with remote database<br>Success @ " + time)
            sync_status.css("background-color", "#3d4")
          console.log("Database sync between local and remote Success @ " + time)
        }).on('error', function (err) {

            sync_status.html("Database sync between local and remote<br>Failed @ " + time)
            sync_status.css("background-color", "#d34")
          console.log("Database sync between local and remote Failed @ " + time)
        });

    initialiseSearch()
    getAllPowders()



    addNewPowder_btn.on('click',function(){
        newPowderForm.show(200)
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
        $('#powderSearchBox').toggle(500);
    })



})


function initialiseSearch(){
    samples.html("<option>Hello</option>");
    powders_db_local.allDocs({
            include_docs : true
            })
            .then(function(result){
                if(result.rows.length > 0){
                    $('#powder_status').hide()
                    for(i=0; i<result.rows.length; i++){
                        var doc = result.rows[i].doc;
                            //console.log(doc);
                            var option = $("<option></option>");
                            option
                                .html(doc.sample)
                                .val(doc.sample)
                            samples.append(option)
                            }

                        }
                        else{
                            $('#powder_status').show()

                        }

            }).catch(
                    console.log("Couldn't retrieve data from the database")
            )


}

function getAllPowders(){
    loading_progress.val(0)
    var allTests = [];
    tableBody.html("");

    //  Query the powders_db database
    powders_db_local.allDocs({
                include_docs : true
            })
            .then(function(result){

                //console.log(result.rows)
                        if(result.rows.length > 0){

                            $('#num_powders').find('span').html(result.rows.length)


                            for(i=0; i<result.rows.length; i++){
                                loading_progress.val(  Math.ceil( i+1 / result.rows.length) * 100 )
                                var doc = result.rows[i].doc;
                                //console.log(doc)
                                var powder_id = doc._id
                                //console.log(doc)
                                var row = $('<tr></tr>')
                                row.attr("name", powder_id)
                                if(doc.name){
                                    var sample_name = doc.name
                                }else{
                                    var sample_name = 'N/A'
                                }
                                var sample_cell = row.append( $('<td></td>').html(sample_name) )
                                var type_cell = row.append( $('<td></td>').html(doc.type) )
                                var metal_cell = row.append( $('<td></td>').html(doc.base_metal) )
                                var alloy_cell = row.append( $('<td></td>').html(doc.alloy) )
                                var morph_cell = row.append( $('<td></td>').html(doc.morphology) )
                                var supplier_cell = row.append( $('<td></td>').html( doc.supplier ) )
                                var psd_min_cell = row.append( $('<td></td>').html(doc.psd_min + " µm") )
                                var psd_min_cell = row.append( $('<td></td>').html(doc.psd_max + " µm") )
                                var date = new Date(doc.created)
                                var creation_date = date.getDate() + "-" + date.getMonth() + "-" + date.getFullYear()
                                var date = new Date(doc.modified)
                                var modified_date = date.getDate() + "-" + date.getMonth() + "-" + date.getFullYear()
                                var created_cell = row.append( $('<td></td>').html(creation_date) )
                                var modified_cell = row.append( $('<td></td>').html(modified_date) )
                                var edit_cell =  row.append($('<td></td>').html("<a href='/powders/edit?_id="+powder_id+"'><i class='fa fa-edit fa-2x'></i></a>"))
                                var trash_cell = row.append( $('<td></td>').html("<i class='fa fa-trash fa-2x'></i>") )
                                tableBody.append(row)
                                }

                            currentPowdersTable.DataTable();
                            tableBody.find("i.fa-trash").on('click', function(){
                                var powder_id = $(this).closest('tr').attr('name');
                                console.log("Deleting test " + powder_id)
                                //var response = confirm("Are you sure you want to delete test: "+ test_id)
                                var response = true
                                if( response == true){
                                    removeTest(powder_id);
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



                            $('#powder_status').hide()
                            }
                            else{
                                $('#powder_status').show()

                            }

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

    powders_db_local.find(
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
                            $('#powder_status').hide()
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
                                var modified_cell = row.append( $('<td></td>').html(doc.modified) )
                                var analyse_cell =  $('<td></td>')
                                analyse_cell.html("<a href='/process?_id="+test_id+"'><i class='fa fa-table fa-2x'></i></a>")
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
                            $('#powder_status').show()

                        }

            }).catch(
                    console.log("Couldn't retrieve data from the database")
            )




}







function savePowder(){
    var form = $('#powderForm');
    var powder = {}
    var label = form.find("#alert")

    var inputs = form.find('input')

    //console.log(inputs)
    inputs.each(function(i){
        var element = inputs[i]
        var name = $(this).attr("type")
        switch(name){
            case "text" :
                var value = $(this).val()
                powder[ element.name ] = value
                break;
            case "number" :
                var value = $(this).val()
                powder[ element.name ] = value
                break;
            case "file" :
                var value = null
                break;
            default:
                var value = $(this).val()
                powder[ element.name ] = value
                break;
            }


    })
        powder.morphology = $("#morphology").val()
        powder.type = $("#type").val()

        //console.log(powder)
        powder._id =  "powder_" + new Date().getTime()

        powder.created = new Date();
        powder.modified = new Date();

        powders_db_local.put( powder )
            .then(function(result){
                    label
                        .removeClass("alert-danger")
                        .addClass("alert-success")
                        .html("Saved test with id: " + powder._id)
                        .show(200)
                        .delay(2000)
                        .hide(200)
                        getAllPowders();
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





function removeTest(test_id){
    powders_db_local.get( test_id )
            .then(function(doc){
                return powders_db_local.remove( doc );
            }).then(function(result){
                console.log("Test removed: " + result)
                getAllPowders();
            }).catch(function(err){
                console.log(err)
            })
}



function parsePSDfile(data){
    console.log("Parsing PSD data")
    console.log(data)

}
