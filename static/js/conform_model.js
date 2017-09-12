var chart_pow_compact = ""
var chart_flow_stress = ""


var powders_db = new PouchDB('powders')
powders_db.info().then(function (info) {
  console.log(info);
})


$(document).ready(function(){
    initialiseGraphs()

    $('span.input-group-addon').on('click', function(){
        var tooltip = $(this).parent().find('div.tooltip')
        console.log(tooltip)
        tooltip.show()
        $(this).css('background-color', 'red')
        tooltip.html('Hi')
        tooltip.css('height', '100px')
        tooltip.css('width', '100px')
    })


    $('#pow_compact_A').on('change', function(){
        calculatePowderCompactionCurve()
    })

    $('#load_powder').on('click', function(){
        loadPowders()

    })


})


function loadPowders(){
    powders_db.allDocs({
                include_docs : true
            })
            .then(function(result){
                powders = result.rows
                console.log(powders)
                $('#load_powder').hide()
                var powder_select = $('<select class="form-control"></select>')
                $('#load_powder').parent().removeClass('input-group-btn').addClass('input-group-addon')
                $('#bulk_density').after(powder_select)
                for(var i=0; i<powders.length; i++ ){
                    var thisPowder = powders[i].doc
                    console.log(thisPowder)
                    if( thisPowder.density){
                        var density = thisPowder.density.bulk
                        powder_select.append('<option val="' + density + '">' + thisPowder.name + ' | ' + density + '</option>')
                    }
                }
                powder_select.on('change',function(){
                    $('#bulk_density').val() = $(this).val()
                })
            })
            .catch(function(err){
                console.log('Error fetchinglist of powders from database: ' + err)
            })

}


function calculatePowderCompactionCurve(){
    var coeff_A = $('#pow_compact_A').val();
    var coeff_B = $('#pow_compact_B').val();
    var bulk_density = $('#bulk_density').val();
    //console.log(coeff_A)

    var dataToPlot = [];
    for(var i=1; i<200; i++){
        dataToPlot.push({'x': i*10, 'y': ( -1 / (Math.log(i*10)/coeff_A)-coeff_B)})
    }
    console.log(chart_pow_compact.data[0].dataPoints)
    chart_pow_compact.options.data[0].dataPoints = dataToPlot
    chart_pow_compact.render();


}


function initialiseGraphs(){


        chart_pow_compact = new CanvasJS.Chart('powder_compression_graph',
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
               text: "Powder compaction curve",
               fontColor: "#000",
               fontfamily: "Arial",
               fontSize: 20,
               padding: 8
           },
       axisX:{
               title: "Stress (MPa)",
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
           data:[
           {
               type: "line",
               toolTipContent: "Stress: {x} MPa, Relative Density: {y}",
               dataPoints: [{'x' : 0, 'y' : 0}]
           }]
       });

       chart_pow_compact.render();

}
