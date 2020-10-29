// function to reset time display
function resetTimer(datetime) {
    const dateString = parseDateTime(datetime);
    elapsedTime = 0;

    $('#start-time').text(dateString);
    $('#current-time').text(dateString);
    $('#elapsed-time').text('00:00');
}

// function to convert elapsed time to displayable string
function parseTime(time) {
    let outputString = '';
    let seconds = time / 1000;
    const years = Math.floor(seconds / 31557600);
    if (years > 0) {
        outputString += `${years}y `;
        seconds = seconds % 31557600;
    }
    const days = Math.floor(seconds / 86400);
    if (days > 0 || years > 0) {
        outputString += `${days}d `;
        seconds = seconds % 86400;
    }
    const hours = Math.floor(seconds / 3600);
    if (hours.toString().length < 2) {
        outputString += `0${hours}:`;
    } else {
        outputString += `${hours}:`;
    }
    seconds = seconds % 3600;
    const minutes = Math.floor(seconds / 60);
    if (minutes.toString().length < 2) {
        outputString += `0${minutes}:`;
    } else {
        outputString += `${minutes}:`;
    }
    seconds = Math.floor(seconds % 60);
    if (seconds.toString().length < 2) {
        outputString += `0${seconds}`;
    } else {
        outputString += `${seconds}`;
    }
    return outputString;
}

// function to convert datetime object to displayable string
function parseDateTime(datetime) {
    let month = datetime.getUTCMonth() + 1;
    let day = datetime.getUTCDate();
    const year = datetime.getUTCFullYear();
    let hour = datetime.getUTCHours();
    let minute = datetime.getUTCMinutes();

    if (day.toString().length < 2) {
        day = '0' + day.toString();
    }
    if (month.toString().length < 2) {
        month = '0' + month.toString();
    }
    if (hour.toString().length < 2) {
        hour = '0' + hour.toString();
    }
    if (minute.toString().length < 2) {
        minute = '0' + minute.toString();
    }

    return `${month}/${day}/${year} ${hour}:${minute}`;
}

// function to update selection list
function loadSelectList(bodySet, bodyList) {
    $('#object-select').empty();
    $('#object-select').append('<ul id="object-list"><li id="0" class="object-selector">Solar system barycenter</li></ul>');

    const simpleOptions = ['planets', 'dwarves', 'planets-dwarves'];
    const systemOptions = ['full', 'inner', 'outer', '3', '4', '5', '6', '7', '8', '9'];

    if (simpleOptions.includes(bodySet)) {
        for (let body of bodyList) {
            let name = null;
            if (body.name) {
                name = body.name;
            } else {
                name = body.designation;
            }

            let bodyClass = 'object-selector';
            if (!body.available) {
                bodyClass += '-unavailable';
            }

            const $nextItem = $(`<li id="${body.id}" class="${bodyClass}">${name}</li>`);
            $('#object-list').append($nextItem);
        }
    } else if (systemOptions.includes(bodySet)) {
        const independentIds = [10, 199, 299, 1, 136108, 136199, 136472];

        const $earth = $('<li class="collapsed"><span class="system-selector"><b>Earth-Moon system</b> <span class="icon">&#9662</span></span><ul class="object-container"><li id="3" class="object-selector indented hidden">System barycenter</li></ul></li>');
        const $martian = $('<li class="collapsed"><span class="system-selector"><b>Martian system</b> <span class="icon">&#9662</span></span><ul class="object-container"><li id="4" class="object-selector indented hidden">System barycenter</li></ul></li>');
        const $jovian = $('<li class="collapsed"><span class="system-selector"><b>Jovian system</b> <span class="icon">&#9662</span></span><ul class="object-container"><li id="5" class="object-selector indented hidden">System barycenter</li></ul></li>');
        const $saturnian = $('<li class="collapsed"><span class="system-selector"><b>Saturnian system</b> <span class="icon">&#9662</span></span><ul class="object-container"><li id="6" class="object-selector indented hidden">System barycenter</li></ul></li>');
        const $uranian = $('<li class="collapsed"><span class="system-selector"><b>Uranian system</b> <span class="icon">&#9662</span></span><ul class="object-container"><li id="7" class="object-selector indented hidden">System barycenter</li></ul></li>');
        const $neptunian = $('<li class="collapsed"><span class="system-selector"><b>Neptunian system</b> <span class="icon">&#9662</span></span><ul class="object-container"><li id="8" class="object-selector indented hidden">System barycenter</li></ul></li>');
        const $plutonian = $('<li class="collapsed"><span class="system-selector"><b>Plutonian system</b> <span class="icon">&#9662</span></span><ul class="object-container"><li id="9" class="object-selector indented hidden">System barycenter</li></ul></li>');

        const objectSelectors = {
            3: { li: $earth, appended: false },
            4: { li: $martian, appended: false },
            5: { li: $jovian, appended: false },
            6: { li: $saturnian, appended: false },
            7: { li: $uranian, appended: false },
            8: { li: $neptunian, appended: false },
            9: { li: $plutonian, appended: false }
        };

        for (let body of bodyList) {
            let name = null;
            if (body.name) {
                name = body.name;
            } else {
                name = body.designation;
            }

            let bodyClass = 'object-selector';
            if (!body.available) {
                bodyClass += '-unavailable';
            }

            const $nextItem = $(`<li id="${body.id}" class="${bodyClass}">${name}</li>`);

            if (independentIds.includes(body.id)) {
                $('#object-list').append($nextItem);
            } else {
                const sys = body.id.toString()[0];

                if (!objectSelectors[sys].appended) {
                    $(`#object-list`).append(objectSelectors[sys].li);
                    objectSelectors[sys].appended = true;
                }

                $nextItem.addClass('indented');
                $nextItem.addClass('hidden');
                $(`#${sys}`).parent().append($nextItem);
            }
        }
    }
}

// function to display information about selected system
function updateSystemInfo(system) {
    $infoBox = $('#object-info');
    $infoBox.empty();

    $infoBox.append(`<h3>${system.name + ' system'}</h3>`);
    $infoBox.append(`<p class="info-box-small"><b>Primary body:</b> <em class="right-float">${system.primary.name}</em></p>`);

    if (system.id === 0) {
        $infoBox.append(`<p class="info-box-small"><b>Known planets:</b> <em class="right-float">8</em></p>`);
        $infoBox.append(`<p class="info-box-small"><b>Known dwarf planets:</b> <em class="right-float">5</em></p>`);
    } else {
        $infoBox.append(`<p class="info-box-small"><b>Known moons:</b> <em class="right-float">${system.bodies.length - 1}</em></p>`);
    }

    let radius = system.radius;
    let radiusLabel = '';
    if (radius < 1e+6) {
        radius = radius;
        radiusLabel = radiusLabel;
    } else if (radius < 1e+9) {
        radius /= 1e+6;
        radiusLabel = ' million';
    } else if (radius < 1e+12) {
        radius /= 1e+9;
        radiusLabel = ' billion';
    } else {
        radius /= 1e+12;
        radiusLabel = ' trillion';
    }
    radius = +radius.toFixed(2);

    $infoBox.append(`<p class="info-box-small"><b>Approx radius:</b> <em class="right-float">${radius + radiusLabel} km</em></p>`);
}

// function to display information about selected object
function updateObjectInfo(body) {
    $infoBox = $('#object-info');
    $infoBox.empty();

    if (body.name) {
        const $name = $(`<h3>${body.name}</h3>`);
        if (body.designation) {
            $name.append(`<small class="right-float"><em>${body.designation}</em></small>`);
        }
        $infoBox.append($name);
    } else {
        $infoBox.append(`<h3>${body.designation}</h3>`);
    }

    if (body.obj_type) {
        const $type = $(`<p id="info-subtitle" class="info-box-small">${body.obj_type}</p>`);

        if (body.sat_type) {
            $type.append(`<small class="right-float"><em>${body.sat_type}</em></small>`);
        }

        $infoBox.append($type);
    }

    let mass = body.mass;
    let massLabel = '';
    if (mass >= 1e+3 && mass < 1e+6) {
        mass /= 1e+3;
        massLabel = ' thousand';
    } else if (mass < 1e+9) {
        mass /= 1e+6;
        massLabel = ' million';
    } else if (mass < 1e+12) {
        mass /= 1e+9;
        massLabel = ' billion';
    } else if (mass < 1e+15) {
        mass /= 1e+12;
        massLabel = ' trillion';
    } else if (mass < 1e+18) {
        mass /= 1e+15;
        massLabel = ' quadrillion';
    } else if (mass < 1e+21) {
        mass /= 1e+18;
        massLabel = ' quintillion';
    } else if (mass < 1e+24) {
        mass /= 1e+21;
        massLabel = ' sextillion';
    } else if (mass < 1e+27) {
        mass /= 1e+24;
        massLabel = ' septillion';
    } else if (mass < 1e+30) {
        mass /= 1e+27;
        massLabel = ' octillion';
    } else if (mass >= 1e+30) {
        mass /= 1e+30;
        massLabel = ' nonillion';
    }
    mass = +mass.toFixed(2);

    const $mass = $(`<p class="info-box-small"><b>Mass:</b> <em class="right-float">${mass + massLabel} kg</em></p>`);
    $infoBox.append($mass);

    let diameter = 2 * avgRadius(body);
    let diameterLabel = '';
    if (diameter >= 1e+6 && diameter < 1e+9) {
        diameter /= 1e+6;
        diameterLabel = ' million';
    } else if (mass >= 1e+9) {
        diameter /= 1e+9;
        diameterLabel = ' billion';
    }
    diameter = +diameter.toFixed(2);

    const $diameter = $(`<p class="info-box-small"><b>Avg diameter:</b> <em class="right-float">${diameter + diameterLabel} km</em></p>`)
    $infoBox.append($diameter);
}

// function to find average radius of a given body
function avgRadius(obj) {
    return obj.dimensions.reduce((a, b) => a + b) / obj.dimensions.length;
}
