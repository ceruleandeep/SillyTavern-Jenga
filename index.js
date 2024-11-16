import { handleCommand } from './jenga_test.js';
import { executeSlashCommandsWithOptions } from '../../../slash-commands.js';
import { SlashCommandParser } from '../../../slash-commands/SlashCommandParser.js';
import { SlashCommand } from '../../../slash-commands/SlashCommand.js';
import { ARGUMENT_TYPE, SlashCommandArgument } from '../../../slash-commands/SlashCommandArgument.js';
import { SlashCommandEnumValue } from '../../../slash-commands/SlashCommandEnumValue.js';
import { eventSource, event_types } from '../../../../script.js';

const BANG_COMMANDS = {
    START: '!startjenga',
    PULL: '!pullblock',
    PLACE: '!placeblock',
    RESET: '!resetjenga',
};

function registerSlashCommand() {
    SlashCommandParser.addCommandObject(SlashCommand.fromProps({
        name: 'jenga',
        unnamedArgumentList: [SlashCommandArgument.fromProps({
            description: 'help topic',
            typeList: [ARGUMENT_TYPE.STRING],
            enumList: [
                new SlashCommandEnumValue('start', 'Start a game'),
                new SlashCommandEnumValue('pull', 'Pull a block'),
                new SlashCommandEnumValue('place', 'Place a block'),
                new SlashCommandEnumValue('reset', 'Reset game'),
            ],
        })],
        callback: async (arg1, type) => {
            const bangCmd = BANG_COMMANDS[type.toUpperCase()];
            await sendResponse(bangCmd);
        },
        helpString: 'Play Jenga',
    }));
}


async function sendResponse(bangCmd, name = undefined) {
    let response = await handleCommand(bangCmd);
    if (name) {
        response = response.replace(/You /g, `${name} `);
    }
    await executeSlashCommandsWithOptions(`/sys compact=true ${response}`, { source: 'jenga' });
}

async function handleMessage(mesId) {
    const context = SillyTavern.getContext();

    const message = context.chat[mesId];
    if (!message) return;

    const bangCmd = Object.values(BANG_COMMANDS).find(cmd => message.mes.startsWith(cmd));
    if (!bangCmd) return;

    await sendResponse(bangCmd, message.name);
}

export function setup() {
    console.log('[Jenga] doing setup');
    registerSlashCommand();
    eventSource.on(event_types.USER_MESSAGE_RENDERED, async (mesId) => handleMessage(mesId));
    eventSource.on(event_types.CHARACTER_MESSAGE_RENDERED, async (mesId) => handleMessage(mesId));
}

jQuery(async () => {
    console.log('[Jenga] loaded');
    setup();
});
