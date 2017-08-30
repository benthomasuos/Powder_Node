



$(document).ready(function(){

    $('span.input-group-addon').on('click', function(){
        var tooltip = $(this).parent().find('div.tooltip')
        console.log(tooltip)
        tooltip.show()
        $(this).css('background-color', 'red')
        tooltip.html('Hi')
        tooltip.css('height', '100px')
        tooltip.css('width', '100px')
    })




})
