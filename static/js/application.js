function getWeather() {
    $.simpleWeather({
        location: "51.434431, -2.667650",
        unit: 'c',
        success: function(weather) {
            $("#weather-icon").html('<span class="weather-icon-'
                                    + weather.code +
                                    '"></span>');
            $("#weather-text").html(weather.temp);
        },
        error: function(error) {
            $("#weather-icon").html('<span class="weather-icon-error"></span>');
            $("#weather-text").html(weather.temp);
        }
    });
}


$(document).ready(function() {
    window.onresize = function() {
        $("#content").height (window.innerHeight * 0.98);
    }
    window.onresize();

    var socket = io.connect("http://" + document.domain + ":" + location.port);

    socket.on("server_state_broadcast", function(state) {
        $("#temperature-text").html(state.temperature.toFixed(1));
        if (state.target_temperature == null)
            state.target_temperature = "Off"
        $("#thermostat-text").html(state.target_temperature);
        if (state.heating_is_on) {
            $("#flame-path").removeClass("svg-outline").addClass("svg-red");
            $("#boiler-text").html("On");
        } else {
            $("#flame-path").removeClass("svg-red").addClass("svg-outline");
            $("#boiler-text").html("Off");
        }
    });

    $("#thermostat-text").click(function() {
        data = [{"start": "00:00", "end": "23:59", "temperature": 23}];
        socket.emit("schedule_change", data);
    });

    // Refresh every 10 mins
    getWeather();
    setInterval(getWeather, 600000);
});
