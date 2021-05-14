<?php
require_once "../php/session.php";
?>
<!DOCTYPE html>
<html lang="en">
	<head>
		<title>Asteroids Game</title>
		<meta charset="utf-8"/>
        <link rel="shortcut icon" href="../favicon.ico">
		<link rel="stylesheet" href="css/main.css">
		<link rel="stylesheet" href="css/fonts.css">

		<script src="jquery-3.5.1.min.js"></script>
    </head>
	<body>
		<div id="wrapper" class="centered">
			<div id="gameCanvasContainer"></div>
		</div>

		<div id="timeUpText" class="centered">Your time is up!</div>

		<script>
			$(document).ready(function(){
				$("#timeUpText").hide();    
			});
		</script>

		<script src="src/main.js"></script>
	</body>
</html>
