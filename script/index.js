const dataCheck = "69761aa6-de4c-4013-b455-eb2a91fb2b76";
const anyUID = "d76de5b2-0b7a-42a8-afaa-70743ab61eb2";

var colorIndex = 0;
const colors = [
    "#ffe37d",
    "#c8f7c5",
    "#e08283",
    "#99cccc",
    "#cc99cc",
    "#c4da87",
    "#f7b891",
    "#ffddff",
    "#d05e52",
    "#c5eff7",
    "#ebedb3",
    "#859451",
    "#cbc4c1",
    "#96b695",
    "#f4d03f",
    "#cccc99",    
]

function getColor() {
    if(colorIndex + 1 == colors.length) {
        colorIndex = 0;
    }
    
    const colorToReturn = colors[colorIndex];
    colorIndex++;
    return colorToReturn;
}

$(document).ready(function() {
    $("#button_import").click(function() {
        $("#file_input").click();
    });

    $("#file_input").change(function() {
        // const fileName = fileInput.files[0] ? fileInput.files[0].name : 'No file selected';
        // alert("Selected file: " + fileName);
        const file = $("#file_input")[0].files[0];
        if(file){
            var fileName = file.name;
            var fileExt = fileName.split('.').pop().toLowerCase();

            if(fileExt === 'html') {
                processFile(file);
            } else {
                showErrorMessage('File must be a .html file!');                
            }
        } else {
            showErrorMessage('No file selected!');   
        }
    })
});

function processFile(file) {
    $("#status_txt").text("Status: Processing...");
    var dlButton = $("#button_download");
    if(!dlButton.hasClass("d-none")) {
        dlButton.addClass("d-none");
    }

    var reader = new FileReader();
    reader.onload = function(event) {
        try {
            var htmlContent = event.target.result;

            var tempDiv = $('<div>').html(htmlContent);
            
            //Finding the table
            var mainTable = tempDiv.find("#content #resultList .list");            
    
            if(mainTable.length >= 1) {            
                //If the table exists
                var rows = $(mainTable[0]).children().children();
                
                var jsonOfSubjects = "";
                colorIndex = 0;

                console.log($(rows));
    
                //Foreach row (subject), skipping the first one
                for(var i = 1; i < rows.length; i++) {
                    var currentRow = rows[i];                
    
                    //Go through the columns
                    var entries = $(currentRow).children();                    
                    
                    var variations = $(entries[3]).find("br").length + 1;                                
                    for(var j = 0; j < variations; j++) {
                        var subjectName = $(entries[0]).text().trim();
                        var section = $(entries[3]).html().split("<br>")[j].trim();     
                        var day = $(entries[4]).html().split("<br>")[j].trim();     
                        var time = $(entries[5]).html().split("<br>")[j].trim(); 
                        var room = $(entries[6]).html().split("<br>")[j].trim();
                        var facu = $(entries[7]).text().trim();
    
                        var startTimeHour = time.split('-')[0].split(' ')[0].split(':')[0];
                        var startTimeMinutes = time.split('-')[0].split(' ')[0].split(':')[1];
                        var startTimeMeridian = time.split('-')[0].split(' ')[1];
                        var endTimeHour = time.split('-')[1].split(' ')[0].split(':')[0];
                        var endTimeMinutes = time.split('-')[1].split(' ')[0].split(':')[1];
                        var endTimeMeridian = time.split('-')[1].split(' ')[1];
    
                        startTimeHour = (startTimeMeridian.toLowerCase() === "pm") && parseInt(startTimeHour) < 12 ? parseInt(startTimeHour) + 12 : parseInt(startTimeHour);                    
                        startTimeMinutes = parseInt(startTimeMinutes);
                        endTimeHour = (endTimeMeridian.toLowerCase() === "pm") && parseInt(endTimeHour) < 12 ? parseInt(endTimeHour) + 12 : parseInt(endTimeHour);     
                        endTimeMinutes = parseInt(endTimeMinutes);

                        room = room === "0" ? "TBA" : room;
    
                        //0=MON-5=SAT
                        var onDays = [false, false, false, false, false, false];
    
                        const dayMapping = {
                            "M": 0,
                            "T": 1,
                            "W": 2,
                            "Th": 3,
                            "F": 4,
                            "S": 5
                        };
                        
                        while(day.length > 0) {
                            if(day.startsWith("Th")) {
                                onDays[dayMapping["Th"]] = true;
                                day = day.slice(2);
                            } else {
                                const char = day[0];                            
                                if(char in dayMapping) {                                
                                    onDays[dayMapping[char]] = true;
                                }
                                day = day.slice(1);                            
                            }
                        }
    
                        var json = 
                        `
                            {
                                "uid": "${dataCheck}",
                                "type": "Course",
                                "title": "${subjectName} (${section})",                        
                                "meetingTimes": [
                                    {
                                        "uid": "${anyUID}",
                                        "courseType": "",
                                        "instructor": "${facu}",
                                        "location": "${room}",
                                        "startHour": ${startTimeHour},
                                        "endHour": ${endTimeHour},
                                        "startMinute": ${startTimeMinutes},
                                        "endMinute": ${endTimeMinutes},
                                        "days": {
                                            "monday": ${onDays[0]},
                                            "tuesday":  ${onDays[1]},
                                            "wednesday":  ${onDays[2]},
                                            "thursday":  ${onDays[3]},
                                            "friday":  ${onDays[4]},
                                            "saturday":  ${onDays[5]},
                                            "sunday":  false
                                        }
                                    }
                                ],
                                "backgroundColor": "${getColor()}"
                            },
                        `;
    
                        jsonOfSubjects += json;
                    }
                }
    
                var lastCommaIdx = jsonOfSubjects.lastIndexOf(",");
                var finalJson = 
                `
                {
                    "dataCheck": "69761aa6-de4c-4013-b455-eb2a91fb2b76",
                    "saveVersion": 4,
                    "schedules": [
                        {
                            "title": "",
                            "items": [${
                                jsonOfSubjects.slice(0, lastCommaIdx) + jsonOfSubjects.slice(lastCommaIdx + 1)
                            }]
                        }
                    ],
                    "currentSchedule": 0
                }
                `;
    
                $("#status_txt").text("Status: Done!");
                if(dlButton.hasClass("d-none")) {
                    dlButton.removeClass("d-none");
                }
    
                dlButton.click(function() {
                    var blob = new Blob([finalJson], {type: 'text/plain'});
    
                    var link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = 'csrs2gizmoa.csmo';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                });
    
            } else {
                showErrorMessage("There was an error reading your .html file! (Cannot find element from selector \"#resultList .list\")");
                $("#status_txt").text("Status: Failed!");
                return;
            }
        } catch (err) {
            $("#status_txt").text("Status: Failed!");
            showErrorMessage(`Failed to read file: ${err.message}`);
        }
    }

    reader.readAsText(file);   
}

function showErrorMessage(msg) {
    var errorAlert = $('<div class=\"alert alert-danger alert-dismissible fade show\" role=\"alert\">')
        .text(msg)
        .append(
            $('<button type=\"button\" class=\"btn-close\" data-bs-dismiss=\"alert\" aria-label=\"Close\">')
        );

    $("#error_container").append(errorAlert);
}