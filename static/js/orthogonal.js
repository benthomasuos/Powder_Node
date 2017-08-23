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
var ang_vel_min = $("#ang_vel_min")
var ang_vel_max = $("#ang_vel_max")
var load_min = $("#load_min")
var load_max = $("#load_max")
var powder_name = $("#powder_name")
var powder_samples = $("#powder_samples")
//setup the in-memory database to save the uploaded flow stress data and saved fitted parameters


var test_db = new PouchDB('orthogonal')
test_db.info().then(function (info) {
  console.log(info);
})




$(document).ready(function(){
    //initialiseSearch()
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
    powder_samples.find('option').remove();
    test_db.allDocs({
            include_docs : true
            })
            .then(function(result){
                if(result.rows.length > 0){
                    for(i=0; i<result.rows.length; i++){
                        var doc = result.rows[i].doc;




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
                                var row = $('<tr></tr>')
                                row.attr("name", test_id)
                                var id_cell = row.append( $('<td></td>').html(test_id) )
                                var sample_cell = $('<td></td>').html(doc.sample)
                                var load_cell = row.append( $('<td></td>').html(doc.load) )
                                var ang_vel_cell = row.append( $('<td></td>').html(doc.angular_velocity) )
                                var datapoints_cell = row.append( $('<td></td>').html(doc.raw_num_samples) )
                                var testdate_cell = row.append( $('<td></td>').html(doc.testdate ) )
                                var created_cell = row.append( $('<td></td>').html(doc.created) )
                                var analyse_cell =  $('<td></td>')
                                analyse_cell.html("<a href='/tests/orthogonal/process?_id="+test_id+"'><i class='fa fa-table fa-2x'></i></a>")
                                row.append( analyse_cell )
                                var edit_cell =  row.append($('<td></td>').html("<a href='/tests/orthogonal/edit?_id="+test_id+"'><i class='fa fa-edit fa-2x'></i></a>"))
                                var checkbox = $('<input class="form-control" type="checkbox" />').attr('name', test_id ).attr('id', test_id)
                                var compareCell = $('<td></td>').append(checkbox)
                                if(doc.analysed == true){
                                    analyse_cell.find('i').css('color', 'green')

                                }
                                else(
                                    analyse_cell.find('i').css('color', 'red')
                                )
                                row.append( compareCell )



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
                                $('#compareTests').html("<a href='/tests/aspshear/compare?"+ testString +"'><div class='btn btn-md btn-primary'>Compare tests</div>")

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
                                var sample_cell = row.append( $('<td></td>').html(doc.powder.short_name) )
                                var temp_cell = row.append( $('<td></td>').html(doc.temperature) )
                                var sr_cell = row.append( $('<td></td>').html(doc.angular_velocity) )
                                var datapoints_cell = row.append( $('<td></td>').html(doc.raw_num_samples) )
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
    $('#dataInput').show(200)

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
    //var audio_file = form.find('input[name="audio_file"]')[0].files[0];
    console.log(data_file)
    if(data_file){
        var reader_1 = new FileReader();
        reader_1.readAsText(data_file);
        var data = "";
        var audio = "";
        reader_1.onloadend = function(event){
            data = event.target.result
            console.log(typeof(data))
            test = parseDatafile(data);

            test.created = new Date();

            var sample = form.find('input[name="sample"]').val();
            var description = form.find('input[name="description"]').val();
            var cut_speed = form.find('input[name="cut_speed"]').val();
            var cut_length = form.find('input[name="cut_length"]').val();
            var cut_depth = form.find('input[name="cut_depth"]').val();
            test.sample = sample
            test.description = description
            test.cut_speed = cut_speed
            test.cut_length = cut_length
            test.cut_depth = cut_depth

            var file = {}
            file.name = data_file.name
            file.file = data
            test.data_file = file
            test.raw_num_samples = test.rawData.length


            console.log(test)

            test._id = new Date().getTime().toString()





                test_db.put( test )
                    .then(function(result){
                        console.log(test)
                        console.log(result)
                        var reader_2 = new FileReader();

                        var data = "";

                            test._id = result.id
                            test._rev = result.rev
                            test_db.put( test ).then(function(doc){
                                console.log(doc)
                            })


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



function parseDatafile(data){
      var testData = {};
      data = data.split("\n")
      var test_date = data[3]
      var sample_rate = data[4]
      var num_samples = data[12]
      console.log(num_samples)
      data.splice(0,13)
      data.splice(1,1)

      testData.testdate = test_date
      testData.sample_rate = sample_rate

      var headers = data[0].split(',')
      for(i=0;i<headers.length;i++){
           var name = headers[i]
           headers[i] = name.replace(/\s/g,"_")
                            .replace(/\0/g,"")
                            .toLowerCase()
       //console.log(headers[i])
     }
     var headerLine = headers.join(",")
     data[0] = headerLine
     var allData = data.join("\n")
     var rawData = []
     Papa.parse( allData ,  {
                  complete: function(results) {
                            console.log("File parsed successfully");
                            results.data.map(function(d , i){
                                d.time = i / sample_rate

                                //console.log(d.time)
                                return d
                            })
                            testData.rawData = results.data;
                        },
                   error: function(err, file){
                           console.log(err, file);
                       },
                   header: true,
                   skipEmptyLines: true,
                   dynamicTyping: true,
                   delimiter: ",",
                   encoding: "utf8"
               } ); // end of Papa.parse()

               //console.log(testData.measurements)



   return testData
}



function parseAudiofile(data, test){
      var audioData = {};

     Papa.parse( data ,  {
                  complete: function(results) {
                            console.log("File parsed successfully");
                            results.data.map(function(d , i){
                                d.time = d[0]
                                d.displacement = d[0] * test.cut_speed / 1000
                                d.intensity_chan1 = d[1]
                                d.intensity_chan2 = d[2]
                                //console.log(d.time)
                                return d
                            })
                            audioData = results.data;
                        },
                   error: function(err, file){
                           console.log(err, file);
                       },
                   skipEmptyLines: true,
                   dynamicTyping: true,
               } ); // end of Papa.parse()

               console.log(audioData)



   return audioData
}
