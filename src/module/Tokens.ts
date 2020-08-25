import { scaleNPCToLevel } from './cr-scaler/NPCScaler';
import Settings from './Settings';

declare function srcExists(path: string): Promise<boolean>;

export function onSetupTokensContextHook(html: JQuery, buttons: any[]) {
    buttons.unshift({
        name: 'Setup Token',
        icon: '<i class="fas fa-wrench"></i>',
        condition: (li: JQuery<HTMLLIElement>) => {
            const id = li.data('entity-id') as string;
            const actor = game.actors.get(id);

            return actor.data.type === 'npc';
        },
        callback: async (li: JQuery<HTMLLIElement>) => {
            const id = li.data('entity-id') as string;
            const actor = game.actors.get(id);

            await setupActorToken(actor);
        },
    });
}

function normalizeTokenName(actorName: string, num: number) {
    return `${actorName.replace(/\s/g, '_')}_${pad(num)}`;
}

function pad(n: number, count: number = 2) {
    let result = n.toString();
    while (result.length < count) {
        result = `0${result}`;
    }
    return result;
}

function getNameParts(name: string) {
    return name.replace(/,/g, '').split(' ');
}

function getValidName(name: string, basePath: string, files: string[], reverse: boolean = false) {
    let parts = getNameParts(name);
    const pop = reverse ? parts.shift : parts.pop;

    let path: string;
    while (parts.length > 0) {
        path = `${basePath}/${parts.join('_')}_01.png`;

        if (files.includes(path)) {
            return `${basePath}/${parts.join('_')}_??.png`;
        }

        pop.call(parts);
    }

    return null;
}

export async function setupActorToken(actor: Actor): Promise<void> {
    const basePath = Settings.get(Settings.KEY_TOKEN_PATH);
    const folderTarget = Settings.get(Settings.KEY_TOKEN_TARGET);
    let files: string[] = (await FilePicker.browse(folderTarget, basePath)).files;

    const actorLink: boolean = actor.data.token['actorLink'];

    const actorUpdate: object = {
        ['token.displayBars']: 40,
        ['token.displayName']: 50,
        ['token.disposition']: -1,
        ['token.randomImg']: !actorLink,

        ['token.vision']: false,
        ['token.dimSight']: 120,
        ['token.brightSight']: 60,
    };

    let path: string | null = getValidName(actor.name, basePath, files);
    if (path === null) {
        path = getValidName(actor.name, basePath, files, true);
    }

    if (path === null) {
        ui.notifications.warn(`Could not find a token image for ${actor.name}.`);
    } else {
        actorUpdate['token.img'] = path;
    }

    await actor.update(actorUpdate);

    ui.notifications.info(`Updated ${actor.name}`);
}
