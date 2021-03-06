import { ConnectionState, Party, Playback, Track } from '../state';
import { requireAuth } from '../util/auth';
import firebase, { firebaseNS } from '../util/firebase';

import { ErrorAction, PayloadAction, Types } from '.';

export type Actions =
    | BecomePlaybackMasterAction
    | CleanupPartyAction
    | CreatePartyFailAction
    | CreatePartyStartAction
    | InstallPlaybackMasterAction
    | JoinPartyFailAction
    | JoinPartyStartAction
    | ResignPlaybackMasterAction
    | OpenPartyFailAction
    | OpenPartyFinishAction
    | OpenPartyStartAction
    | UpdateNetworkConnectionStateAction
    | UpdatePartyAction
    | UpdateTracksAction
    | UpdateUserVotesAction
    | UpdatePlaybackStateAction;

export interface BecomePlaybackMasterAction {
    type: Types.BECOME_PLAYBACK_MASTER;
}

export interface CleanupPartyAction {
    type: Types.CLEANUP_PARTY;
}

export interface CreatePartyStartAction {
    type: Types.CREATE_PARTY_Start;
}

export interface CreatePartyFailAction extends ErrorAction {
    type: Types.CREATE_PARTY_Fail;
}

export interface InstallPlaybackMasterAction {
    type: Types.INSTALL_PLAYBACK_MASTER;
}

export interface JoinPartyFailAction extends PayloadAction<Error> {
    type: Types.JOIN_PARTY_Fail;
    error: true;
}

export interface JoinPartyStartAction {
    type: Types.JOIN_PARTY_Start;
}

export interface OpenPartyFailAction extends PayloadAction<Error> {
    type: Types.OPEN_PARTY_Fail;
    error: true;
}

export interface OpenPartyFinishAction extends PayloadAction<Party> {
    type: Types.OPEN_PARTY_Finish;
}

export interface OpenPartyStartAction extends PayloadAction<string> {
    type: Types.OPEN_PARTY_Start;
}

export interface ResignPlaybackMasterAction {
    type: Types.RESIGN_PLAYBACK_MASTER;
}

export interface UpdateNetworkConnectionStateAction extends PayloadAction<ConnectionState> {
    type: Types.UPDATE_NETWORK_CONNECTION_STATE;
}

export interface UpdatePartyAction extends PayloadAction<Party> {
    type: Types.UPDATE_PARTY;
}

export interface UpdateTracksAction extends PayloadAction<Record<string, Track> | null> {
    type: Types.UPDATE_TRACKS;
}

export interface UpdateUserVotesAction extends PayloadAction<Record<string, boolean> | null> {
    type: Types.UPDATE_USER_VOTES;
}

export interface UpdatePlaybackStateAction extends PayloadAction<Partial<Playback>> {
    type: Types.UPDATE_PLAYBACK_STATE;
}

export function becomePlaybackMaster(): BecomePlaybackMasterAction {
    return { type: Types.BECOME_PLAYBACK_MASTER };
}

export function cleanupParty(): CleanupPartyAction {
    return { type: Types.CLEANUP_PARTY };
}

export function createPartyFail(err: Error): CreatePartyFailAction {
    return {
        type: Types.CREATE_PARTY_Fail,
        error: true,
        payload: err,
    };
}

export function createPartyStart(): CreatePartyStartAction {
    return { type: Types.CREATE_PARTY_Start };
}

export async function createNewParty(
    displayName: string,
    masterId: string,
    country: string,
): Promise<string> {
    const { uid } = await requireAuth();
    const now = firebaseNS.database!.ServerValue.TIMESTAMP;
    const userNamePosessive = displayName.endsWith('s') ? "'" : "'s";

    const party: Party = {
        country,
        created_at: now as any,
        created_by: uid,
        name: `${displayName}${userNamePosessive} Party`,
        playback: {
            last_change: now as any,
            last_position_ms: 0,
            master_id: null,
            playing: false,
            target_playing: null,
        },
        short_id: String(Math.floor(Math.random() * 1000000)),
    };

    const result = await firebase.database!()
        .ref('/parties')
        .push(party);

    if (!result.key) {
        throw new Error("Missing ID of newly created party!");
    }

    return result.key;
}

export function joinPartyFail(err: Error): JoinPartyFailAction {
    return {
        type: Types.JOIN_PARTY_Fail,
        error: true,
        payload: err,
    };
}

export function joinPartyStart(): JoinPartyStartAction {
    return { type: Types.JOIN_PARTY_Start };
}

export function installPlaybackMaster(): InstallPlaybackMasterAction {
    return { type: Types.INSTALL_PLAYBACK_MASTER };
}

export function openPartyFail(err: Error): OpenPartyFailAction {
    return {
        type: Types.OPEN_PARTY_Fail,
        error: true,
        payload: err,
    };
}

export function openPartyFinish(party: Party): OpenPartyFinishAction {
    return {
        type: Types.OPEN_PARTY_Finish,
        payload: party,
    };
}

export function openPartyStart(id: string): OpenPartyStartAction {
    return {
        type: Types.OPEN_PARTY_Start,
        payload: id,
    };
}

export function resignPlaybackMaster(): ResignPlaybackMasterAction {
    return { type: Types.RESIGN_PLAYBACK_MASTER };
}

export async function resolveShortId(shortId: string): Promise<string | null> {
    const snapshot = await firebase.database!()
        .ref('/parties')
        .orderByChild('short_id')
        .equalTo(shortId)
        .once('value');

    if (snapshot.numChildren() < 1) {
        return null;
    }

    const result: Record<string, Party> = snapshot.val();
    const possibleLongId = Object.keys(result).reduce(
        (acc, k) => result[k].created_at > (result[acc] || { created_at: -1 }).created_at ? k : acc,
        '',
    );

    return possibleLongId || null; // Filter out empty IDs
}

export function updateConnectionState(isConnected: ConnectionState): UpdateNetworkConnectionStateAction {
    return {
        type: Types.UPDATE_NETWORK_CONNECTION_STATE,
        payload: isConnected,
    };
}

export function updateParty(party: Party): UpdatePartyAction {
    return {
        type: Types.UPDATE_PARTY,
        payload: party,
    };
}

export function updateTracks(tracks: Record<string, Track> | null): UpdateTracksAction {
    return {
        type: Types.UPDATE_TRACKS,
        payload: tracks,
    };
}

export function updateUserVotes(votes: Record<string, boolean> | null): UpdateUserVotesAction {
    return {
        type: Types.UPDATE_USER_VOTES,
        payload: votes,
    };
}

export function updatePlaybackState(payload: Partial<Playback>): UpdatePlaybackStateAction {
    return { type: Types.UPDATE_PLAYBACK_STATE, payload };
}
