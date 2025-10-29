document.addEventListener("DOMContentLoaded", function() {
    const { username, displayName, userId } = window.dashboardData;

    const twitchIdValue = `${userId}`;
    const sessionTimeValue = `${new Date().toLocaleString('de-DE')}`;

    const twitchIdElement = document.getElementById("twitchId");
    const sessionElement = document.getElementById("session");
    const usernameElement = document.getElementById("displayName");

    twitchIdElement.innerHTML = `Ihre Twitch ID: <span class="text-white font-mono">${twitchIdValue}</span>`;
    sessionElement.textContent = `Session aktiv seit: ${sessionTimeValue}`;
    usernameElement.textContent = `Willkommen im Dashboard, ${username || 'Benutzer'} | ${displayName}!`;
});