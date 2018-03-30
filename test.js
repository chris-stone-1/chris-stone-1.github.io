
var https = require("https");
       uptrendsapi = "https://lbgroup%5Cchris.stone:George37@@@ws.webtrends.com/v3/Reporting/profiles/104882/reports/iWAcKzOh5N7/?totals=only&period_type=agg&format=json&suppress_error_codes=true&start=2017m3&end=2017m3";

https.get(uptrendsapi, function(res){
    var body = '';

    res.on('data', function(chunk){
        body += chunk;
   });

    res.on('end', function(){
        var uptrends = JSON.parse(body);
	console.log(uptrends.data[0].measures.Visits);
    });
})
