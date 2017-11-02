$(document).ready(function() {
    var socket = io.connect("http://" + document.domain + ":" + location.port);

    socket.on("server_state_broadcast", function(state) {
        $("#current-temperature").html(state.temperature);
        if (state.target_temperature == null)
            state.target_temperature = "Off"
        $("#target-temperature").html(state.target_temperature);
        if (state.heating_is_on) {
            $("#heating-state").html("On");
        } else {
            $("#heating-state").html("Off");
        }
    });

    $("#dial-svg").click(function() {
        data = [{"start": "00:00", "end": "23:59", "temperature": 20}];
        socket.emit("schedule_change", data);
    });
});
