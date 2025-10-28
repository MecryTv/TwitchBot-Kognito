const TWITCH_SCOPES = {
    USER_READ_EMAIL: 'user:read:email',
    USER_EDIT: 'user:edit',
    CHAT_READ: 'chat:read',
    CHAT_EDIT: 'chat:edit',
    MODERATOR_MANAGE_BANNED_USERS: 'moderator:manage:banned_users',
    MODERATOR_MANAGE_CHAT_MESSAGES: 'moderator:manage:chat_messages',
    MODERATOR_MANAGE_ANNOUNCEMENTS: 'moderator:manage:announcements',
    CHANNEL_MODERATE: 'channel:moderate',
    CHANNEL_READ_REDEMPTIONS: 'channel:read:redemptions',
    BITS_READ: 'bits:read',
    CHANNEL_READ_SUBSCRIPTIONS: 'channel:read:subscriptions',
    CLIPS_EDIT: 'clips:edit',
};

/**
 * Gibt ein Array aller definierten Scope-Werte zurück.
 * @returns {string[]} Ein Array von Twitch API Scopes.
 */
function scopes() {
    return Object.values(TWITCH_SCOPES);
}

module.exports = scopes;
