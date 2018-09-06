var PHC = 
{
    BusTracking: false,
    PageName: "",
    MaxHeight: 1920,
    MaxWidth: 1080,
    state: 
    {
        questionNumber: 0,
        questionPage:  null,
        answers: [null,null,null,null,null,]
    },

    answer: function ( question, answer, weight )
    {
        //get containing question set//
        var questionSet = document.getElementById( "question-"+PHC.state.questionNumber );

        //get any option currently selection//
        var selected = questionSet.querySelector( "div.option.selected" )

        ///turn off the selection//
        if ( selected ) selected.classList.remove("selected");

        //select the selection to selected //
        var el = document.getElementById( "q"+question+answer );
        el.classList.add("selected");

        PHC.state.answers[question] = {answer:answer,weight:weight};
    },

    clearAnswers:function()
    {
        for ( var question=0; question<PHC.state.answers.length; question++ )
        {
            var qa = PHC.state.answers[question];
            if (qa != null )
            {
                var answer = qa.answer;
                
                var el = document.getElementById( "q"+question+answer );
                if ( el )
                {
                    el.classList.remove("selected");
                }
            }
        }
        PHC.answers = [null,null,null,null,null];
    },

    start: function()
    {
        PHC.pushStatus( {questionNumber: 0 } );

        PHC.showQuestion(0);
        window.event.preventDefault = true;
        window.event.returnValue = false;
        PHC.track("start");
    },

    prev: function()
    {
        window.event.preventDefault = true;
        window.event.returnValue = false;

        history.back();
    },

    next: function()
    {
        window.event.preventDefault = true;
        window.event.returnValue = false;

        //ensure one of the options is selected//
        var questionSet = document.getElementById( "question-"+PHC.state.questionNumber );

        //get any option currently selection//
        var selected = questionSet.querySelector( "div.option.selected" );

        if ( !selected ) return;

        //moving around the browser history
        if ( history.state && history.state.isPrevious )
        {
            PHC.replaceStatus();
            
            history.forward();
            window.event.preventDefault = true;
            window.event.returnValue = false;
            return;
        }

        PHC.track("answer", 
        {
            question:questionSet.id, 
            answer:selected.id.charAt(2), 
            scenariono:+questionSet.id.charAt(9)+3
        });

        var next_question = PHC.state.questionNumber+1;

        if ( PHC.showQuestion( next_question ) )
        {
            PHC.pushStatus( {questionNumber:next_question} );
        }
        else
        {
            //display result//
            var result = PHC.showResult( );

            PHC.pushStatus( {result: result} );
            PHC.track( "result", {result:result} );
        }
    },

    home: function()
    {
        window.event.preventDefault = true;
        window.event.returnValue = false;
        
        PHC.pushStatus( {start: true } );
        PHC.showStart();
    },

    showStart: function()
    {
        PHC.show( {start:true} );
        PHC.clearAnswers();
        PHC.track( "load" );
    },

    showQuestion: function( new_question )
    {
        PHC.show( {questions:true} );

        if ( PHC.state.questionPage ) PHC.state.questionPage.style.display = "none";
        var requested = document.getElementById( "question-"+new_question );
        if ( requested != null )
        {
            PHC.state.questionPage = requested;
            PHC.state.questionNumber = new_question;
        }          
        PHC.state.questionPage.style.display = PHC.PageDisplayStyle;

        return requested != null;

    },

    getQueryString: function(new_question)
    {
        var qs = PHC.state.answers.filter( function (a){return a!=null;} ).map(function(v){return v.answer+v.weight}).join("");
        qs = ( qs != "" ? "?answers="+qs : qs);
        /*if ( new_question !== undefined ) qs+="question="+new_question;*/
        return qs;
    },

    pushStatus: function( options )
    {
        PHC.replaceStatus();

        let place = options.hasOwnProperty("result") ? "result" : 
                    options.hasOwnProperty("questionNumber") ? "answers" :
                    "start";

        options.place = place;

        switch( place )
        {
            case "result":
                history.pushState( options, place, PHC.PageName+"?result="+options.result);
                break;

            case "answers":
                history.pushState( {answers:PHC.state.answers, question:options.questionNumber},place, PHC.PageName+PHC.getQueryString() );
                break;

            case "start":
                history.pushState( options, place, PHC.PageName);
                break;
        }
    },

    replaceStatus: function()
    {
        var status = history.state;
        
        if ( status == null ) status = {start:true}

        if ( status !== null ) 
        {
            status.isPrevious = true;
            if ( status.hasOwnProperty("answers") )
            {
                status.answers = PHC.state.answers;
            }
            history.replaceState( status, status.place );
        }
     },

    restoreState: function( new_state )
    {
        if ( typeof new_state == "string" )
        {
            var fields = new_state.split("&");
            
            new_state = (new_state == "" ? {start:true} : {} )
            
            for ( var f=0; f<fields.length; f++ )
            {
                var field = fields[f];
                var nv = field.split("=");
                if ( nv.length == 2 )
                {
                    var name = nv[0];
                    var value = nv[1];
                    new_state[name] = value;
                }
            }
        }

        new_state = new_state || {};

        if ( typeof new_state == "object" )
        {
            if ( new_state.hasOwnProperty("answers") )
            {
                PHC.clearAnswers();
                
                var qid=0;
                    
                if ( typeof new_state.answers == "string" )
                {
                   for( var q=0; q<new_state.answers.length; q+=2 )
                    {
                        var answer = +new_state.answers[q];
                        var weight = new_state.answers[q+1];
                        PHC.answer( qid++, answer, weight );
                    }
                }
                else
                {
                    for( var q=0; q<new_state.answers.length; q++ )
                    {
                        var answer = new_state.answers[q];
                        if ( answer != null )
                        {
                            PHC.answer( q, answer.answer, answer.weight );
                            qid = q;
                        }

                    }
                }

                question = new_state.hasOwnProperty("question") ? +new_state.question : qid;
                PHC.showQuestion( question ) 
            }
            else if ( new_state.hasOwnProperty("question") )
            {
                PHC.showQuestion( new_state.question ) 
            }
            else if ( new_state.hasOwnProperty("result") )
            {
                PHC.showResult(  new_state.result ) 
            }
            else if ( new_state.hasOwnProperty("start") )
            {
                PHC.showStart();
            }
        }
    },

    showResult: function( restore_result )
    {
        PHC.show( {results:true} );

        var result= restore_result || "?";

        if ( PHC.state.resultPage ) PHC.state.resultPage.style.display = "none";

        if ( result == "?" )
        {
            var score = {A:0, B:0, C:0, D:0};
            for( var question=0; question< PHC.state.answers.length; question++ )
            {
                var weight = PHC.state.answers[question].weight;
                
                if ( score[weight] )
                    score[weight]++;
                else
                    score[weight] = 1;
            }

            
            //map the score to a band
            for( var band in PHC.bands )
            {
                var targets = PHC.bands[band];

                //for every target score in a band//
                for( var t=0; t<targets.length; t++ )
                {
                    var target = targets[t];
                    
                    //if the target score has all valid fields, then this is a pass - woop//
                    //assume success//
                    var passed = true;

                    for( var answer in target )
                    {
                        if ( !score.hasOwnProperty( answer ) )
                        {
                            passed = false;
                        }
                        else if ( score[answer] != target[answer] )
                        {
                            passed = false;
                        }
                        if ( !passed ) break;
                    }

                    if ( passed )
                    {
                        result = band;
                        break;
                    }
                }
                if ( result != "?"  ) break;
            }
        }

        var el = document.getElementById( "result-"+result );
        el.style.display = PHC.PageDisplayStyle;
        PHC.state.resultPage = el;
        
        return result;
    },

    show: function( items )
    {
        try
        {
            var defaults = {start:false, results:false, questions:false}

            for( def in defaults )
            {
                if ( !items.hasOwnProperty( def ) ) items[def] = defaults[def];
            }

            for ( var section in items )
            {
                var el = document.getElementById( section )
                var show = (items[section] == true);
                if ( show )
                {
                    el.style.zIndex = 1;
                }
                else
                {
                    el.style.zIndex = 0;
                }
                el.style.display = ( show ? PHC.PageDisplayStyle : "none" );
            }

            if (typeof(Event) === 'function') 
            {
                // modern browsers
                window.dispatchEvent(new Event('resize'));
            } 
            else 
            {
                var evt = window.document.createEvent('UIEvents'); 
                evt.initUIEvent('resize', true, false, window, 0); 
                window.dispatchEvent(evt);
            }
        }
        catch(e)
        {
            alert(e.message);
        }
    },


    fitToScreen: function()
    {
        var scale = window.innerHeight/PHC.MaxHeight;
        document.documentElement.style.fontSize =scale*10+"px"
    },

    exit: function ()
    {
        const remote = require('electron').remote;
        var window = remote.getCurrentWindow();
        window.close();
    },
    
    track: function(what, payload)
    {
        if ( !PHC.BusTracking ) return;

        var url = "";

        switch( what)
        {
            case "load":
                url = "http://statse.webtrendslive.com/dcs222rd2gkg8p2vli1bl94ba_5p2b/dcs.gif?dcsredirect=126&dcstlh=0&dcstlv=0&dcsuri=/touch-screen/splash&dcssip=www.scottishwidows-pensionbus.co.uk&WT.es=www.scottishwidows-pensionbus.co.uk/touch-screen/splash&WT.tx_e=v&WT.si_n=pension_personality&brand=ScottishWidows&division=Retail&WT.ti=Pension Bus - Splash Screen&WT.si_x=1";
                break;
    
            case "start":
               url = "http://statse.webtrendslive.com/dcs222rd2gkg8p2vli1bl94ba_5p2b/dcs.gif?dcsredirect=126&dcstlh=0&dcstlv=0&dcsuri=/touch-screen/start-funnel&dcssip=www.scottishwidows-pensionbus.co.uk&WT.es=www.scottishwidows-pensionbus.co.uk/touch-screen/start-funnel&WT.si_n=pension_personality&brand=ScottishWidows&division=Retail&WT.ti=Pension Bus - Start Button&WT.si_x=2"            
               break;

            case "answer":
                utag.view({});
                url = "http://statse.webtrendslive.com/dcs222rd2gkg8p2vli1bl94ba_5p2b/dcs.gif?dcsredirect=126&dcstlh=0&dcstlv=0&dcsuri=/touch-screen/questions&dcssip=www.scottishwidows-pensionbus.co.uk&WT.es=www.scottishwidows-pensionbus.co.uk/touch-screen/questions&DCSext.qa.question={{question}}&WT.si_x={{scenariono}}&DCSext.qa.answer={{answer}}&WT.si_n=pension_personality&brand=ScottishWidows&division=Retail&WT.ti=Pension Bus - Questions";
                break;

            case "result":
                url = "http://statse.webtrendslive.com/dcs222rd2gkg8p2vli1bl94ba_5p2b/dcs.gif?dcsredirect=126&dcstlh=0&dcstlv=0&dcsuri=/touch-screen/results&dcssip=www.scottishwidows-pensionbus.co.uk&WT.es=www.scottishwidows-pensionbus.co.uk/touch-screen/results&WT.tx_e=s&WT.si_n=pension_personality&brand=ScottishWidows&division=Retail&WT.ti=Pension Bus - Results&WT.tx_s={{result}}&WT.si_x=8"
                break;
        }

        if ( url != "" )
        {
            if (payload )
            {
                for ( var field in payload )
                {
                    url = url.replace( "{{"+field+"}}", payload[field] );
                }
            }

            //Add WebTrends tracking//
            var request = new XMLHttpRequest();
            request.open("GET", url, true);
            request.send();
            //console.log(url);
        }
    },
        
    initialisePage: function( options )
    {
        PHC.PageName = options.PageName;
        PHC.BusTracking = options.BusTracking;
        PHC.bands = options.Bands;

        if ( options.FitToScreen )
        {
            window.addEventListener( "resize", function()
            { 
                PHC.fitToScreen();
            })  

            setTimeout(  PHC.fitToScreen, 0 );
        }
        
        PHC.PageDisplayStyle = options.PageDisplayStyle;

        var question = 0;

        //attempt to restore saved locations//
        PHC.restoreState( window.location.search.replace("?","") );

        window.addEventListener( "popstate", function(event)
        { 
            PHC.restoreState( event.state );
        })        

        window.addEventListener( "resize", function(event)
        { 
            PHC.resizeVideo();
        })
        PHC.resizeVideo();
    },

    resizeVideo: function()
    {
        let height = window.innerHeight
        let width = (window.innerHeight * (PHC.MaxWidth/PHC.MaxHeight))

        let vid = document.getElementById("wid-vid");
        if ( vid )
        {
            vid.height = Math.ceil(height);
            vid.width  = Math.ceil(width);
        }
    }

}
