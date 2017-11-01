$(document).ready(function() {
    var socket = io.connect("http://" + document.domain + ":" + location.port);

    socket.on("server_state_broadcast", function(state) {
        $("#current_temperature").html(state.temperature);
    });

    var min_divisions = 4;
    for (var h = 0; h < 24; h++) {
        for (var m = 0; m < min_divisions; m++) {
            var main_div = $("<div>", {"class": "temperature-slider"});

            var widget_div = $("<div>", {"class": "slider-widget"});
            main_div.append(widget_div);

            var value_div = $("<div>", {"class": "slider-value"}).text("0");
            main_div.append(value_div);

            var hours = h < 10 ? "0" + h : h;
            var mins = m * 60 / min_divisions;
            var minutes = mins < 10 ? "0" + mins : mins;
            var time_div = $("<div>", {"class": "slider-time"});
            if (m < 1) {
                time_div.text(hours + ":" + minutes);
            } else {
                time_div.html("&nbsp;");
            }
            main_div.append(time_div);

            $(".schedule").append(main_div);
        }
    }

    $(".slider-widget").each(function() {
        var value = $($(this).siblings(".slider-value")[0]);
        $(this).slider({
            min: 0,
            max: 30,
            range: "min",
            orientation: "vertical",
            slide: function(event, ui) {
                value.text(ui.value);
            }
        });
        $(this).find(".ui-slider-handle").hide();
    });
});
