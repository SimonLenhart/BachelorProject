let tabHeader = document.getElementsByClassName("tab-header")[0];
let tabIndicator = document.getElementsByClassName("tab-indicator")[0];
let tabBody = document.getElementsByClassName("tab-body")[0];
let tabsPane = tabHeader.getElementsByTagName("div");

var options = { enableGestures: true, frameEventName: 'animationFrame'};
var leapCursor = document.getElementById("leapCursor");
var coordLeap = {x: 0, y: 0, width: 0, height: 0};
var selEle; // Array of selectable Objects 
var selEleBackup; // Array of normal selectable Objects, after all selectable Objects are removed, when an alert Panel appears
var currentSelEle, prevSelEle; // Two variables for checking which Elements were/are being selected
var posIndex = {x: 0, y: 0};
var horizontalOffset = 700;
var verticalOffset = 1050;
var scaleX = 3;
var scaleY = 3;
var isCollision = false;
var isLoadingInd = false;
var startWasClicked = false;
var detectingFingers = false;
var comeFromSummary = false;
var letterClicked = false; //Checks if a letter was clicked, to switch background-color
var interactBoxActiv = false;
var extendedFingers = 0; 
var countFuncFing = 0;
var loadIndID = 0; // Counter for the ID of Loading Indicator
var collisionNum = 0; // Counter for movements into/out of an element 
var selConnection;
var currentFocus; 
var fingerCheck;
var circleEle; // Loading Indicator on the Cursor
let filteredCities = []; // Array of all possible Starts/Destinations
var curDispCities = []; //Array of all displayed cities
var possibleCon = []; // All possilbe Connections
var dateTime = new Date(); //Get current Date & Time

Leap.loop(options,  function(frame) // Function to access the features of the Leap Motion controller, runs 60 times per second
    {
        for (var i=0, len = frame.hands.length; i< len; i++)
        {   // Mapping the position of the fingers from coordinates relative to the controller to screen coordinates  
            hand = frame.hands[i];
            posIndex.x =  hand.indexFinger.dipPosition[0];
            posIndex.y = hand.indexFinger.dipPosition[1]; 
            if(posIndex.y < 80 && interactBoxActiv == false) // Giving out alert message if hand is too low
            {
                interactBoxActiv = true;
                $('#interface').css({"filter": "blur(8px)"});
                var alert = document.createElement("p");
                alert.classList.add("alertPanel", "alertBox");
                alert.style.height = "400px";
                alert.innerHTML = "<p>Please move your hand a little higher.</p>" + 
                "<img style='animation: moveUp 2s ease-in-out infinite; width: 50%; position: absolute; left: 25%; top: 65%; ' src='Images/hand.png'>";
                document.body.appendChild(alert);
            }
            else if (posIndex.y > 80 && interactBoxActiv == true)
            {
                interactBoxActiv = false;
                $(".alertBox").fadeOut();
                $('#interface').css({"filter": ""});
            } 
            leapCursor.style.left =  horizontalOffset + posIndex.x * scaleX +"px";
            leapCursor.style.top = verticalOffset - posIndex.y * scaleY + "px";
            coordLeap = {x: leapCursor.getBoundingClientRect().x + 0.5*leapCursor.width, 
                        y:leapCursor.getBoundingClientRect().y + 0.5*leapCursor.height, 
                        width: leapCursor.getBoundingClientRect().width, 
                        height: leapCursor.getBoundingClientRect().height};
        
            if (isLoadingInd) // Position the loading indicator relative to the cursor
            {
                circleEle.style.top = coordLeap.y - 20 + "px";
                circleEle.style.left = coordLeap.x - 20 + "px";
            }

            // This part handles the couting of the extended fingers 
            if(detectingFingers)
            {
                fingerCheck = extendedFingers;
                extendedFingers = 0;
            
                for(var f = 0; f < hand.fingers.length; f++)
                {
                    var finger = hand.fingers[f];
                    if(finger.extended) 
                    {
                        extendedFingers++;
                    }
                }
                if(extendedFingers == 0)
                {
                    makeGreen("disable");
                }
                if(fingerCheck != extendedFingers && extendedFingers >= 1)
                {
                    makeGreen("restart");
                    checkIfFinished();
                }
                
                document.querySelector(".numberPas").innerHTML = extendedFingers;
            }
            checkCollision(); // Checks if there is any collision between the cursor and an selectable element
        }});

function checkCollision() //Function checks for collion between cursor and all selectable Elements
{
        var collisionCount = 0;
        for(var i=0; i<selEle.length; i++) // Loops through the array of all selectable Objects
        {
            var a = coordLeap;
            var b = selEle[i].getBoundingClientRect();
            isCollision = !(((a.y) < (b.y)) || // This is the actual collision check
            (a.y > (b.y + b.height)) ||
            ((a.x) < b.x) ||
            (a.x > (b.x + b.width)));

            if(isCollision)
            { 
                if(currentSelEle != selEle[i]) // If cursor was moved to another element, delete existing Loading Indicator
                {   collisionNum++;       
                    deleteLoadingInd();  
                    selEle[i].classList.remove("hovered");
                }
                if (!isLoadingInd && prevSelEle != currentSelEle) // If there is no loading indicator yet and cursor was moved to a new element
                {
                    collisionNum++;
                    createLoadingInd(); 
                    for(let i=0; i<document.querySelectorAll(".hovered").length; i++)
                    {
                            document.querySelectorAll(".hovered")[i].classList.remove("hovered");
                    }
                    selEle[i].classList.add("hovered");
                    clickElement(collisionNum); // Calls the click function, which checks again after 1s if the cursor is still on the same element
                }
                collisionCount++; 
                currentSelEle = selEle[i];
            }
        }
        if(collisionCount==0 && isLoadingInd) // If there is no collison at all, delete the loading indicator and hovered elements
        {
            collisionNum++;  
            deleteLoadingInd();  
            if(document.querySelectorAll(".hovered") !== null)
            {
                for (let i=0; i<document.querySelectorAll(".hovered").length; i++)
                {
                    document.querySelectorAll(".hovered")[i].classList.remove("hovered");
                }
            }
        }
}

function clickElement(currentColNum) // Checks if the curser is still on the same Element 1 second after this method gets called. If yes, then click the element
{
    setTimeout(function() {
        if(currentColNum == collisionNum)
        {
            prevSelEle = currentSelEle;
            if(currentSelEle.classList.contains("letter") || currentSelEle.classList.contains("delete") || currentSelEle.id == "resetBtnPas" || currentSelEle.classList.contains("numberPick")) // If we selected a keyboard element, number or reset button, make it selectable again 
            {
                setTimeout(function() {
                    if(currentSelEle == prevSelEle) {prevSelEle = null;}}, 1500); // Make elements selectable again after 1.5 seconds
            }
            if(currentSelEle.classList.contains("clndr-previous-button") || currentSelEle.classList.contains("clndr-next-button")) // Make the next- & prevButton selectable after 500ms, so they don't get selected immediately
            {
                setTimeout(function(){
                    document.querySelector(".clndr-previous-button").classList.add("selectable");
                    document.querySelector(".clndr-next-button").classList.add("selectable");
                    updateSeleList();
                }, 500);
            }
            currentSelEle.classList.remove("hovered");
            if(currentSelEle.type == "text")
            {
                var contEle = currentSelEle;
                currentSelEle.classList.add("pushed");
                setTimeout(function() {contEle.classList.remove("pushed");}, 700);
            }
            currentSelEle.click(); // Click the hovered Element
        }}, 1000);
}

function changePanel(i)//Function for changing between the panels
{
    tabHeader.getElementsByClassName("active")[0].classList.remove("active");
    tabsPane[i].classList.add("active");
    if (tabBody.getElementsByClassName("active").length !== 0)
    {
        tabBody.getElementsByClassName("active")[0].classList.remove("active");
    }
    tabBody.getElementsByClassName("myContent")[i].classList.add("active");
    tabIndicator.style.left = `calc(calc(100% / 6) * ${i})`;

    switch(document.querySelectorAll(".myContent.active")[0].id)
    {
        case "firstPanel": 
            document.getElementById("callToInt").style.cssText = "position: fixed; top:5000px;"
            document.querySelector(".tabs").style.top = "0px";
            tabBody.getElementsByClassName("myContent")[0].classList.add("active");
            break;
        case "secondPanel": 
            if(comeFromSummary)
            {
                document.querySelectorAll(".nextBtn")[0].innerHTML = "&#10004;";
                document.querySelectorAll(".nextBtn")[0].style.fontSize = "40px";
                document.querySelectorAll(".nextBtn")[0].onclick= "";
                document.querySelectorAll(".nextBtn")[0].removeAttribute("onclick");
            }
            break;
        case "thirdPanel":
            if(comeFromSummary)
            {
                document.querySelectorAll(".nextBtn")[1].innerHTML = "&#10004;";
                document.querySelectorAll(".nextBtn")[1].style.fontSize = "40px";
                document.querySelectorAll(".nextBtn")[1].onclick= "";
                document.querySelectorAll(".nextBtn")[1].removeAttribute("onclick");
                document.querySelectorAll(".nextBtn")[1].onclick = function func() {changePanel(5);};
            }
            document.querySelectorAll(".nextBtn")[1].classList.remove("selectable");
            updateSeleList();
            setTimeout( function() { document.querySelectorAll(".nextBtn")[1].classList.add("selectable"); updateSeleList(); makeGreen("start")}, 2000); // Begin the extended finger tracking and make the button selectable after 1.5 seconds, so it cant get clicked immediately directly after coming to the panel
            comeFromSummary = false;

            var myInt1 = setInterval(function() {  // Make animation of switching amout of fingers
                switch(document.querySelector(".activeFi").id)
                {
                    case("fingerPic1"):
                        document.querySelector("#fingerPic1").classList.remove("activeFi");
                        document.querySelector("#fingerPic1").classList.add("transparent");
                        document.querySelector("#fingerPic2").classList.remove("tranparent");
                        document.querySelector("#fingerPic2").classList.add("activeFi");
                        break;
                
                    case("fingerPic2"):
                        document.querySelector("#fingerPic2").classList.remove("activeFi");
                        document.querySelector("#fingerPic2").classList.add("transparent");
                        document.querySelector("#fingerPic3").classList.remove("tranparent");
                        document.querySelector("#fingerPic3").classList.add("activeFi");
                        break;
                    
                    case("fingerPic3"):
                        document.querySelector("#fingerPic3").classList.remove("activeFi");
                        document.querySelector("#fingerPic3").classList.add("transparent");
                        document.querySelector("#fingerPic1").classList.remove("tranparent");
                        document.querySelector("#fingerPic1").classList.add("activeFi");
                        break;
                }
            }, 1200);
            setTimeout(function() {clearInterval(myInt1);}, 9000);
            break;

        case "forthPanel":
            document.querySelectorAll(".nextBtn")[2].classList.remove("selectable");
            updateSeleList();
            setTimeout(function () { document.querySelectorAll(".nextBtn")[2].classList.add("selectable"); updateSeleList();}, 1500);  //Make the button selectable after 1.5s second, so it cant get clicked immediately directly after coming to the panel
            break; 

        case "fifthPanel":
            loadConnections();
            break;

        case "sixthPanel":
            loadSummary();
            break;

        default:
            break;
    }
}

function createLoadingInd() // Creates the Loading Indicator around the Cursor
{
        loadIndID++; 
        var currentLoadID = loadIndID; // Assign variable, so the "setTimeout"-function just gets triggered by the same Loading Indicator
        isLoadingInd = true;  
         // Create Circle Element 
        circleEle = document.createElement('div');
        circleEle.setAttribute("data-anim", "base wrapper");
        circleEle.classList.add("wrapper");
        circleEle.innerHTML = '<div class="circle" data-anim="base left"></div><div class="circle" data-anim="base right"></div>';
        circleEle.style.position = "absolute";
        document.body.appendChild(circleEle);
        setTimeout( function () { if(loadIndID == currentLoadID){deleteLoadingInd()}}, 1000); // If animation is finished after 1s, delete the loading indicator
}

function deleteLoadingInd()  // Deletes the Loading Indicator
{
    if(isLoadingInd)
    {
        isLoadingInd = false;
        document.getElementsByClassName("wrapper")[0].remove();
    }
    
}

function updateSeleList() // Creating the List of selectable Objects 
{
    selEle = document.querySelectorAll(".selectable");  
}


function compInputCity() // Function to compare keyboard input to the possilbe city proposals
{ 
    curDispCities = Array.prototype.slice.call(document.querySelector("#displayedCities").getElementsByTagName("LI")); 
    for (var j=0; j<curDispCities.length; j++) // Fills the Array with just the citynames
    {
        curDispCities[j] = curDispCities[j].innerHTML;
    }
    for (var i=0; i<filteredCities.length; i++) // Check for all possible citynames...
    {
        if(filteredCities[i].toUpperCase().startsWith(currentFocus.value.toUpperCase()) ) // ... If the input machtes the beginning of the cityname
        {   
            if(!curDispCities.includes(filteredCities[i]) && (document.querySelectorAll("#displayedCities LI").length < 6)) // If the city is yet not included in the list & in total there are less than 7 cities displayed ...
            {
                // Add the City, which is matching the input, to the DOM 
                var city = document.createElement("LI");
                city.innerHTML = filteredCities[i];
                city.setAttribute("name", filteredCities[i]);
                $(city).on("click", function () { setValue("city");});
                $(city).addClass("selectable");
                updateSeleList();
                document.querySelector("#displayedCities").appendChild(city);
            } 
        }
        else // If input doesn't match any city, but there are still some cities displayed, remove them
        {   
            if(document.getElementsByName(filteredCities[i]).length != 0)
            {
                for(var j=0; j<document.getElementsByName(filteredCities[i]).length; j++)
                {
                    document.getElementsByName(filteredCities[i])[j].parentNode.removeChild(document.getElementsByName(filteredCities[i])[j]);
                }
            }
        }
    }
    for(let i=0; i<document.querySelectorAll("#displayedCities LI").length; i++) //Put some visual attention on the proposals
    {
        document.querySelectorAll("#displayedCities LI")[i].classList.add("attention");
        setTimeout(function() {document.querySelectorAll("#displayedCities LI")[i].classList.remove("attention");},500);
    }
}

function makeGreen(myCase) //Handels the green progress bar for the selection of amount of passengers
{
    switch(myCase)
    {
        case "start":
            document.querySelector("#slide").style.cssText = "animation: left-to-right 2s linear forwards;";
            detectingFingers = true;
            break;
    
        case "restart": 
                document.querySelector("#slide").style.animation =  "";
                document.querySelector("#slide").style.left = "-200px";
                setTimeout(function() {  document.querySelector("#slide").style.cssText = "animation: left-to-right 2s linear forwards;";}, 100);
                detectingFingers = true;
            break;

        case "disable":
            document.querySelector("#slide").style.animation =  "";
            document.querySelector("#slide").style.left = "-200px";
            break;
    }
}

function checkIfFinished() { // For detecting the amount of fingers,  checks after 2 seconds if the value is still the same, if yes, stop the detection for the shown amount of fingers
    countFuncFing++;
    var currentCount = countFuncFing;
    setTimeout(function () {
        if (currentCount == countFuncFing && currentCount != 0 )
        {
            console.log("Selected Value: " + extendedFingers);
            detectingFingers = false;
            $("#slide").css("background-color", "#549c55");
            $(".wrapper2").css("animation", "focus 1s ease-in"); //Increase the size of the box to indicate the successful selection of a number
            setTimeout(function() {$(".wrapper2").css("animation", "");},1000); // Stop the animation after 1s
        }
    }, 2000);
}

function loadConnections()// This function loads the possible connections according to the given input 
{   // First, delete all the content, which is already there
    if(document.querySelectorAll(".possibleCon p").length > 0)
    {
        var displayedCon = document.querySelectorAll(".possibleCon p");
        displayedCon = Array.prototype.slice.call(displayedCon);
        for(let i=0; i<displayedCon.length; i++)
        {
            displayedCon[i].parentNode.removeChild(displayedCon[i]);
        }
    }
    // Store entered data in variables for easier access
    let selStart = document.querySelector("#startInput").value;
    let selDest = document.querySelector("#destInput").value;
    let dateInput = document.querySelector("#dateInput").dataset;
    var timeInput = document.querySelector("#timeInput").dataset;
    let selDatComp = new Date(dateInput.year, dateInput.month-1, dateInput.day, timeInput.hour, timeInput.minute);
    
    for(let i=0; i<connectionData.length; i++) // Assign IDs and a full date format to all the connection data
    {
        connectionData[i].fullDate = new Date(connectionData[i].Year, connectionData[i].Month - 1, connectionData[i].Day, connectionData[i].Hours, connectionData[i].Minutes);
        connectionData[i].id = i;
    }

    possibleCon = connectionData.filter(date => (date.fullDate > selDatComp) && (date.Start == selStart) && (date.Destination == selDest) ); // Only take connections, matching to time, date, start & destination
    possibleCon.sort(function(a, b){return a.fullDate-b.fullDate}); // Order them after date
    for(let i=0; i< Math.min(possibleCon.length, 3); i++) // Show the most fitting 3 proposals
    {
        var displayConnection = document.createElement("P");
        displayConnection.setAttribute("id", possibleCon[i].id);
        displayConnection.classList.add("displayedCon");
        displayConnection.innerHTML = "<div>Start: " + possibleCon[i].Start + "<br>" + 
                                    "Dest.: " +  possibleCon[i].Destination + "</div>" +
                                    "<div style='position: absolute; left: 38%; top: 12%;'>Date: " + possibleCon[i].Day + "/" + possibleCon[i].Month + "/" + possibleCon[i].Year + "<br>" + 
                                    "Dep. time: " + possibleCon[i].Hours + ":" + possibleCon[i].Minutes + "</div>" +  
                                    "<div style='position: absolute; left: 75%; top: 12%;'> Duration: " + possibleCon[i].Duration  + "<br/>" +
                                    "Changes: " + possibleCon[i].Changes + "<br>" + 
                                    "Price: " + possibleCon[i].Price + "</div>";
        $(displayConnection).on("click", function() {setValue("connection");});
        $(displayConnection).addClass("selectable");
        document.querySelector(".possibleCon").appendChild(displayConnection);
        updateSeleList();
    }

    if(possibleCon.length == 0) //If there are no fitting connections, make the proposal to change Start/Destination or Date/Time
    {
        delObjSel();
        $('#interface').css({"filter": "blur(8px)"});
        var alert = document.createElement("p");
        alert.classList.add("alertPanel");
        alert.style.height = "400px";
        alert.innerHTML = "<p>No fitting connection was found. <br> <br> Please select another start/destination or another date/time.</p>";

        var cityButton = document.createElement("a");
        cityButton.innerHTML = "Change City"; 
        $(cityButton).on("click", function() { comeFromSummary = true; 
                                            changePanel(1); 
                                            this.parentNode.remove(); 
                                            makeObjSel();
                                            $('#interface').css({"filter": ""});});
        $(cityButton).addClass("btn selectable");
        $(cityButton).css({"top": "50px"});
        alert.appendChild(cityButton);
        var timeButton = document.createElement("a");

        timeButton.innerHTML = "Change Time"; 
        $(timeButton).on("click", function() { comeFromSummary = true; 
                                            changePanel(3); 
                                            this.parentNode.remove();
                                            makeObjSel();
                                            $('#interface').css({"filter": ""});});
        $(timeButton).addClass("btn selectable");
        $(timeButton).css({"top": "50px"});
        alert.appendChild(timeButton);

        document.body.appendChild(alert);
        updateSeleList();
    }
}

function loadSummary ()  // Loads the summary of all data
{
    comeFromSummary = true;
    if(document.getElementsByClassName("inputBlink").length > 0)  // Make the input blink
    {
        document.getElementsByClassName("inputBlink")[0].classList.remove("inputBlink");
    }
    if(selConnection == undefined) // If no connection was selected...
    {
        delObjSel();
        $('#interface').css({"filter": "blur(8px)"});
        var alert = document.createElement("p");
        alert.classList.add("alertPanel");
        alert.innerHTML = "<p>No Connection was selected. <br><br> Please choose your desired Connection.</p>";
        alert.id = "alertMessage";
        var okbutton = document.createElement("a");
        okbutton.innerHTML = "OK"; 
        $(okbutton).on("click", function() { changePanel(4); makeObjSel(); this.parentNode.remove();   $('#interface').css({"filter": ""});});
        $(okbutton).addClass("btn selectable");
        $(okbutton).css({"position": "relative", "top": "50px"});
        alert.appendChild(okbutton);
        document.body.appendChild(alert);
        updateSeleList();
    }
    else
    { // Display all the connection data
        var gridContent = document.querySelector(".grid-container").children;
        var firstColGrid = [];
        for (let i=0; i<gridContent.length; i+=2)
        {
            gridContent[i].style.textAlign = "right";
        }
        document.querySelector("#startInput2").value = selConnection.Start;
        document.querySelector("#destInput2").value = selConnection.Destination;
        document.querySelector("#amountPas2").value = document.querySelector(".numberPas").innerHTML;
        document.querySelector("#dateInput2").value = selConnection.Day + "/" + selConnection.Month + "/" + selConnection.Year;
        document.querySelector("#timeInput2").value = selConnection.Hours + ":" + selConnection.Minutes;
        document.querySelector("#sumDuration").innerHTML =  selConnection.Duration;
        document.querySelector("#sumChanges").innerHTML = selConnection.Changes;
        document.querySelector("#price").innerHTML = "<b>" + selConnection.Price.slice(0, -1) * document.querySelector(".numberPas").innerHTML +  "€ </b>" ;
    }
}

function showElement(type, bool)// Function to make Elements appear/disappear
{
    currentFocus = event.target;
    switch(type)
    {
        case("timeTickets"): // Shows the time tickets Panel
            if(bool)
            {
                delObjSel();
                $('#interface').css({"filter": "blur(8px)"});
                var timeTicketPanel = document.createElement("div"); 
                $(timeTicketPanel).addClass("alertPanel");
                timeTicketPanel.innerHTML = "<p>Here you could purchase weekly, monthly or annual tickets.</p>" + 
                                            "<p>Due to the scope of the project, this option was not implemented.</p>";
                var okButton = document.createElement("a");
                okButton.innerHTML = "OK"; 
                $(okButton).on("click", function() {this.parentNode.remove(); 
                                                    makeObjSel();
                                                    $('#interface').css({"filter": ""});});
                $(okButton).addClass("btn selectable");
                $(okButton).css({"position": "relative", "top": "10px"});
                timeTicketPanel.appendChild(okButton);
                document.body.appendChild(timeTicketPanel);  
            }
        break;

    case("ticketInf"):  // Shows the Ticket Information Panel or the "entering number for more than 5 passengers" Panel
            delObjSel();
            $('#interface').css({"filter": "blur(8px)"});
            var ticketInfPanel = document.createElement("div"); 
            $(ticketInfPanel).addClass("alertPanel");
            if(bool) //Ticket Information Panel
            {
                ticketInfPanel.innerHTML = "<p>Please enter your ticket number to obtain Information about your connection.</p>" + 
                                        "<label>Ticket-Nr:</label> <input type='text' class='selectable inputBlink' id='inputNumberBlock'>" +
                                        "<div class='displayInputNumb' style='width: 80%;display: block; margin-left: auto; position: relative; margin-right: auto; top: 20px;'></div>";
            }
            else //"entering number for more than 5 passengers" Panel
            {
                ticketInfPanel.innerHTML = "<p>Please enter amount of Passengers.</p>" + 
                "<label>Amount:</label> <input type='text' class='selectable inputBlink' id='inputNumberBlock'>" +
                "<div class='displayInputNumb' style='width: 80%;display: block; margin-left: auto; position: relative; margin-right: auto; top: 20px;'></div>";
            }
            ticketInfPanel.style.top = "80px";
            ticketInfPanel.style.height = "580px";
            for(let i=1; i<10; i++) // Add numbers from 1-9
            {   
                var numberField;
                numberField = document.createElement("LI");
                numberField.innerHTML = i;
                $(numberField).on("click", function () { document.querySelector("#inputNumberBlock").value += i; 
                                                        var currentNum = $(this);
                                                        currentNum.addClass("pushed"); 
                                                        setTimeout(function() {currentNum.removeClass("pushed"); letterClicked=false;}, 700); });
                $(numberField).addClass("selectable numberPick");
                ticketInfPanel.querySelector(".displayInputNumb").appendChild(numberField);
            }  
            //Delete All Button
            var numberField;
            numberField = document.createElement("LI");
            numberField.style.cssText = "position: relative; left: 5px; top: 3px;"
            numberField.style.fontSize = "15px";
            numberField.style.padding = "12px 31px";
            numberField.style.left = "100px;"
            numberField.innerHTML = "Delete All";
            $(numberField).on("click", function () { document.querySelector("#inputNumberBlock").value = "";
                                                    currentNum.addClass("pushed"); 
                                                    setTimeout(function() {currentNum.removeClass("pushed"); letterClicked=false;}, 700); });
            $(numberField).addClass("selectable numberPick");
            ticketInfPanel.querySelector(".displayInputNumb").appendChild(numberField);
            //0 Button
            var numberField;
            numberField = document.createElement("LI");
            numberField.innerHTML = 0;
            $(numberField).on("click", function () { document.querySelector("#inputNumberBlock").value += 0;
                                                    var currentNum = $(this);
                                                    currentNum.addClass("pushed"); 
                                                    setTimeout(function() {currentNum.removeClass("pushed"); letterClicked=false;}, 700); });
            $(numberField).addClass("selectable numberPick");
            ticketInfPanel.querySelector(".displayInputNumb").appendChild(numberField);
            //Delete Button
            var numberField;
            numberField = document.createElement("LI");
            numberField.style.cssText = "position: relative; top: -3px";
            numberField.style.fontSize = "15px";
            numberField.style.padding = "20px 32px 20px 25px";
            numberField.innerHTML = "Delete";
            $(numberField).on("click", function () { document.querySelector("#inputNumberBlock").value = document.querySelector("#inputNumberBlock").value.slice(0, -1);});
            $(numberField).addClass("selectable numberPick");
            ticketInfPanel.querySelector(".displayInputNumb").appendChild(numberField);
            var okButton = document.createElement("a");
            okButton.innerHTML = "OK"; 
            if(bool) //Ticket Information Panel, if button is clicked show Information about the ticketnumber (here is just default data)
            {
                $(okButton).on("click", function() { var allContent = this.parentNode.querySelectorAll("*"); // Remove the current content and add some new
                                                    for(let i=0; i<allContent.length; i++)
                                                    {
                                                        allContent[i].remove();
                                                    }
                                                    ticketInfPanel.style.height = "500px";
                                                var newContent = document.createElement("div");
                                                newContent.innerHTML = "<p style=' line-height: 2 ;'>Start: Berlin <br> Destination: Konstanz <br> Date: 28.05.2021 <br> Time: 12.46 <br>" + 
                                                                        "Amount of Passengers: 2 <br> Price: 98€ <br> Delay: No Delay</p>";
                                                var newOkButton = document.createElement("a");
                                                newOkButton.innerHTML = "OK"; 
                                                $(newOkButton).on("click", function () { this.parentNode.parentNode.remove();
                                                                                        makeObjSel();
                                                                                        $('#interface').css({"filter": ""});
                                                                                        });
                                                $(newOkButton).addClass("btn selectable");
                                                newContent.appendChild(newOkButton);
                                                ticketInfPanel.appendChild(newContent);
                                                updateSeleList();
                                                });
            }
            else 
            {
                $(okButton).on("click", function() { this.parentNode.remove(); 
                    makeObjSel();
                    document.querySelector(".numberPas").innerHTML = ticketInfPanel.querySelector("#inputNumberBlock").value;
                    $('#interface').css({"filter": ""})});
            }
            $(okButton).addClass("btn selectable");
            $(okButton).css({"position": "relative", "top": "30px"});
            ticketInfPanel.appendChild(okButton);
            if(bool)
            {
                document.body.appendChild(ticketInfPanel); 
            }
            else 
            {
                document.body.appendChild(ticketInfPanel); 
            }           
        break;

        case("keyboard"): // Makes keyboard appear/disappear
            var keyboard = document.getElementById("keyboard"); 
            if (bool)
            {
                keyboard.style.cssText = "top: 50%; transform: scale(1);";
                document.querySelector("#inputStartDest").style.left = "25%";
                $('.letter').addClass('uppercase');

                // Make the current input blink
                if(document.getElementsByClassName("inputBlink").length > 0) 
                {
                    document.getElementsByClassName("inputBlink")[0].classList.remove("inputBlink");
                }
                currentFocus.classList.add("inputBlink");
                currentFocus.value = "";
        
                // Add and show 6 possilbe City choices
                document.querySelector("#displayedCities").style.cssText = "top: 37px; transform: scale(1);";
                if (document.querySelector("#displayedCities").getElementsByTagName("LI").length == 0)
                {
                    for (var i=0; i<6; i++)
                    {
                            var city; 
                            city = document.createElement("LI");
                            city.innerHTML = filteredCities[i];
                            city.setAttribute("name", filteredCities[i]);
                            $(city).on("click", function () { setValue("city"); });
                            $(city).addClass("selectable");
                            document.querySelector("#displayedCities").appendChild(city);
                    }
                } 

                for(let i=0; i<document.querySelector("#displayedCities").getElementsByTagName("LI").length; i++) // Put some visual attention on the proposals
                {
                    document.querySelector("#displayedCities").getElementsByTagName("LI")[i].classList.add("attention");
                    setTimeout(function() {document.querySelector("#displayedCities").getElementsByTagName("LI")[i].classList.remove("attention");},600);
                }
            }
            else // Make keyboard disappear
            {
                if(document.getElementsByClassName("inputBlink").length > 0) 
                {
                    document.getElementsByClassName("inputBlink")[0].classList.remove("inputBlink");
                }

                setTimeout(function() {document.querySelector("#inputStartDest").style.left = "15%";}, 150);
                 // Let keyboard and List disappear, but with a smooth effect
                keyboard.style.transform = "scale(0.9)";
                setTimeout(function () {keyboard.style.top = "5000px";}, 150);
                document.querySelector("#displayedCities").style.transform = "scale(0.9)";
                setTimeout(function () {
                    document.querySelector("#displayedCities").style.top = "5000px";
                    // Removes all the displayed city proposals
                    var displayedNodes = document.querySelectorAll("#displayedCities LI");
                    displayedNodes = Array.prototype.slice.call(displayedNodes);
                    for (var i=0; i<displayedNodes.length; i++)
                    {
                        displayedNodes[i].parentNode.removeChild(displayedNodes[i]); 
                    }}, 150);
            }
            break;


        case("calendar"): //Make calender appear/disappear
            if(bool)
            {   //Make current selected date green
                var listDays = document.querySelectorAll(".day");
                listDays = Array.prototype.slice.call(listDays);
                var classDate = "calendar-day-" + document.querySelector("#dateInput").dataset.year + "-" + document.querySelector("#dateInput").dataset.month + "-" + document.querySelector("#dateInput").dataset.day; // get current selected date
                if(document.querySelector(".selected") != null)
                {
                    document.querySelector(".selected").classList.remove("selected");
                }
                for(let i=0; i<listDays.length; i++)
                {
                    if(listDays[i].classList.contains(classDate))
                    {
                        listDays[i].classList.add("selected");
                    }
                }
                if(comeFromSummary)
                {
                    var newCalender = document.createElement("div");
                    newCalender.classList.add("content");
                    newCalender.innerHTML = "<div class='cal1'></div>";
                    document.querySelector("#sixthPanel").appendChild(newCalender);
                }
                if (document.querySelector("#displayTimeChoice").style.transform == "scale(1)") // If Timechoice is already displayed remove it directly, without transition
                {
                    document.querySelector("#displayTimeChoice").style.top = "5000px"; 
                }
                showElement("time", false);
                if(document.getElementsByClassName("inputBlink").length > 0) 
                {
                    document.getElementsByClassName("inputBlink")[0].classList.remove("inputBlink");
                }
                event.target.classList.add("inputBlink");
                document.querySelector(".content").style.cssText = "left: 0px; transform: scale(1);";
                
                document.querySelector(".clndr-previous-button").classList.add("selectable");
                document.querySelector(".clndr-next-button").classList.add("selectable");
                updateSeleList();
            }
            else 
            {
                if(document.getElementsByClassName("inputBlink").length > 0) 
                {
                    document.getElementsByClassName("inputBlink")[0].classList.remove("inputBlink");
                }
                document.querySelector(".content").style.transform = "scale(0.9)";
                setTimeout(function () {document.querySelector(".content").style.left = "5000px";}, 150);
            }   
            break;

        case("time"): // Display/Remove the time choices 
            if(bool)
            {
                if (document.querySelector(".content").style.transform == "scale(1)") // If Calendar is already displayed remove it directly, without transition
                {
                    document.querySelector(".content").style.left = "5000px"; 
                }
                showElement("calendar", false);
                if(document.getElementsByClassName("inputBlink").length > 0)   // Make the current input blink
                {
                    document.getElementsByClassName("inputBlink")[0].classList.remove("inputBlink");
                }
                currentFocus.classList.add("inputBlink");
                $("#displayTimeChoice").css({"top": "215px", "transform": "scale(1)"});

                if(!document.querySelectorAll("#displayTimeChoice LI").length > 0) // If the time choices were not added yet 
                {   // Add all the possilbe time choices 
                    for(let i=0; i<24; i++)
                    {   
                        var timeField;
                        timeField = document.createElement("LI");
                        timeField.innerHTML = i + ":00";
                        $(timeField).on("click", function () { setValue("time");});
                        $(timeField).addClass("selectable");
                        document.querySelector("#displayTimeChoice").appendChild(timeField);
                    }    
                }
            }
            else // Remove time choices
            {
                if(document.getElementsByClassName("inputBlink").length > 0) 
                {
                    document.getElementsByClassName("inputBlink")[0].classList.remove("inputBlink");
                }
                // Make time choice disappear, but with a smooth effect
                document.querySelector("#displayTimeChoice").style.transform = "scale(0.9)";
                setTimeout(function () {document.querySelector("#displayTimeChoice").style.top = "5000px";}, 150);
            }
            break;        
        
            case("cash"): // Creates the "Cash-Payment" Panel
            if(bool)
            {
                delObjSel();
                $('#interface').css({"filter": "blur(8px)"});
                // Create Panel to show Instructions for paying cash
                var cashPanel; 
                cashPanel = document.createElement("div"); 
                cashPanel.classList.add("alertPanel");
                cashPanel.innerHTML = "<p>Please insert the following amount of money: <br></p>" +  
                                    "<p style='position: relative; top: -16px;' class='bold'>" + document.querySelector("#price").innerText + "</p>" +  
                                    "<p>Amount still to be paid: </p>"  +
                                    "<p id='amountCashLeft' style='position: relative; top: -16px;' class='bold'>" + document.querySelector("#price").innerText.slice(0,document.querySelector("#price").innerText.length-1) + "€" + "</p>" + 
                                    "<img style='width: 70%; position: absolute; left: 15%; top: 71%;' src='Images/money.png'>" +
                                    "<img style='width: 60%; position: absolute; left: 19%; top: 84%;' src='Images/coins.png'>";
                                    document.body.appendChild(cashPanel);

                // "Pay" the amount piecewise and switch to "Receiving Ticket" state, all just handled by Timeout functions
                var amountPayLeft = document.querySelector("#amountCashLeft").innerHTML.slice(0,-1);
                console.log(amountPayLeft);
                setTimeout(function() { document.querySelector("#amountCashLeft").innerHTML = Math.round(0.7 * amountPayLeft) + "€";}, 1500);
                setTimeout(function() { document.querySelector("#amountCashLeft").innerHTML = Math.round(0.4 * amountPayLeft) + "€";}, 3000);
                setTimeout(function() { document.querySelector("#amountCashLeft").innerHTML = Math.round(0.1 * amountPayLeft) + "€";}, 4000);
                setTimeout(function() { document.querySelector("#amountCashLeft").innerHTML = Math.round(0.0 * amountPayLeft) + "€";}, 5000);
                setTimeout(function() { var loadingSign = document.createElement("img"); 
                                        loadingSign.src = "Images/loading.gif";
                                        loadingSign.style.cssText = "width: 60px; display: block; margin-left: auto; margin-right: auto; position: relative; top: -40px"
                                        document.querySelector(".alertPanel").appendChild(loadingSign);}, 4000);
                setTimeout(function() { document.getElementById("receiveTicket").style.cssText = "top: -600px; transform: scale(1);";
                                        document.querySelector(".tabs").style.cssText = "position: relative; top: 5000px;"
                                        cashPanel.remove();
                                        $('#interface').css({"filter": ""});
                                        document.querySelector("#endArrow").style.animation = "moveDown 2s ease-in-out infinite";
                                        makeObjSel();}, 6000);
                setTimeout(function() { window.location.reload(false); }, 15000); // Starts the application from the beginning
                
            }
            break;
        case("credit"): // Creates the "Credit-Payment" Panel
            if(bool)
            {
                delObjSel();
                $('#interface').css({"filter": "blur(8px)"});
                var creditPanel; 
                creditPanel = document.createElement("div"); 
                creditPanel.classList.add("alertPanel");
                creditPanel.innerHTML = "<p>Please follow the instructions of the card reader. </p>" +  
                                    "<p>Contactless paying is supported.</p>" + 
                                    "<img src='Images/cards.png' style='width: 90%; position: absolute; left: 5%; top: 77%;'>";
                                    document.body.appendChild(creditPanel);

                setTimeout(function() { var loadingSign = document.createElement("img"); 
                                        loadingSign.src = "Images/loading.gif";
                                        loadingSign.style.cssText = "width: 100px; display: block; margin-left: auto; margin-right: auto;"
                                        document.querySelector(".alertPanel").appendChild(loadingSign);}, 3000);
                setTimeout(function() { document.getElementById("receiveTicket").style.cssText = "top: -600px; transform: scale(1);";
                                        document.querySelector(".tabs").style.cssText = "position: relative; top: 5000px;"
                                        creditPanel.remove();
                                        $('#interface').css({"filter": ""});
                                        document.querySelector("#endArrow").style.animation = "moveDown 2s ease-in-out infinite";
                                        makeObjSel();}, 4000);
                setTimeout(function() { window.location.reload(false); }, 15000); // Starts the application from the beginning
            }
            break;
        }
        updateSeleList();
}

function showHelp(i) //Show helping informations, if the information symbol in the upper right corner gets clicked
{
    delObjSel();
    $('#interface').css({"filter": "blur(8px)"});
    var helpPanel = document.createElement("div"); 
    $(helpPanel).addClass("alertPanel");
    var okButton = document.createElement("a");
    okButton.innerHTML = "OK"; 
    $(okButton).on("click", function() {this.parentNode.remove(); makeObjSel(); $('#interface').css({"filter": ""});});
    $(okButton).addClass("btn selectable");
    $(okButton).css({"position": "relative", "top": "10px"});

    switch(i) 
    {
        case 0:
            helpPanel.innerHTML = "<h2>How to start the interaction:</h2>" + 
                                "<ul><li>Your hand motion gets captured by the device in front of the display</li>" + 
                                "<li>Please place your hand above it and then move it towards the button</li>" + 
                                "<li>Stay on the button for a short time to select it</li></ul>";
            helpPanel.appendChild(okButton);
            document.body.appendChild(helpPanel);
            document.querySelector(".alertPanel").style.top = "120px";
            break;

        case 1: 
            helpPanel.innerHTML = "<h2>Choose your desired ticket opition: </h2>" + 
                                "<ul><li><b>Single-Use:</b> Buy a ticket from city A to city B at a certain time</li>" + 
                                "<li><b>Time Ticket:</b> Buy weekly, monthly or annual tickets</li>" + 
                                "<li><b>Ticket Information:</b>Receive information about an already bought ticket</li></ul>";
            helpPanel.appendChild(okButton);
            document.body.appendChild(helpPanel);
            break;

        case 2:
            helpPanel.innerHTML = "<h2>Choose your desired start and destination:</h2>" + 
                                "<ul><li>Select input field to enter your desired City</li>" + 
                                "<li>Enter cityname with the letters on the keyboard, or select one out of the proposals</li>" + 
                                "<li>If you sucessfully selected start and destination, you can continue with the next step</li></ul>"; 
            helpPanel.appendChild(okButton);
            document.body.appendChild(helpPanel);
            break;

        case 3:
            helpPanel.innerHTML = "<h2>Enter amount of passengers: </h2>" +  
                                "<ul><li>Select 'Change Value'-button to enter a new number</li>" + 
                                "<li>Show the corresponding number of fingers above the camera and hold the pose for 2 seconds</li>" + 
                                "<li>If more than 5 people are travelling, please select the 'More than 5 people'-button and enter the number manually</li></ul>"
            helpPanel.appendChild(okButton);
            document.body.appendChild(helpPanel);
            break;

        case 4:
            helpPanel.innerHTML = "<h2>Choose your desired date & time: </h2>" + 
                                "<ul><li>Click on the input field to open the calender/time choice</li>" + 
                                "<li>Select your desired date/time by simply hovering over it</li></ul>"; 
            helpPanel.appendChild(okButton);
            document.body.appendChild(helpPanel);
            break;

        case 5: 
            helpPanel.innerHTML = "<h2>Choose your desired connection: </h2>" + 
                                "<ul><li>All possible connections are displayed</li>" + 
                                "<li>Click on your desired connection to select it</li></ul>" 
            helpPanel.appendChild(okButton);
            document.body.appendChild(helpPanel);
            break;

        case 6: 
            helpPanel.innerHTML = "<h2>Summary of the data: </h2>" + 
                                "<ul><li>Here you can find an overview of all the entered data</li>" + 
                                "<li>To change an element, simply click on the corresponding input field</li>" + 
                                "<li>If all data is correct, you can select your prefered payment method</li></ul>"; 
            helpPanel.appendChild(okButton);
            document.body.appendChild(helpPanel);
            break;

        case 7: 
            helpPanel.innerHTML = "<h2>Receiving of the ticket: </h2>" + 
                                    "<ul><li>Please take out your printed ticket</li>" + 
                                    "<li>If you would like to buy another ticket, please press the house button</li>" + 
                                    "<li>Otherwise, the machine will automatically return to the home display in a few seconds</li></ul>"; 
            helpPanel.appendChild(okButton);
            document.body.appendChild(helpPanel);
            break;
    }
    updateSeleList();
}

function setValue(type) // Function to react when an Element gets clicked and the system has to store the value
{ 
    switch(type)
    {
        case "city": // If a city proposal gets selected ...
            currentFocus.value = event.target.textContent;
            console.log("city selected");
            showElement("keyboard", false);
            if(document.querySelector("#startInput").value.length != 0 && document.querySelector("#destInput").value.length != 0)  // If start and destination are entered, make next button selectable
            {
                document.querySelectorAll(".nextBtn")[0].style.opacity = 1;
                document.querySelectorAll(".nextBtn")[0].classList.add("selectable");
                updateSeleList();
                if(!comeFromSummary)
                {
                    document.querySelector(".nextBtn").onclick = function func1 () { changePanel(2)};
                }
                else {
                    document.querySelectorAll(".nextBtn")[0].onclick = function func() {changePanel(4);};
                }
                
            }
            break;
        
        case "time": // If a time choice gets selected ...
            currentFocus.value = event.target.textContent;
            var posPoint = currentFocus.value.indexOf(":");
            document.querySelector("#timeInput").dataset.hour = currentFocus.value.slice(0, posPoint);
            document.querySelector("#timeInput").dataset.minute = currentFocus.value.slice(posPoint+1, currentFocus.value.length);
            console.log("time selected");
            showElement("time", false);
            comeFromSummary = false; 
            break;

        case "connection": // If a connection gets selected
            if(document.getElementById("alertMessage") != null)
            {
                document.getElementById("alertMessage").remove();
            }
            var index = event.target.getAttribute("id");
            if(index == null) 
            {
                index = event.target.parentNode.getAttribute("id");
            }
            for(let i=0; i<possibleCon.length; i++)
            {
                if(possibleCon[i].id == index)
                {
                    selConnection = possibleCon[i];
                }
            }
            console.log("connection selected");
            comeFromSummary = false; 
            changePanel(5);
            break;
    }
}

function delObjSel() // Make all objects not selectable anymore (so Interaction is just possible with the "OK-Button")
{
    selEleBackup = document.querySelectorAll(".selectable");
    for(let i=0; i<selEleBackup.length; i++) 
    {
        selEleBackup[i].classList.remove("selectable");
    }
}

function makeObjSel () // Make all objects selectable again
{
    setTimeout(function() {
        for(let i=0; i<selEleBackup.length; i++) 
        {
            selEleBackup[i].classList.add("selectable");
        }
        updateSeleList();
    }, 800);
}

$(function(){ // This part is for giving the keyboard its functions 
    let shift = false;
    $('#keyboard li').click(function(){
        var $this = $(this),
            character = $this.html(); // If it's a lowercase letter, nothing happens to this variable
            letterClicked = true;
            $this.addClass("pushed");
        
            setTimeout(function() {$this.removeClass("pushed"); letterClicked=false;}, 700);

        // Shift keys
		if ($this.hasClass('left-shift') || $this.hasClass('right-shift')) {
			$('.letter').toggleClass('uppercase');
			$('.symbol span').toggle();
			shift = (shift === true) ? false : true;
			capslock = false;
			return false;
		}
        // Uppercase letter
		if ($this.hasClass('uppercase')) character = character.toUpperCase();
		// Remove shift once a key is clicked.
		if (shift === true) {
			$('.letter').toggleClass('uppercase');
			shift = false;
		}
        // Delete
        if ($this.hasClass('delete')) {
            currentFocus.value = currentFocus.value.slice(0,-1);
            compInputCity(); // Compare the input with the saved citynames
            if(currentFocus.value == "")
            {
                $(".letter").addClass("uppercase");
            }
            return false;
        }
        // Delete All
        if ($this.hasClass('deleteAll')) {
            currentFocus.value = "";
            compInputCity(); // Compare the input with the saved citynames
            $(".letter").addClass("uppercase");
            return false;
        }
        // Remove big letter
        $(".letter").removeClass("uppercase");
        // Space
        if ($this.hasClass('space')) {
            character = ' ';
            $(".letter").addClass("uppercase");
        }
        currentFocus.value += character;  // Add the character to the Inputbox
        compInputCity(); // Compare the input with the saved citynames
    });
});

$(function() {
    document.getElementById("firstPanel").classList.add("myContent"); // Class "content" gets added to the first Panel, because otherwise it doesnt get recognized by "getElementsByClassName"

    // Create List of all Cities in the Database
    var allCities = [];
    for (var i=0; i<connectionData.length; i++)
    {
        allCities.push(connectionData[i].Start);
        allCities.push(connectionData[i].Destination);
    }
    filteredCities = allCities.filter((v, i, a) => a.indexOf(v) === i);

    // Get current Date and Time
    document.querySelector("#dateInput").dataset.year = dateTime.getFullYear();
    var month = dateTime.getMonth()+1;
    if(month < 10) // Add leading Zero
    {
        month = "0" + month;
    }
    document.querySelector("#dateInput").dataset.month = month;
    var day = dateTime.getDate();
    if(day < 10) // Add leading Zero
    {
        day = "0" + day;
    }
    document.querySelector("#dateInput").dataset.day = day;
    document.querySelector("#dateInput").value = day + "/" + month + "/" + dateTime.getFullYear();

    var minutes = dateTime.getMinutes();
    if(minutes < 10) // Add leading Zero
    {
        minutes = "0" + dateTime.getMinutes();
    }
    document.querySelector("#timeInput").value = dateTime.getHours() + ":" + minutes;
    document.querySelector("#timeInput").dataset.hour = dateTime.getHours();
    document.querySelector("#timeInput").dataset.minute = minutes;

    // Give all 'prevPageButton' their functionallity
    var prevButtons = document.querySelectorAll(".prevBtn");
    for(let i=0; i<prevButtons.length; i++)
    {
        prevButtons[i].onclick = function func() {  
            var contents = document.querySelectorAll(".myContent");
            contents = Array.prototype.slice.call(contents);
            let indexPanel = (element) => element.id == document.querySelector(".myContent.active").id; // Gets the index of active Content
            indexPanel = contents.findIndex(indexPanel)-1;
            changePanel(indexPanel);
        };
        prevButtons[i].classList.add("selectable");
    }

    //Make all interactive Elements selectable
    for(let i=0;i<tabsPane.length;i++)
    {
        tabsPane[i].classList.add("selectable"); 
        tabsPane[i].addEventListener("click",function() { changePanel(i); });
    }
    for(let i=0; i<document.getElementsByClassName("helpSymbol").length; i++)
    {
        document.getElementsByClassName("helpSymbol")[i].classList.add("selectable");
        document.getElementsByClassName("helpSymbol")[i].addEventListener("click", function() { showHelp(i);});
    }
    for(let i=1; i<document.getElementsByClassName("nextBtn").length; i++)
    {
        document.querySelectorAll(".nextBtn")[i].classList.add("selectable");
    }    
    for(let i=0; i<document.getElementsByTagName("button").length; i++)
    {
        document.getElementsByTagName("button")[i].classList.add("selectable");
    }
    for(let i=0; i<document.getElementsByTagName("input").length; i++)
    {
        document.getElementsByTagName("input")[i].classList.add("selectable");
    }
    var arr = Array.prototype.slice.call(document.querySelector('#keyboard').getElementsByTagName("li"));
    arr.forEach(element => {
        element.classList.add("selectable");        
    }); 
    updateSeleList();
})

// With this part an external JSON file could be read it, so its connection data can get processed.
/*
fetch("myJSON.json")
        .then(Response => Response.json())
        .then(data => {
           connectionData = data;
        })
*/