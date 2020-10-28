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